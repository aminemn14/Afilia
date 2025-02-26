import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Colors from '../constants/Colors';
import { router } from 'expo-router';
import apiConfig from '@/config/apiConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Friend } from '../types';
import FriendItem from '../components/FriendItem';
import useSocket from '../hooks/useSocket';

export default function FriendsScreen() {
  const [allUsers, setAllUsers] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<Error | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const navigation = useNavigation();
  const socketRef = useSocket();

  // Chargement initial des données
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Récupérer l'utilisateur connecté depuis AsyncStorage
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

        // 2. Récupérer tous les utilisateurs hors currentUser
        const usersResponse = await fetch(`${apiConfig.baseURL}/api/users`);
        if (!usersResponse.ok) {
          throw new Error(`Erreur HTTP ${usersResponse.status}`);
        }
        const usersResult = await usersResponse.json();
        const usersData: any[] = Array.isArray(usersResult)
          ? usersResult
          : usersResult.users;
        const filteredUsers = usersData.filter(
          (u) => String(u._id || u.id) !== String(currentId)
        );
        let users: Friend[] = filteredUsers.map((u) => ({
          id: u._id || u.id,
          name: `${u.firstname} ${u.lastname}`,
          username: u.username,
          avatar: u.avatar,
          isFriend: false,
          invitationPending: false,
          invitationReceived: false,
          invitationReceivedId: null,
        }));

        // 3. Récupérer la liste des amis pour currentId
        const friendsResponse = await fetch(
          `${apiConfig.baseURL}/api/friends/${currentId}`
        );
        if (!friendsResponse.ok) {
          throw new Error(`Erreur HTTP ${friendsResponse.status}`);
        }
        const friendsResult = await friendsResponse.json();
        const friendIds = friendsResult.map((f: any) =>
          String(f.friendId._id || f.friendId)
        );
        users = users.map((u) => ({
          ...u,
          isFriend: friendIds.includes(String(u.id)),
        }));

        // 4. Récupérer les invitations reçues (pending) pour lesquelles currentId est le receiver
        const pendingReceivedResponse = await fetch(
          `${apiConfig.baseURL}/api/invitations?receiverId=${currentId}&status=pending`
        );
        if (pendingReceivedResponse.ok) {
          const pendingReceivedInvitations =
            await pendingReceivedResponse.json();
          const pendingReceivedMap: { [key: string]: string } = {};
          if (Array.isArray(pendingReceivedInvitations)) {
            pendingReceivedInvitations.forEach((inv: any) => {
              const senderId = String(inv.senderId._id || inv.senderId);
              pendingReceivedMap[senderId] = inv._id;
            });
          }
          users = users.map((u) => ({
            ...u,
            invitationReceived: pendingReceivedMap.hasOwnProperty(String(u.id)),
            invitationReceivedId: pendingReceivedMap[String(u.id)] || null,
          }));
        }

        // 5. Récupérer les invitations envoyées (pending)
        const pendingSentResponse = await fetch(
          `${apiConfig.baseURL}/api/invitations?senderId=${currentId}&status=pending`
        );
        if (pendingSentResponse.ok) {
          const pendingSentInvitations = await pendingSentResponse.json();
          const pendingSentReceiverIds = Array.isArray(pendingSentInvitations)
            ? pendingSentInvitations.map((inv: any) => String(inv.receiverId))
            : [];
          users = users.map((u) => ({
            ...u,
            invitationPending: pendingSentReceiverIds.includes(String(u.id)),
          }));
        }

        setAllUsers(users);
      } catch (err: any) {
        console.error('Erreur lors du chargement des utilisateurs :', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Écouter les événements Socket.IO pour actualiser en temps réel
  useEffect(() => {
    if (!socketRef.current || !currentUserId) return;
    socketRef.current.emit('joinRoom', currentUserId);

    // Quand une invitation est reçue (du point de vue du receiver)
    socketRef.current.on('invitationReceived', (invitation: any) => {
      setAllUsers((prevUsers) =>
        prevUsers.map((u) =>
          String(u.id) ===
          String(invitation.senderId._id || invitation.senderId)
            ? {
                ...u,
                invitationReceived: true,
                invitationReceivedId: invitation._id,
              }
            : u
        )
      );
    });

    // Quand une invitation est mise à jour (acceptée ou rejetée)
    socketRef.current.on('invitationUpdated', (invitation: any) => {
      // Pour l'utilisateur concerné (sender), supprimer l'indication
      setAllUsers((prevUsers) =>
        prevUsers.map((u) =>
          String(u.id) ===
          String(invitation.senderId._id || invitation.senderId)
            ? {
                ...u,
                invitationReceived: false,
                invitationReceivedId: null,
                invitationPending: false,
              }
            : u
        )
      );
    });

    // Lorsqu'une relation d'ami est établie, mettre à jour l'utilisateur
    socketRef.current.on('friendUpdated', (data: { friendId: string }) => {
      setAllUsers((prevUsers) =>
        prevUsers.map((u) =>
          String(u.id) === String(data.friendId)
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

    // Lorsqu'une relation d'ami est supprimée, mettre à jour l'utilisateur
    socketRef.current.on('friendRemoved', (data: { friendId: string }) => {
      setAllUsers((prevUsers) =>
        prevUsers.map((u) =>
          String(u.id) === String(data.friendId) ? { ...u, isFriend: false } : u
        )
      );
    });

    return () => {
      socketRef.current?.off('invitationReceived');
      socketRef.current?.off('invitationUpdated');
      socketRef.current?.off('friendUpdated');
      socketRef.current?.off('friendRemoved');
    };
  }, [currentUserId, socketRef]);

  // Séparer en amis et non-amis
  const friendsList = allUsers.filter((u) => u.isFriend);
  const nonFriendsList = allUsers.filter((u) => !u.isFriend);

  const filterUsers = (users: Friend[]) =>
    users.filter(
      (u) =>
        (u.name && u.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (u.username &&
          u.username.toLowerCase().includes(searchQuery.toLowerCase()))
    );

  const filteredFriends = filterUsers(friendsList);
  const filteredNonFriends = filterUsers(nonFriendsList);
  const randomNonFriends = filteredNonFriends
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);

  const sections = [
    { title: 'Amis', data: filteredFriends, isFriend: true },
    { title: 'NonAmis', data: randomNonFriends, isFriend: false },
  ];

  // Marquer localement une invitation envoyée comme pending
  const markInvitationPending = (friendId: string) => {
    setAllUsers((prevUsers) =>
      prevUsers.map((u) =>
        u.id === friendId ? { ...u, invitationPending: true } : u
      )
    );
  };

  // Accepter une invitation reçue
  const handleAcceptReceivedInvitation = async (friend: Friend) => {
    if (!currentUserId || !friend.invitationReceivedId) return;
    try {
      const response = await fetch(
        `${apiConfig.baseURL}/api/invitations/${friend.invitationReceivedId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'accepted' }),
        }
      );
      if (!response.ok) throw new Error(`Erreur HTTP ${response.status}`);
      // Mise à jour locale : l'utilisateur devient ami
      setAllUsers((prevUsers) =>
        prevUsers.map((u) =>
          u.id === friend.id
            ? {
                ...u,
                invitationReceived: false,
                invitationReceivedId: null,
                isFriend: true,
              }
            : u
        )
      );
      // Créer la relation d'ami côté backend
      const addFriendResponse = await fetch(
        `${apiConfig.baseURL}/api/friends`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: currentUserId, friendId: friend.id }),
        }
      );
      if (!addFriendResponse.ok) {
        throw new Error(
          `Erreur lors de l'ajout en ami : HTTP ${addFriendResponse.status}`
        );
      }
      Alert.alert(
        'Invitation acceptée',
        "L'invitation a été acceptée et l'utilisateur a été ajouté à vos amis."
      );
    } catch (error: any) {
      console.error("Erreur lors de l'acceptation de l'invitation :", error);
      Alert.alert('Erreur', error.message);
    }
  };

  const renderItem = ({ item, index, section }: any) => (
    <FriendItem
      item={item}
      index={index}
      isFriend={section.isFriend}
      onInviteSent={markInvitationPending}
      onAcceptReceived={handleAcceptReceivedInvitation}
    />
  );

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
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Amis</Text>
        </View>
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un utilisateur"
          placeholderTextColor={Colors.gray400}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
        />
      </View>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        renderSectionHeader={({ section }) =>
          section.data.length > 0 && section.title === 'NonAmis' ? (
            <View style={styles.sectionSeparator} />
          ) : section.data.length > 0 && section.title === 'Amis' ? (
            <Text style={styles.sectionHeader}>Amis</Text>
          ) : null
        }
        contentContainerStyle={
          allUsers.length === 0
            ? styles.emptyListContainer
            : styles.listContainer
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="person-outline" size={64} color={Colors.gray400} />
            <Text style={styles.emptyStateText}>Aucun utilisateur</Text>
            <Text style={styles.emptyStateSubtext}>
              Commencez à ajouter des amis pour discuter !
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: Colors.primary,
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
  sectionSeparator: {
    height: 1,
    backgroundColor: Colors.gray200,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  listContainer: {
    paddingTop: 20,
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
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 16,
    color: Colors.gray600,
    textAlign: 'center',
  },
});
