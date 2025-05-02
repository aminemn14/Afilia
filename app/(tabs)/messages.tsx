import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/Colors';
import { router } from 'expo-router';
import apiConfig from '@/config/apiConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import useSocket from '../hooks/useSocket';
import { Conversation } from '../types';
import LoadingContainer from '../components/LoadingContainer';

export default function MessagesScreen() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const socketRef = useSocket();

  // Formatage date
  const formatDateTime = (dateString: string) => {
    const dt = new Date(dateString);
    const day = dt.getDate().toString().padStart(2, '0');
    const month = (dt.getMonth() + 1).toString().padStart(2, '0');
    return `${day}/${month}`;
  };

  // Récupérer user, puis conversations ou amis
  useEffect(() => {
    (async () => {
      try {
        const userString = await AsyncStorage.getItem('user');
        if (!userString) {
          setLoadingUser(false);
          return;
        }
        const currentUser = JSON.parse(userString);
        const currentId = currentUser.id || currentUser._id || null;
        setCurrentUserId(currentId);
        setLoadingUser(false);
        if (!currentId) return;
        // charger les conversations existantes
        const convosResponse = await fetch(
          `${apiConfig.baseURL}/api/conversations/${currentId}`
        );
        let conversationsData: Conversation[] = [];
        if (convosResponse.ok) {
          conversationsData = await convosResponse.json();
        }
        // si aucune, charger amis comme conversations
        if (!conversationsData.length) {
          const friendsResp = await fetch(
            `${apiConfig.baseURL}/api/friends/${currentId}`
          );
          if (friendsResp.ok) {
            const friendsData = await friendsResp.json();
            conversationsData = friendsData.map((f: any) => {
              const convoId = [currentId, f.friendId._id].sort().join('_');
              return {
                id: convoId,
                friend: {
                  id: f.friendId._id,
                  name: `${f.friendId.firstname} ${f.friendId.lastname}`,
                  avatar: f.friendId.avatar,
                },
                lastMessage: 'Démarrer une conversation!',
                updatedAt: new Date().toISOString(),
                unread: true,
              };
            });
          }
        }
        setConversations(conversationsData);
      } catch (err: any) {
        console.error('Erreur chargement messages:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Si loading utilisateur
  if (loadingUser) return <LoadingContainer />;

  // Vue invité
  if (!currentUserId) {
    return (
      <View style={styles.mustConnectContainer}>
        <Ionicons
          name="alert-circle-outline"
          size={60}
          color={Colors.gray400}
        />
        <Text style={styles.mustConnectText}>
          Vous devez vous connecter pour accéder à vos messages.
        </Text>
        <TouchableOpacity
          style={styles.connectButton}
          onPress={() => router.replace('/(auth)/welcome')}
        >
          <Text style={styles.connectButtonText}>Se connecter</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Si chargement messages
  if (loading) return <LoadingContainer />;
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Erreur : {error.message}</Text>
      </View>
    );
  }

  // Filtrer
  const filteredConversations = conversations.filter((convo) =>
    convo.friend.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Affichage
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <Text style={styles.title}>Messages</Text>
          <TouchableOpacity
            style={styles.friendListButton}
            onPress={() => router.push('/(friends)')}
          >
            <Ionicons name="people-outline" size={24} color={Colors.white} />
          </TouchableOpacity>
        </View>
        {conversations.length > 0 && (
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher une conversation..."
            placeholderTextColor={Colors.gray400}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        )}
      </View>

      {filteredConversations.length > 0 ? (
        <FlatList
          data={filteredConversations}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.conversationCard}
              onPress={() =>
                router.push({
                  pathname: '/(chat)/conversation/[id]',
                  params: { id: item.id, friend: JSON.stringify(item.friend) },
                })
              }
            >
              <View style={styles.avatarContainer}>
                <Image
                  source={
                    item.friend.avatar
                      ? { uri: item.friend.avatar }
                      : require('@/assets/images/avatar-default.png')
                  }
                  style={styles.avatar}
                />
                {item.unread && <View style={styles.unreadDot} />}
              </View>
              <View style={styles.conversationContent}>
                <View style={styles.conversationHeader}>
                  <Text
                    style={[
                      styles.friendName,
                      item.unread && styles.unreadText,
                    ]}
                  >
                    {item.friend.name}
                  </Text>
                  <Text
                    style={[
                      styles.messageTime,
                      item.unread && styles.unreadTime,
                    ]}
                  >
                    {formatDateTime(item.updatedAt)}
                  </Text>
                </View>
                <Text
                  style={[styles.lastMessage, item.unread && styles.unreadText]}
                  numberOfLines={1}
                >
                  {item.lastMessage}
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={item.unread ? Colors.gray700 : Colors.gray400}
              />
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons
            name="chatbubbles-outline"
            size={64}
            color={Colors.gray400}
          />
          <Text style={styles.emptyStateText}>
            Aucune conversation pour l'instant
          </Text>
          <Text style={styles.emptyStateSubtext}>
            Ajoutez des amis pour discuter !
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.white,
    paddingHorizontal: 20,
    paddingTop: 80,
    paddingBottom: 20,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { fontSize: 32, fontWeight: 'bold', color: Colors.text },
  friendListButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchInput: {
    marginTop: 10,
    backgroundColor: Colors.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    borderColor: Colors.gray200,
    borderWidth: 1,
    color: Colors.text,
  },
  messagesList: { padding: 20 },
  conversationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarContainer: { position: 'relative', marginRight: 12 },
  avatar: { width: 50, height: 50, borderRadius: 25 },
  unreadDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 16,
    height: 16,
    borderRadius: 100,
    backgroundColor: Colors.primary,
    borderWidth: 2,
    borderColor: Colors.white,
  },
  conversationContent: { flex: 1 },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  friendName: { fontSize: 16, fontWeight: '600', color: Colors.text },
  messageTime: { fontSize: 12, color: Colors.gray400, paddingRight: 8 },
  unreadTime: { fontWeight: 'bold', color: Colors.gray700 },
  lastMessage: { fontSize: 14, color: Colors.gray700, marginTop: 4 },
  unreadText: { fontWeight: 'bold' },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 16,
    color: Colors.gray600,
    textAlign: 'center',
  },
  mustConnectContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  mustConnectText: {
    textAlign: 'center',
    fontSize: 18,
    color: Colors.gray600,
    marginVertical: 20,
  },
  connectButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  connectButtonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '700',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: { color: Colors.primary, fontSize: 18 },
});
