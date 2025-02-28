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

const UserProfileScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { friendId } = route.params as { friendId: string };

  const [user, setUser] = useState<any>(null);
  const [isFriend, setIsFriend] = useState(false);
  const [invitationPending, setInvitationPending] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        // Récupérer les détails du profil consulté
        const response = await fetch(
          `${apiConfig.baseURL}/api/users/${friendId}`
        );
        if (!response.ok) {
          throw new Error(`Erreur HTTP ${response.status}`);
        }
        const data = await response.json();
        setUser(data);

        // Récupérer l'utilisateur connecté
        const userString = await AsyncStorage.getItem('user');
        const currentUser = userString ? JSON.parse(userString) : null;
        const currentUserId = currentUser
          ? currentUser.id || currentUser._id
          : null;
        if (currentUserId) {
          // Vérifier si le profil consulté est déjà ami
          const friendsResponse = await fetch(
            `${apiConfig.baseURL}/api/friends/${currentUserId}`
          );
          if (friendsResponse.ok) {
            const friendsList = await friendsResponse.json();
            const friendIds = friendsList.map((f: any) =>
              String(f.friendId._id || f.friendId)
            );
            setIsFriend(friendIds.includes(String(friendId)));
          }
          // Si non ami, vérifier s'il existe une invitation pending
          if (!isFriend) {
            const pendingResponse = await fetch(
              `${apiConfig.baseURL}/api/invitations?senderId=${currentUserId}&receiverId=${friendId}&status=pending`
            );
            if (pendingResponse.ok) {
              const pendingData = await pendingResponse.json();
              if (Array.isArray(pendingData) && pendingData.length > 0) {
                setInvitationPending(true);
              }
            }
          }
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [friendId, isFriend]);

  const handleAction = () => {
    if (isFriend) {
      Alert.alert(
        "Supprimer l'ami",
        `Voulez-vous vraiment supprimer ${user.firstname} ${user.lastname} de vos amis ?`,
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Supprimer',
            style: 'destructive',
            onPress: async () => {
              try {
                const userString = await AsyncStorage.getItem('user');
                const currentUser = userString ? JSON.parse(userString) : null;
                const currentUserId = currentUser
                  ? currentUser.id || currentUser._id
                  : null;
                if (!currentUserId) {
                  Alert.alert('Erreur', 'Utilisateur non authentifié.');
                  return;
                }
                const response = await fetch(
                  `${apiConfig.baseURL}/api/friends`,
                  {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      userId: currentUserId,
                      friendId: friendId,
                    }),
                  }
                );
                if (!response.ok) {
                  throw new Error(`Erreur HTTP ${response.status}`);
                }
                Alert.alert('Ami supprimé');
                router.replace('/(friends)');
              } catch (error: any) {
                console.error(error);
                Alert.alert('Erreur', error.message);
              }
            },
          },
        ]
      );
    } else {
      if (!invitationPending) {
        (async () => {
          try {
            const userString = await AsyncStorage.getItem('user');
            const currentUser = userString ? JSON.parse(userString) : null;
            const currentUserId = currentUser
              ? currentUser.id || currentUser._id
              : null;
            if (!currentUserId) {
              Alert.alert('Erreur', 'Utilisateur non authentifié.');
              return;
            }
            const response = await fetch(
              `${apiConfig.baseURL}/api/invitations`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  senderId: currentUserId,
                  receiverId: friendId,
                }),
              }
            );
            if (!response.ok) {
              throw new Error(`Erreur HTTP ${response.status}`);
            }
            Alert.alert(
              'Invitation envoyée',
              `Une invitation a été envoyée à ${user.firstname} ${user.lastname}.`
            );
            setInvitationPending(true);
          } catch (error: any) {
            console.error("Erreur lors de l'envoi de l'invitation :", error);
            Alert.alert('Erreur', error.message);
          }
        })();
      }
    }
  };

  if (loading) {
    return <LoadingContainer />;
  }

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Utilisateur non trouvé.</Text>
      </View>
    );
  }

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

      {/* Informations du profil */}
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

      {isFriend ? (
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={handleAction}
        >
          <Text style={styles.actionButtonText}>Supprimer l'ami</Text>
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
          onPress={handleAction}
        >
          <Text style={styles.actionButtonText}>Envoyer une invitation</Text>
        </TouchableOpacity>
      )}

      {/* Détails du profil */}
      <View style={styles.infoContainer}>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Email</Text>
          <Text style={styles.infoValue}>{user.email}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Téléphone</Text>
          <Text style={styles.infoValue}>{user.phoneNumber}</Text>
        </View>
        <View style={styles.infoItem}>
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
  pendingButton: {
    backgroundColor: Colors.gray500,
  },
  pendingText: {
    color: Colors.gray800,
  },
  deleteButton: {
    backgroundColor: Colors.error,
    paddingHorizontal: 40,
  },
  actionButtonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '600',
  },
  friendButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
});

export default UserProfileScreen;
