import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import Colors from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import apiConfig from '@/config/apiConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import LoadingContainer from '../../components/LoadingContainer';
import useSocket from '../../hooks/useSocket';

const UserProfileScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { friendId } = route.params as { friendId: string };
  const socketRef = useSocket();

  const [user, setUser] = useState<any>(null);
  const [isFriend, setIsFriend] = useState(false);
  const [invitationPending, setInvitationPending] = useState(false);
  const [incomingInvitation, setIncomingInvitation] = useState(false);
  const [incomingInvitationId, setIncomingInvitationId] = useState<
    string | null
  >(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isBlockedBy, setIsBlockedBy] = useState(false);
  const [loading, setLoading] = useState(true);

  // Socket listeners
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    socket.on('userBlocked', ({ blockerId }) => {
      if (blockerId === friendId) {
        setIsBlockedBy(true);
        Alert.alert('Vous avez été bloqué');
      }
    });
    socket.on('userUnblocked', ({ unblockerId }) => {
      if (unblockerId === friendId) {
        setIsBlockedBy(false);
        Alert.alert('Vous avez été débloqué');
      }
    });
    socket.on('friendAdded', ({ friendId: addedId }) => {
      if (addedId === friendId) {
        setIsFriend(true);
        setInvitationPending(false);
        Alert.alert(
          'Amitié établie',
          `${user?.firstname} est maintenant votre ami.`
        );
      }
    });
    socket.on('friendRemoved', ({ friendId: removedId }) => {
      if (removedId === friendId) {
        setIsFriend(false);
        Alert.alert(
          'Amitié supprimée',
          `Vous n'êtes plus ami avec ${user?.firstname}.`
        );
      }
    });
    socket.on('invitationReceived', (inv: any) => {
      if (inv.senderId === friendId) {
        setIncomingInvitation(true);
        setIncomingInvitationId(inv._id);
        Alert.alert(
          'Nouvelle invitation',
          `${user?.firstname} vous a envoyé une invitation.`
        );
      }
    });
    socket.on('invitationUpdated', (inv: any) => {
      if (inv._id === incomingInvitationId && inv.status !== 'pending') {
        setIncomingInvitation(false);
        setIncomingInvitationId(null);
      }
    });
    socket.on('invitationDeleted', (inv: any) => {
      if (inv._id === incomingInvitationId) {
        setIncomingInvitation(false);
        setIncomingInvitationId(null);
      }
    });

    return () => {
      socket.off('userBlocked');
      socket.off('userUnblocked');
      socket.off('friendAdded');
      socket.off('friendRemoved');
      socket.off('invitationReceived');
      socket.off('invitationUpdated');
      socket.off('invitationDeleted');
    };
  }, [friendId, socketRef, user, incomingInvitationId]);

  // Fetch profile & relations
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const resp = await fetch(`${apiConfig.baseURL}/api/users/${friendId}`);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = await resp.json();
        setUser(data);

        const str = await AsyncStorage.getItem('user');
        const me = str ? JSON.parse(str) : null;
        const meId = me?.id || me?._id;
        if (!meId) return;

        // Friends & outgoing invitation
        const [frRes, outRes] = await Promise.all([
          fetch(`${apiConfig.baseURL}/api/friends/${meId}`),
          fetch(
            `${apiConfig.baseURL}/api/invitations?senderId=${meId}&receiverId=${friendId}&status=pending`
          ),
        ]);
        if (frRes.ok) {
          const fl = await frRes.json();
          setIsFriend(
            fl
              .map((f: any) => String(f.friendId._id || f.friendId))
              .includes(String(friendId))
          );
        }
        if (!isFriend && outRes.ok) {
          const pend = await outRes.json();
          setInvitationPending(Array.isArray(pend) && pend.length > 0);
        }

        // Incoming invitation
        const inRes = await fetch(
          `${apiConfig.baseURL}/api/invitations?senderId=${friendId}&receiverId=${meId}&status=pending`
        );
        if (inRes.ok) {
          const arr = await inRes.json();
          if (Array.isArray(arr) && arr.length > 0) {
            setIncomingInvitation(true);
            setIncomingInvitationId(arr[0]._id);
          }
        }

        // Blocks
        const [meRes, themRes] = await Promise.all([
          fetch(`${apiConfig.baseURL}/api/users/${meId}`),
          fetch(`${apiConfig.baseURL}/api/users/${friendId}`),
        ]);
        if (meRes.ok && themRes.ok) {
          const meData = await meRes.json();
          const themData = await themRes.json();
          setIsBlocked(meData.blockedUsers?.includes(friendId));
          setIsBlockedBy(themData.blockedUsers?.includes(meId));
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchUserProfile();
  }, [friendId, isFriend]);

  // Block/unblock
  const handleBlockToggle = async () => {
    const str = await AsyncStorage.getItem('user');
    const me = str ? JSON.parse(str) : null;
    const meId = me?.id || me?._id;
    if (!meId) {
      Alert.alert('Erreur', 'Utilisateur non authentifié.');
      return;
    }
    try {
      const action = isBlocked ? 'unblock' : 'block';
      const r = await fetch(
        `${apiConfig.baseURL}/api/users/${meId}/${action}/${friendId}`,
        { method: 'POST' }
      );
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      setIsBlocked(!isBlocked);
      Alert.alert(isBlocked ? 'Utilisateur débloqué' : 'Utilisateur bloqué');
    } catch (err: any) {
      console.error(err);
      Alert.alert('Erreur', err.message);
    }
  };

  // Accept incoming invitation
  const acceptInvitation = async () => {
    const str = await AsyncStorage.getItem('user');
    const me = str ? JSON.parse(str) : null;
    const meId = me?.id || me?._id;
    if (!meId || !incomingInvitationId) return;
    try {
      await fetch(
        `${apiConfig.baseURL}/api/invitations/${incomingInvitationId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'accepted' }),
        }
      );
      await fetch(`${apiConfig.baseURL}/api/friends`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: meId, friendId }),
      });
      setIsFriend(true);
      setIncomingInvitation(false);
      setIncomingInvitationId(null);
      Alert.alert(
        'Invitation acceptée',
        `${user.firstname} est maintenant votre ami.`
      );
    } catch (err: any) {
      console.error(err);
      Alert.alert('Erreur', err.message);
    }
  };

  // Decline incoming invitation
  const declineInvitation = async () => {
    if (!incomingInvitationId) return;
    try {
      const r = await fetch(
        `${apiConfig.baseURL}/api/invitations/${incomingInvitationId}`,
        { method: 'DELETE' }
      );
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      setIncomingInvitation(false);
      setIncomingInvitationId(null);
      Alert.alert('Invitation refusée');
    } catch (err: any) {
      console.error(err);
      Alert.alert('Erreur', err.message);
    }
  };

  // Send or delete friend/invite
  const handleFriendAction = async () => {
    if (isBlocked || isBlockedBy) {
      Alert.alert(
        'Action indisponible',
        isBlocked
          ? 'Vous avez bloqué cet utilisateur, débloquez-le pour envoyer une invitation.'
          : 'Vous êtes bloqué par cet utilisateur, vous ne pouvez pas interagir.'
      );
      return;
    }
    const str = await AsyncStorage.getItem('user');
    const me = str ? JSON.parse(str) : null;
    const meId = me?.id || me?._id;
    if (!meId) {
      Alert.alert('Erreur', 'Utilisateur non authentifié.');
      return;
    }
    if (isFriend) {
      Alert.alert(
        "Supprimer l'ami",
        `Voulez-vous vraiment supprimer ${user.firstname} ${user.lastname} ?`,
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Supprimer',
            style: 'destructive',
            onPress: async () => {
              const r = await fetch(`${apiConfig.baseURL}/api/friends`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: meId, friendId }),
              });
              if (!r.ok) throw new Error(`HTTP ${r.status}`);
              setIsFriend(false);
              Alert.alert('Ami supprimé');
              router.replace('/(friends)');
            },
          },
        ]
      );
    } else if (!invitationPending) {
      const r = await fetch(`${apiConfig.baseURL}/api/invitations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderId: meId, receiverId: friendId }),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      setInvitationPending(true);
      Alert.alert('Invitation envoyée');
    }
  };

  if (loading) return <LoadingContainer />;
  if (!user)
    return (
      <View style={styles.loadingContainer}>
        <Text>Utilisateur non trouvé.</Text>
      </View>
    );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={20} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profil</Text>
      </View>

      {/* Profile info */}
      <View style={styles.profileInfoContainer}>
        <View style={styles.avatarWrapper}>
          {user.avatar ? (
            <Image source={{ uri: user.avatar }} style={styles.avatar} />
          ) : (
            <Image
              source={require('@/assets/images/avatar-default.png')}
              style={styles.avatar}
            />
          )}
        </View>
        <Text style={styles.name}>
          {user.firstname} {user.lastname}
        </Text>
        <Text style={styles.username}>{user.username}</Text>
      </View>

      {/* Block/Unblock */}
      <TouchableOpacity
        style={[
          styles.actionButton,
          isBlocked ? styles.unblockButton : styles.blockButton,
        ]}
        onPress={handleBlockToggle}
      >
        <Text style={styles.actionButtonText}>
          {isBlocked ? 'Débloquer' : 'Bloquer'}
        </Text>
      </TouchableOpacity>

      {/* Incoming invitation */}
      {incomingInvitation ? (
        <View style={styles.friendButtonsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.addButton]}
            onPress={acceptInvitation}
          >
            <Text style={styles.action2ButtonText}>Accepter</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.declineButton]}
            onPress={declineInvitation}
          >
            <Text style={styles.action2ButtonText}>Refuser</Text>
          </TouchableOpacity>
        </View>
      ) : (
        !isBlockedBy &&
        // Outgoing invite or friend actions
        (isFriend ? (
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={handleFriendAction}
          >
            <Text style={styles.actionButtonText}>Supprimer l’ami</Text>
          </TouchableOpacity>
        ) : invitationPending ? (
          <View style={[styles.actionButton, styles.pendingButton]}>
            <Text style={[styles.actionButtonText, styles.pendingText]}>
              En attente
            </Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.actionButton, styles.addButton]}
            onPress={handleFriendAction}
          >
            <Text style={styles.actionButtonText}>Envoyer une invitation</Text>
          </TouchableOpacity>
        ))
      )}

      {/* Profile details */}
      <View style={styles.infoContainer}>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Email</Text>
          <Text style={styles.infoValue}>{user.email}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Téléphone</Text>
          <Text style={styles.infoValue}>{user.phoneNumber}</Text>
        </View>
        <View style={styles.infoLastItem}>
          <Text style={styles.infoLabel}>Bio</Text>
          <Text style={styles.infoValue}>{user.bio || 'Aucune bio'}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    backgroundColor: Colors.primary,
    height: 150,
    paddingHorizontal: 20,
    paddingTop: 40,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    backgroundColor: Colors.white,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.white,
    marginRight: 36,
  },
  profileInfoContainer: {
    alignItems: 'center',
    marginTop: -70,
    marginBottom: 20,
  },
  avatarWrapper: {
    backgroundColor: Colors.background,
    borderRadius: 70,
    padding: 5,
  },
  avatar: {
    width: 128,
    height: 128,
    borderRadius: 64,
    borderWidth: 1,
    borderColor: Colors.white,
  },
  name: {
    fontSize: 26,
    fontWeight: 'bold',
    color: Colors.text,
    marginVertical: 10,
  },
  username: {
    fontSize: 16,
    color: Colors.gray400,
  },
  actionButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
    marginHorizontal: 20,
  },
  addButton: {
    backgroundColor: Colors.primary,
  },
  deleteButton: {
    backgroundColor: Colors.error,
    paddingHorizontal: 40,
  },
  pendingButton: {
    backgroundColor: Colors.gray500,
  },
  pendingText: {
    color: Colors.gray800,
  },
  declineButton: {
    backgroundColor: Colors.error,
  },
  blockButton: {
    backgroundColor: '#FFA500',
  },
  unblockButton: {
    backgroundColor: Colors.success,
  },
  friendButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    marginHorizontal: 20,
  },
  action2ButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
    paddingHorizontal: 20,
  },
  actionButtonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '600',
  },
  infoContainer: {
    backgroundColor: Colors.white,
    padding: 20,
    borderRadius: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  infoItem: {
    marginBottom: 20,
  },
  infoLastItem: {
    marginBottom: 0,
  },
  infoLabel: {
    fontSize: 12,
    color: Colors.gray600,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
  },
});

export default UserProfileScreen;
