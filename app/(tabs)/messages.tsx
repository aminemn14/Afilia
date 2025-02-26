import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/Colors';
import { router } from 'expo-router';
import apiConfig from '@/config/apiConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import useSocket from '../hooks/useSocket';
import { Conversation } from '../types';

export default function MessagesScreen() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const socketRef = useSocket();

  // Fonction de formatage de la date/heure
  const formatDateTime = (dateString: string) => {
    const dt = new Date(dateString);
    const day = dt.getDate().toString().padStart(2, '0');
    const month = (dt.getMonth() + 1).toString().padStart(2, '0');
    const hours = dt.getHours().toString().padStart(2, '0');
    const minutes = dt.getMinutes().toString().padStart(2, '0');
    return `${day}/${month} - ${hours}h${minutes}`;
  };

  // Fonction pour récupérer les amis et transformer en "conversations"
  const fetchFriendsAsConversations = async (userId: string) => {
    try {
      const friendsResponse = await fetch(
        `${apiConfig.baseURL}/api/friends/${userId}`
      );
      if (!friendsResponse.ok) {
        throw new Error(`Erreur HTTP ${friendsResponse.status}`);
      }
      const friendsData = await friendsResponse.json();
      const newConversations = friendsData.map((friendItem: any) => {
        // Générer une conversation_id cohérente pour les deux parties
        const conversationId = [userId, friendItem.friendId._id]
          .sort()
          .join('_');
        return {
          id: conversationId,
          friend: {
            id: friendItem.friendId._id,
            name:
              friendItem.friendId.firstname +
              ' ' +
              friendItem.friendId.lastname,
            avatar: friendItem.friendId.avatar,
          },
          lastMessage: 'Démarrer une conversation!',
          updatedAt: new Date().toISOString(),
          unread: true,
        };
      });
      setConversations(newConversations);
    } catch (err: any) {
      console.error('Erreur lors du rechargement des amis :', err);
    }
  };

  // Chargement initial : récupérer les conversations ou, en l'absence, les amis
  useEffect(() => {
    const fetchConversationsOrFriends = async () => {
      try {
        const userString = await AsyncStorage.getItem('user');
        const currentUser = userString ? JSON.parse(userString) : null;
        const currentId = currentUser
          ? currentUser.id || currentUser._id
          : null;
        if (!currentId) {
          setLoading(false);
          router.replace('/login');
          return;
        }
        setCurrentUserId(currentId);
        let conversationsData: Conversation[] = [];
        const convosResponse = await fetch(
          `${apiConfig.baseURL}/api/conversations/${currentId}`
        );
        if (convosResponse.ok) {
          conversationsData = await convosResponse.json();
        } else if (convosResponse.status === 404) {
          await fetchFriendsAsConversations(currentId);
          return;
        }
        if (conversationsData.length === 0) {
          await fetchFriendsAsConversations(currentId);
        } else {
          setConversations(conversationsData);
        }
      } catch (err: any) {
        console.error('Erreur lors du chargement des conversations:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    fetchConversationsOrFriends();
  }, []);

  // Socket.IO : rejoindre la room et écouter les mises à jour des amis
  useEffect(() => {
    if (!socketRef.current || !currentUserId) return;
    socketRef.current.emit('joinRoom', currentUserId);
    socketRef.current.on(
      'friendUpdated',
      (data: { friends?: any[]; friendId?: string }) => {
        if (data.friends) {
          try {
            const newConversations = data.friends.map((friendItem: any) => {
              const conversationId = [currentUserId, friendItem.friendId._id]
                .sort()
                .join('_');
              return {
                id: conversationId,
                friend: {
                  id: friendItem.friendId._id,
                  name:
                    friendItem.friendId.firstname +
                    ' ' +
                    friendItem.friendId.lastname,
                  avatar: friendItem.friendId.avatar,
                },
                lastMessage: 'Démarrer une conversation!',
                updatedAt: new Date().toISOString(),
                unread: true,
              };
            });
            setConversations(newConversations);
          } catch (err) {
            console.error('Erreur lors du traitement de friendUpdated:', err);
          }
        } else if (data.friendId) {
          fetchFriendsAsConversations(currentUserId);
        }
      }
    );

    socketRef.current.on('friendRemoved', (data: { friendId: string }) => {
      setConversations((prev) =>
        prev.filter((convo) => convo.friend.id !== data.friendId)
      );
    });

    return () => {
      socketRef.current?.off('friendUpdated');
      socketRef.current?.off('friendRemoved');
    };
  }, [currentUserId, socketRef]);

  // Listener pour mettre à jour en direct le dernier message via Socket.IO
  useEffect(() => {
    if (!socketRef.current || !currentUserId) return;
    socketRef.current.on('newMessage', (message: any) => {
      // Calculer l'ID de conversation en triant les IDs des participants
      const conversationId = [message.sender_id, message.receiver_id]
        .map(String)
        .sort()
        .join('_');

      setConversations((prevConvos) => {
        const convoIndex = prevConvos.findIndex((c) => c.id === conversationId);
        if (convoIndex !== -1) {
          const updatedConvo = {
            ...prevConvos[convoIndex],
            lastMessage: message.content,
            updatedAt: message.created_at,
            // Marquer comme non lu si le message provient de l'autre utilisateur
            unread: message.sender_id !== currentUserId,
          };
          const newConvos = [...prevConvos];
          newConvos[convoIndex] = updatedConvo;
          return newConvos;
        }
        return prevConvos;
      });
    });

    return () => {
      socketRef.current?.off('newMessage');
    };
  }, [currentUserId, socketRef]);

  const filteredConversations = conversations.filter((convo) =>
    convo.friend.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderConversation = ({ item }: { item: Conversation }) => {
    return (
      <TouchableOpacity
        style={styles.conversationCard}
        onPress={() =>
          router.push({
            pathname: '/(chat)/conversation/[id]',
            params: {
              id: item.id,
              conversationId: item.id,
              friend: JSON.stringify(item.friend),
            },
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
            <Text style={[styles.friendName, item.unread && styles.unreadText]}>
              {item.friend.name}
            </Text>
            <Text
              style={[styles.messageTime, item.unread && styles.unreadTime]}
            >
              {formatDateTime(item.updatedAt)}
            </Text>
          </View>
          <Text
            style={[styles.lastMessage, item.unread && styles.unreadText]}
            numberOfLines={1}
          >
            {item.lastMessage || 'Démarrer une conversation'}
          </Text>
        </View>
        <Ionicons
          name="chevron-forward"
          size={20}
          color={item.unread ? Colors.gray700 : Colors.gray400}
        />
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Erreur : {error.message}</Text>
      </View>
    );
  }
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
          renderItem={renderConversation}
          keyExtractor={(item) => item.id}
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
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: { color: Colors.primary, fontSize: 18 },
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
  messageTime: { fontSize: 12, color: Colors.gray400 },
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
});
