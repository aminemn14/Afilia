import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
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

  const formatDateTime = (dateString: string) => {
    const dt = new Date(dateString);
    const day = dt.getDate().toString().padStart(2, '0');
    const month = (dt.getMonth() + 1).toString().padStart(2, '0');
    return `${day}/${month}`;
  };

  useEffect(() => {
    (async () => {
      try {
        // 1) Charger l'utilisateur
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

        // 2) Charger les conversations existantes
        const convosResponse = await fetch(
          `${apiConfig.baseURL}/api/conversations/${currentId}`
        );

        let conversationsData: any = [];
        if (convosResponse.ok) {
          const payload = await convosResponse.json();
          // Supporte à la fois un array direct ou { conversations: [...] }
          if (Array.isArray(payload)) {
            conversationsData = payload;
          } else if (Array.isArray(payload.conversations)) {
            conversationsData = payload.conversations;
          } else {
            console.warn('Conversations payload inattendu :', payload);
            conversationsData = [];
          }
        } else {
          console.warn('Échec fetch conversations :', convosResponse.status);
        }

        // 3) Si aucune conversation, fallback sur les amis
        if (conversationsData.length === 0) {
          const friendsResp = await fetch(
            `${apiConfig.baseURL}/api/friends/${currentId}`
          );
          if (friendsResp.ok) {
            const friendsData = await friendsResp.json();
            conversationsData = friendsData.map((f: any) => {
              // Génère un ID stable trié
              const convoId = [currentId, f.friendId._id].sort().join('_');
              return {
                id: convoId,
                friend: {
                  id: f.friendId._id,
                  name: `${f.friendId.firstname} ${f.friendId.lastname}`,
                  avatar: f.friendId.avatar,
                },
                lastMessage: 'Démarrer une conversation !',
                updatedAt: new Date().toISOString(),
                unread: false,
              } as Conversation;
            });
          } else {
            console.warn(
              'Échec fetch amis pour fallback :',
              friendsResp.status
            );
          }
        }

        setConversations(conversationsData);
      } catch (err: any) {
        console.error('Erreur chargement messages :', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!socketRef.current || !currentUserId) return;
    socketRef.current.on('newMessage', (msg: any) => {
      setConversations((prev) => {
        const i = prev.findIndex((c) => c.id === msg.conversation_id);
        if (i > -1) {
          const updated = [...prev];
          updated[i] = {
            ...updated[i],
            lastMessage: msg.content,
            updatedAt: msg.created_at,
            unread: msg.sender_id !== currentUserId,
          };
          // remonter en tête
          const [convo] = updated.splice(i, 1);
          return [convo, ...updated];
        }
        return prev;
      });
    });
    return () => {
      socketRef.current?.off('newMessage');
    };
  }, [socketRef, currentUserId]);

  useEffect(() => {
    if (!socketRef.current || !currentUserId) return;

    const handleNewFriend = async ({ friendId }: { friendId: string }) => {
      // 1) Récupère les infos du nouvel ami (nom, avatar,...)
      const resp = await fetch(`${apiConfig.baseURL}/api/users/${friendId}`);
      if (!resp.ok) return;
      const friendData = await resp.json();

      // 2) Génère un id de conversation stable
      const convoId = [currentUserId, friendId].sort().join('_');

      // 3) Crée l’objet Conversation
      const newConvo: Conversation = {
        id: convoId,
        friend: {
          id: friendData._id,
          name: `${friendData.firstname} ${friendData.lastname}`,
          avatar: friendData.avatar,
        },
        lastMessage: 'Démarrer une conversation !',
        updatedAt: new Date().toISOString(),
        unread: false,
      };

      // 4) Insère la nouvelle conversation en tête
      setConversations((prev) => [newConvo, ...prev]);

      // 5) (Optionnel) rejoins la room socket de cette conversation
      socketRef.current?.emit('joinConversation', convoId);
    };

    socketRef.current.on('friendAdded', handleNewFriend);
    return () => {
      socketRef.current?.off('friendAdded', handleNewFriend);
    };
  }, [socketRef, currentUserId]);

  useEffect(() => {
    if (!socketRef.current || !currentUserId) return;

    const handleFriendRemoved = ({ friendId }: { friendId: string }) => {
      const convoId = [currentUserId, friendId].sort().join('_');
      setConversations((prev) => prev.filter((c) => c.id !== convoId));
    };

    socketRef.current.on('friendRemoved', handleFriendRemoved);

    // Si tu émets un événement spécifique au blocage, gère-le de la même façon
    // socketRef.current.on('friendBlocked', handleFriendRemoved);

    return () => {
      socketRef.current?.off('friendRemoved', handleFriendRemoved);
      // socketRef.current?.off('friendBlocked', handleFriendRemoved);
    };
  }, [socketRef, currentUserId]);

  if (loadingUser) return <LoadingContainer />;

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
          accessibilityLabel="Se connecter"
          accessibilityRole="button"
          accessibilityHint="Appuyez pour accéder à la page de connexion"
        >
          <Text style={styles.connectButtonText}>Se connecter</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading) return <LoadingContainer />;
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Erreur : {error.message}</Text>
      </View>
    );
  }

  const filteredConversations = conversations.filter((convo) =>
    convo.friend.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <Text style={styles.title}>Messages</Text>
          <TouchableOpacity
            style={styles.friendListButton}
            onPress={() => router.push('/(friends)')}
            accessibilityLabel="Voir la liste des amis"
            accessibilityRole="button"
            accessibilityHint="Affiche vos amis pour démarrer une nouvelle conversation"
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
            accessibilityLabel="Champ de recherche"
            accessibilityHint="Tapez le nom d’un ami pour filtrer les conversations"
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
                  params: {
                    id: item.id,
                    friend: JSON.stringify(item.friend),
                  },
                })
              }
              accessibilityLabel={`Conversation avec ${item.friend.name}`}
              accessibilityHint={
                item.unread
                  ? 'Nouveau message non lu. Appuyez pour ouvrir.'
                  : 'Appuyez pour ouvrir la conversation.'
              }
              accessibilityRole="button"
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
            Ajoutez des amis pour discuter !
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
