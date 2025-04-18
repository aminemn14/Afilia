import React, { useState, useEffect, useCallback } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useFocusEffect } from 'expo-router';
import Colors from '../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import apiConfig from '@/config/apiConfig';
import useSocket from '../hooks/useSocket';
import LoadingContainer from '../components/LoadingContainer';

export default function ProfileScreen() {
  const [user, setUser] = useState<any>(null);
  const [invitationCount, setInvitationCount] = useState(0);
  const [cashback, setCashback] = useState<number>(0);
  const router = useRouter();
  const socketRef = useSocket();

  // Récupère userId depuis AsyncStorage
  const loadStoredUser = async () => {
    const json = await AsyncStorage.getItem('user');
    if (!json) return null;
    return JSON.parse(json);
  };

  // Charge les données utilisateur depuis l'API
  const fetchUserData = async () => {
    try {
      const stored = await loadStoredUser();
      if (!stored) return;
      const userId = stored._id || stored.id;

      // Récupère le profil à jour
      const profileRes = await fetch(
        `${apiConfig.baseURL}/api/users/${userId}`
      );
      if (!profileRes.ok) throw new Error('Impossible de charger le profil');
      const profile = await profileRes.json();
      setUser(profile);
      setCashback(profile.cashbackBalance ?? 0);

      // Récupère les invitations en attente
      const invRes = await fetch(
        `${apiConfig.baseURL}/api/invitations?receiverId=${userId}&status=pending`
      );
      if (invRes.ok) {
        const inv = await invRes.json();
        setInvitationCount(Array.isArray(inv) ? inv.length : 0);
      }

      // Rejoint la room socket
      socketRef.current?.emit('joinRoom', userId);

      // Met à jour AsyncStorage pour garder le profil en local
      await AsyncStorage.setItem('user', JSON.stringify(profile));
    } catch (err: any) {
      console.error('Erreur récupération utilisateur', err);
      Alert.alert('Erreur', err.message);
    }
  };

  // Rafraîchit à chaque focus
  useFocusEffect(
    useCallback(() => {
      fetchUserData();
    }, [socketRef])
  );

  // Écoute les événements socket
  useEffect(() => {
    if (!socketRef.current) return;

    const onInvitationReceived = () => setInvitationCount((c) => c + 1);
    const onInvitationUpdated = () =>
      setInvitationCount((c) => Math.max(0, c - 1));
    const onCashbackUpdated = (data: any) => {
      // data: { userId, newCashbackBalance }
      const stored = user?._id || user?.id;
      if (data.userId === stored) {
        setCashback(data.newCashbackBalance);
        // met à jour le profil en mémoire et AsyncStorage
        setUser((u: any) => ({
          ...u,
          cashbackBalance: data.newCashbackBalance,
        }));
        AsyncStorage.mergeItem(
          'user',
          JSON.stringify({ cashbackBalance: data.newCashbackBalance })
        ).catch(console.error);
      }
    };

    socketRef.current.on('invitationReceived', onInvitationReceived);
    socketRef.current.on('invitationUpdated', onInvitationUpdated);
    socketRef.current.on('cashbackUpdated', onCashbackUpdated);

    return () => {
      socketRef.current.off('invitationReceived', onInvitationReceived);
      socketRef.current.off('invitationUpdated', onInvitationUpdated);
      socketRef.current.off('cashbackUpdated', onCashbackUpdated);
    };
  }, [socketRef, user]);

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      router.replace('/welcome');
    } catch (err) {
      Alert.alert('Erreur', 'Impossible de se déconnecter, réessayez.');
    }
  };

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingContainer />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
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
        {/* Email */}
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Email</Text>
          <Text style={styles.infoValue}>{user.email}</Text>
        </View>
        {/* Username */}
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Nom d'utilisateur</Text>
          <Text style={styles.infoValue}>{user.username}</Text>
        </View>
        {/* Téléphone */}
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Téléphone</Text>
          <Text style={styles.infoValue}>{user.phoneNumber}</Text>
        </View>
        {/* Bio */}
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Bio</Text>
          <Text style={styles.infoValue}>{user.bio || 'Aucune bio'}</Text>
        </View>
        {/* Cashback */}
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Cashback cumulé</Text>
          <Text style={styles.infoValue}>{cashback.toFixed(2)} €</Text>
        </View>
      </View>

      <TouchableOpacity
        onPress={() => router.push('/(settingsProfile)/invitations')}
      >
        <View style={[styles.infoContainer, styles.noMargin]}>
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: Colors.primary,
    height: 140,
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
    marginTop: -60,
    marginBottom: 20,
  },
  avatarWrapper: {
    backgroundColor: Colors.background,
    borderRadius: 70,
    padding: 5,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 64,
    borderWidth: 0.75,
    borderColor: Colors.white,
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.text,
    marginVertical: 10,
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
  noMargin: { marginBottom: 10 },
  infoItem: { marginBottom: 20 },
  infoLabel: { fontSize: 12, color: Colors.gray600, marginBottom: 4 },
  infoValue: { fontSize: 16, fontWeight: 'bold', color: Colors.text },
  invitationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  invitationLabel: { fontSize: 16, color: Colors.text },
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
  logoutButtonText: { color: Colors.white, fontSize: 18, fontWeight: '600' },
});
