import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/Colors';
import { router } from 'expo-router';
import apiConfig from '@/config/apiConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FriendItem from '../components/FriendItem';
import useSocket from '../hooks/useSocket';
import LoadingContainer from '../components/LoadingContainer';
import { Friend } from '../types/index';

export default function FriendsScreen() {
  const [allUsers, setAllUsers] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<Error | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const socketRef = useSocket();

  // 1) Chargement initial (inclut marquage des bloqués et blockers)
  useEffect(() => {
    const fetchData = async () => {
      try {
        const userString = await AsyncStorage.getItem('user');
        const currentUser = userString ? JSON.parse(userString) : null;
        const currentId = currentUser?.id || currentUser?._id;
        if (!currentId) {
          router.replace('/login');
          return;
        }
        setCurrentUserId(currentId);

        // 1.a. Récupère tous les utilisateurs sauf moi
        const usersRes = await fetch(`${apiConfig.baseURL}/api/users`);
        const raw = await usersRes.json();
        const rawUsers: any[] = Array.isArray(raw) ? raw : raw.users;

        let users: Friend[] = rawUsers
          .filter((u) => String(u._id) !== currentId)
          .map((u) => ({
            id: u._id,
            name: `${u.firstname} ${u.lastname}`,
            username: u.username,
            avatar: u.avatar,
            isFriend: false,
            invitationPending: false,
            invitationReceived: false,
            invitationReceivedId: null,
            isBlocked: false,
            isBlockedBy: false,
          }));

        // 1.b. Marque les amis
        const friendsRes = await fetch(
          `${apiConfig.baseURL}/api/friends/${currentId}`
        );
        const friendsJson = await friendsRes.json();
        const friendIds = friendsJson.map((f: any) => String(f.friendId._id));
        users = users.map((u) => ({
          ...u,
          isFriend: friendIds.includes(u.id),
        }));

        // 1.c. Invitations reçues
        const recRes = await fetch(
          `${apiConfig.baseURL}/api/invitations?receiverId=${currentId}&status=pending`
        );
        const recJson = await recRes.json();
        const recMap: Record<string, string> = {};
        (recJson as any[]).forEach((inv) => {
          const sid = String(inv.senderId._id || inv.senderId);
          recMap[sid] = inv._id;
        });
        users = users.map((u) => ({
          ...u,
          invitationReceived: Boolean(recMap[u.id]),
          invitationReceivedId: recMap[u.id] || null,
        }));

        // 1.d. Invitations envoyées
        const sendRes = await fetch(
          `${apiConfig.baseURL}/api/invitations?senderId=${currentId}&status=pending`
        );
        const sendJson = await sendRes.json();
        const sentTo = (sendJson as any[]).map((inv) => String(inv.receiverId));
        users = users.map((u) => ({
          ...u,
          invitationPending: sentTo.includes(u.id),
        }));

        // 1.e. Mes blockedUsers
        const meRes = await fetch(
          `${apiConfig.baseURL}/api/users/${currentId}`
        );
        const meJson = await meRes.json();
        const blockedIds: string[] = Array.isArray(meJson.blockedUsers)
          ? meJson.blockedUsers.map((b: any) => String(b))
          : [];
        users = users.map((u) => ({
          ...u,
          isBlocked: blockedIds.includes(u.id),
        }));

        // 1.f. Ceux qui m'ont bloqué
        const blockedByRes = await fetch(
          `${apiConfig.baseURL}/api/users/blockedBy/${currentId}`
        );
        const blockedByJson: string[] = await blockedByRes.json();
        users = users.map((u) => ({
          ...u,
          isBlockedBy: blockedByJson.includes(u.id),
        }));

        setAllUsers(users);
      } catch (err: any) {
        console.error('Erreur chargement FriendsScreen:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // 2) Socket.IO : mise à jour en temps réel
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !currentUserId) return;

    socket.emit('joinRoom', currentUserId);

    // Invitation reçue
    socket.on('invitationReceived', (inv: any) => {
      setAllUsers((prev) =>
        prev.map((u) =>
          String(u.id) === String(inv.senderId._id || inv.senderId)
            ? { ...u, invitationReceived: true, invitationReceivedId: inv._id }
            : u
        )
      );
    });

    // Invitation acceptée/refusée
    socket.on('invitationUpdated', (inv: any) => {
      const rid = inv.receiverId._id || inv.receiverId;
      setAllUsers((prev) =>
        prev.map((u) =>
          String(u.id) === String(rid) ? { ...u, invitationPending: false } : u
        )
      );
    });

    // Invitation supprimée
    socket.on('invitationDeleted', (inv: any) => {
      const rid = inv.receiverId._id || inv.receiverId;
      setAllUsers((prev) =>
        prev.map((u) =>
          String(u.id) === String(rid) ? { ...u, invitationPending: false } : u
        )
      );
    });

    // Ami ajouté
    socket.on('friendAdded', ({ friendId: fid }: { friendId: string }) => {
      setAllUsers((prev) =>
        prev.map((u) =>
          u.id === fid
            ? {
                ...u,
                isFriend: true,
                invitationPending: false,
                invitationReceived: false,
                invitationReceivedId: null,
              }
            : u
        )
      );
    });

    // Ami supprimé
    socket.on('friendRemoved', ({ friendId: fid }: { friendId: string }) => {
      setAllUsers((prev) =>
        prev.map((u) => (u.id === fid ? { ...u, isFriend: false } : u))
      );
    });

    // Utilisateur débloqué
    socket.on('userUnblocked', ({ unblockerId }) => {
      setAllUsers((prev) =>
        prev.map((u) => (u.id === unblockerId ? { ...u, isBlocked: false } : u))
      );
    });

    return () => {
      socket.off('invitationReceived');
      socket.off('invitationUpdated');
      socket.off('invitationDeleted');
      socket.off('friendAdded');
      socket.off('friendRemoved');
      socket.off('userUnblocked');
    };
  }, [currentUserId, socketRef]);

  // Accepter invitation reçue
  const handleAcceptReceivedInvitation = async (
    friend: Friend,
    invitationReceivedId: string | null
  ) => {
    if (!currentUserId || !friend.invitationReceivedId) return;
    try {
      await fetch(
        `${apiConfig.baseURL}/api/invitations/${friend.invitationReceivedId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'accepted' }),
        }
      );
      await fetch(`${apiConfig.baseURL}/api/friends`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUserId, friendId: friend.id }),
      });
      setAllUsers((prev) =>
        prev.map((u) =>
          u.id === friend.id
            ? {
                ...u,
                isFriend: true,
                invitationReceived: false,
                invitationReceivedId: null,
              }
            : u
        )
      );
      Alert.alert('Invitation acceptée');
    } catch (err: any) {
      console.error(err);
      Alert.alert('Erreur', err.message);
    }
  };

  // Marquer localement une invitation envoyée
  const markInvitationPending = (id: string) => {
    setAllUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, invitationPending: true } : u))
    );
  };

  // Débloquer un utilisateur
  const handleUnblock = async (id: string) => {
    if (!currentUserId) return;
    try {
      const resp = await fetch(
        `${apiConfig.baseURL}/api/users/${currentUserId}/unblock/${id}`,
        { method: 'POST' }
      );
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      setAllUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, isBlocked: false } : u))
      );
      Alert.alert('Utilisateur débloqué');
    } catch (err: any) {
      console.error(err);
      Alert.alert('Erreur', err.message);
    }
  };

  if (loading) return <LoadingContainer />;
  if (error)
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Erreur : {error.message}</Text>
      </View>
    );

  // Séparer en sections et filtrer
  const blockedList = allUsers.filter((u) => u.isBlocked);
  const friendsList = allUsers.filter((u) => u.isFriend && !u.isBlocked);
  const nonFriendsList = allUsers.filter(
    (u) => !u.isFriend && !u.isBlocked && !u.isBlockedBy
  );

  const filtered = (list: Friend[]) =>
    list.filter(
      (u) =>
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.username.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const sections = [
    { title: 'Bloqués', data: filtered(blockedList), type: 'blocked' },
    { title: 'Amis', data: filtered(friendsList), type: 'friends' },
    {
      title: 'Suggestions',
      data: filtered(nonFriendsList),
      type: 'nonFriends',
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Utilisateurs</Text>
        </View>
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher"
          placeholderTextColor={Colors.gray400}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
        />
      </View>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderSectionHeader={({ section }) =>
          section.data.length > 0 ? (
            <Text style={styles.sectionHeader}>{section.title}</Text>
          ) : null
        }
        renderItem={({ item, section }) => {
          if (section.type === 'blocked') {
            return (
              <View style={styles.blockedItem}>
                <Text style={styles.blockedName}>{item.name}</Text>
                <TouchableOpacity
                  style={[styles.actionButton, styles.unblockButton]}
                  onPress={() => handleUnblock(item.id)}
                >
                  <Text style={styles.actionButtonText}>Débloquer</Text>
                </TouchableOpacity>
              </View>
            );
          }
          return (
            <FriendItem
              item={item}
              isFriend={section.type === 'friends'}
              isBlockedBy={item.isBlockedBy}
              onInviteSent={markInvitationPending}
              onAcceptReceived={(friend, invitationReceivedId) =>
                handleAcceptReceivedInvitation(friend, invitationReceivedId)
              }
              index={0}
            />
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={64} color={Colors.gray400} />
            <Text style={styles.emptyStateText}>Aucun utilisateur</Text>
          </View>
        }
        contentContainerStyle={
          allUsers.length === 0 ? styles.emptyListContainer : undefined
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: Colors.error,
    fontSize: 18,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    backgroundColor: Colors.white,
    paddingHorizontal: 20,
    paddingTop: 80,
    paddingBottom: 20,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.text,
  },
  searchInput: {
    marginTop: 16,
    backgroundColor: Colors.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    borderColor: Colors.gray200,
    borderWidth: 1,
    color: Colors.text,
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
  },
  emptyListContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  emptyState: {
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
  },
  blockedItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFF5E5',
    marginHorizontal: 20,
    borderRadius: 8,
    marginBottom: 10,
  },
  blockedName: {
    fontSize: 16,
    color: Colors.text,
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  actionButtonText: {
    color: Colors.white,
    fontWeight: 'bold',
  },
  unblockButton: {
    backgroundColor: Colors.success,
  },
  disabledButton: {
    backgroundColor: Colors.gray200,
  },
});
