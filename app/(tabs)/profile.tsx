import React, { useState, useEffect, useCallback } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/Colors';
import apiConfig from '@/config/apiConfig';
import useSocket from '../hooks/useSocket';
import LoadingContainer from '../components/LoadingContainer';

export default function ProfileScreen() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [invitationCount, setInvitationCount] = useState(0);
  const [cashback, setCashback] = useState<number>(0);
  const router = useRouter();
  const socketRef = useSocket();

  // Load stored user
  const loadStoredUser = async () => {
    const json = await AsyncStorage.getItem('user');
    if (!json) return null;
    return JSON.parse(json);
  };

  // Fetch user data
  const fetchUserData = async () => {
    setLoading(true);
    setError(null);
    try {
      const stored = await loadStoredUser();
      if (!stored) {
        setLoading(false);
        return;
      }
      const userId = stored._id || stored.id;

      const profileRes = await fetch(
        `${apiConfig.baseURL}/api/users/${userId}`
      );
      if (!profileRes.ok) throw new Error('Impossible de charger le profil');
      const profile = await profileRes.json();
      setUser(profile);
      setCashback(profile.cashbackBalance ?? 0);

      const invRes = await fetch(
        `${apiConfig.baseURL}/api/invitations?receiverId=${userId}&status=pending`
      );
      if (invRes.ok) {
        const inv = await invRes.json();
        setInvitationCount(Array.isArray(inv) ? inv.length : 0);
      }

      socketRef.current?.emit('joinRoom', userId);
      await AsyncStorage.setItem('user', JSON.stringify(profile));
    } catch (err: any) {
      console.error('Erreur récupération utilisateur', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle account deletion
  const handleDeleteAccount = () => {
    const promptFunction = () => {
      Alert.prompt(
        'Supprimer mon compte',
        'Entrez votre mot de passe pour confirmer la suppression.',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Supprimer',
            style: 'destructive',
            onPress: async (password) => {
              try {
                const stored = await loadStoredUser();
                const userId = stored?._id || stored?.id;
                const token = await AsyncStorage.getItem('token');
                const res = await fetch(
                  `${apiConfig.baseURL}/api/users/${userId}`,
                  {
                    method: 'DELETE',
                    headers: {
                      'Content-Type': 'application/json',
                      Authorization: token ? `Bearer ${token}` : '',
                    },
                    body: JSON.stringify({ password }),
                  }
                );
                if (!res.ok) {
                  const errBody = await res.json();
                  throw new Error(errBody.error || 'Erreur suppression');
                }
                // Clear storage and redirect
                await AsyncStorage.removeItem('token');
                await AsyncStorage.removeItem('user');
                router.replace('/(auth)/welcome');
              } catch (err: any) {
                console.error('Erreur suppression compte', err);
                Alert.alert('Erreur', err.message);
              }
            },
          },
        ],
        'secure-text'
      );
    };

    // iOS supports Alert.prompt; Android fallback
    if (Platform.OS === 'ios') {
      promptFunction();
    } else {
      // Android: simple prompt via Alert + custom modal could be implemented
      promptFunction();
    }
  };

  // Logout
  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      router.replace('/(auth)/welcome');
    } catch {
      Alert.alert('Erreur', 'Impossible de se déconnecter, réessayez.');
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchUserData();
    }, [socketRef])
  );

  useEffect(() => {
    if (!socketRef.current) return;
    const onInvitationReceived = () => setInvitationCount((c) => c + 1);
    const onInvitationUpdated = () =>
      setInvitationCount((c) => Math.max(0, c - 1));
    const onCashbackUpdated = (data: any) => {
      const storedId = user?._id || user?.id;
      if (data.userId === storedId) {
        setCashback(data.newCashbackBalance);
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
      socketRef.current?.off('invitationReceived', onInvitationReceived);
      socketRef.current?.off('invitationUpdated', onInvitationUpdated);
      socketRef.current?.off('cashbackUpdated', onCashbackUpdated);
    };
  }, [socketRef, user]);

  if (loading) {
    return (
      <View style={styles.blockContainer}>
        <LoadingContainer />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.blockContainer}>
        <Text style={styles.errorText}>Erreur : {error.message}</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.mustConnectContainer}>
        <Ionicons
          name="alert-circle-outline"
          size={60}
          color={Colors.gray400}
        />
        <Text style={styles.mustConnectText}>
          Vous devez vous connecter pour accéder à votre profil.
        </Text>
        <TouchableOpacity
          style={styles.connectButton}
          onPress={() => router.replace('/(auth)/welcome')}
          accessibilityLabel="Se connecter"
          accessibilityRole="button"
          accessibilityHint="Accédez à l’écran de connexion"
        >
          <Text style={styles.connectButtonText}>Se connecter</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.push('/(settingsProfile)')}
          accessibilityLabel="Modifier mon profil"
          accessibilityRole="button"
          accessibilityHint="Appuyez pour accéder à l’écran de modification du profil"
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
            accessible={true}
            accessibilityLabel={`Photo de profil de ${user.firstname} ${user.lastname}`}
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
        <View style={styles.infoLastItem}>
          <Text style={styles.infoLabel}>Cashback cumulé</Text>
          <Text style={styles.infoValue}>{cashback.toFixed(2)} €</Text>
        </View>
      </View>

      <TouchableOpacity
        onPress={() => router.push('/(settingsProfile)/invitations')}
        accessibilityLabel={`Invitations en attente : ${invitationCount}`}
        accessibilityRole="button"
        accessibilityHint="Appuyez pour gérer vos invitations d’amis"
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

      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
        accessibilityLabel="Déconnexion"
        accessibilityRole="button"
        accessibilityHint="Appuyez pour vous déconnecter"
      >
        <Text style={styles.logoutButtonText}>Déconnexion</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={handleDeleteAccount}
        accessibilityLabel="Supprimer mon compte"
        accessibilityRole="button"
        accessibilityHint="Appuyez pour lancer la suppression de votre compte"
      >
        <Text style={styles.deleteAccountText}>Supprimer mon compte</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  blockContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: { color: Colors.error, fontSize: 18 },
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
  header: {
    backgroundColor: Colors.primary,
    height: 130,
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
    marginBottom: 10,
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  noMargin: { marginBottom: 10 },
  infoItem: { marginBottom: 20 },
  infoLastItem: { marginBottom: 0 },
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
    marginTop: 10,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  logoutButtonText: { color: Colors.white, fontSize: 18, fontWeight: '600' },
  deleteAccountText: {
    textAlign: 'center',
    fontSize: 16,
    color: Colors.error,
    marginBottom: 20,
  },
});
