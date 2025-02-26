import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import Colors from '../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import apiConfig from '@/config/apiConfig';
import useSocket from '../hooks/useSocket';

export default function ProfileScreen() {
  const [user, setUser] = useState<any>(null);
  const [invitationCount, setInvitationCount] = useState(0);
  const router = useRouter();
  const socketRef = useSocket();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userString = await AsyncStorage.getItem('user');
        if (userString) {
          const userObj = JSON.parse(userString);
          setUser(userObj);
          const userId = userObj.id || userObj._id;
          // Récupérer le nombre d'invitations en attente (pending) pour ce compte (receiver)
          const response = await fetch(
            `${apiConfig.baseURL}/api/invitations?receiverId=${userId}&status=pending`
          );
          if (response.ok) {
            const data = await response.json();
            // On suppose que data est un tableau d'invitations
            setInvitationCount(Array.isArray(data) ? data.length : 0);
          }
          // Rejoindre la salle dédiée à l'utilisateur pour recevoir des mises à jour
          if (socketRef.current) {
            socketRef.current.emit('joinRoom', userId);
          }
        }
      } catch (error) {
        console.error(
          'Erreur lors de la récupération des infos utilisateur',
          error
        );
      }
    };
    fetchUser();
  }, [socketRef]);

  // Écouter les événements Socket.IO pour actualiser le compteur en direct
  useEffect(() => {
    if (!socketRef.current) return;

    const handleInvitationReceived = (invitation: any) => {
      // Incrémente le compteur
      setInvitationCount((prev) => prev + 1);
    };

    const handleInvitationUpdated = (invitation: any) => {
      // Si une invitation a été traitée, décrémente le compteur (on peut ajuster la logique selon vos besoins)
      setInvitationCount((prev) => (prev > 0 ? prev - 1 : 0));
    };

    socketRef.current.on('invitationReceived', handleInvitationReceived);
    socketRef.current.on('invitationUpdated', handleInvitationUpdated);

    return () => {
      socketRef.current?.off('invitationReceived', handleInvitationReceived);
      socketRef.current?.off('invitationUpdated', handleInvitationUpdated);
    };
  }, [socketRef]);

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      router.replace('/welcome');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de se déconnecter, réessayez.');
    }
  };

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Chargement...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.push('/(settingsProfile)')}
        >
          <Ionicons name="create-outline" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.profileInfoContainer}>
        <View style={styles.avatarWrapper}>
          <Image
            source={
              user.avatar
                ? { uri: user.avatar }
                : require('@/assets/images/avatar-default.png')
            }
            style={styles.avatar}
          />
        </View>
        <Text style={styles.name}>
          {user.firstname} {user.lastname}
        </Text>
      </View>

      <View style={styles.infoContainer}>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Email</Text>
          <Text style={styles.infoValue}>{user.email}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Nom d'utilisateur</Text>
          <Text style={styles.infoValue}>{user.username}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Téléphone</Text>
          <Text style={styles.infoValue}>{user.phoneNumber}</Text>
        </View>
        <View style={styles.noMarginInfoItem}>
          <Text style={styles.infoLabel}>Bio</Text>
          <Text style={styles.infoValue}>{user.bio || 'Aucune bio'}</Text>
        </View>
      </View>

      <TouchableOpacity
        onPress={() => router.push('/(settingsProfile)/invitations')}
      >
        <View style={styles.infoContainer}>
          <View style={styles.invitationContainer}>
            {invitationCount > 0 && <View style={styles.dot} />}
            <Text style={styles.invitationLabel}>
              Invitations en ami ({invitationCount})
            </Text>
            <Ionicons name="chevron-forward" size={24} color={Colors.primary} />
          </View>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Déconnexion</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: Colors.primary,
    height: 150,
    paddingHorizontal: 20,
    paddingTop: 40,
    flexDirection: 'row',
    justifyContent: 'flex-end',
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
    marginVertical: 15,
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
  noMarginInfoItem: {
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
  invitationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  invitationLabel: {
    fontSize: 16,
    color: Colors.text,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
    marginRight: 8,
  },
  logoutButton: {
    backgroundColor: Colors.error,
    marginHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 40,
  },
  logoutButtonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '600',
  },
});
