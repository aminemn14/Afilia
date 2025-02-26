import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '../constants/Colors';
import apiConfig from '@/config/apiConfig';
import { router, useFocusEffect } from 'expo-router';
import { Invitation } from '../types';

export default function InvitationsScreen() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const fetchInvitations = async () => {
    try {
      const userString = await AsyncStorage.getItem('user');
      const currentUser = userString ? JSON.parse(userString) : null;
      const userId = currentUser ? currentUser.id || currentUser._id : null;
      if (!userId) {
        setLoading(false);
        router.replace('/login');
        return;
      }
      setCurrentUserId(userId);
      const response = await fetch(
        `${apiConfig.baseURL}/api/invitations/${userId}`
      );
      if (!response.ok) {
        throw new Error(`Erreur HTTP ${response.status}`);
      }
      const result = await response.json();
      setInvitations(Array.isArray(result) ? result : result.invitations);
    } catch (err: any) {
      console.error('Erreur lors du chargement des invitations :', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Rafraîchir la liste à chaque fois que l'écran devient actif
  useFocusEffect(
    useCallback(() => {
      fetchInvitations();
    }, [])
  );

  const removeInvitationFromList = (invitationId: string) => {
    setInvitations((prev) => prev.filter((inv) => inv._id !== invitationId));
  };

  const handleAccept = async (invitation: Invitation) => {
    if (!currentUserId) return;
    try {
      const response = await fetch(
        `${apiConfig.baseURL}/api/invitations/${invitation._id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'accepted' }),
        }
      );
      if (!response.ok) {
        throw new Error(`Erreur HTTP ${response.status}`);
      }
      removeInvitationFromList(invitation._id);
      const friendId =
        typeof invitation.senderId === 'object'
          ? invitation.senderId._id
          : invitation.senderId;
      const addFriendResponse = await fetch(
        `${apiConfig.baseURL}/api/friends`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: currentUserId, friendId }),
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

  const handleReject = async (invitation: Invitation) => {
    try {
      const response = await fetch(
        `${apiConfig.baseURL}/api/invitations/${invitation._id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'rejected' }),
        }
      );
      if (!response.ok) {
        throw new Error(`Erreur HTTP ${response.status}`);
      }
      removeInvitationFromList(invitation._id);
      Alert.alert('Invitation refusée', "L'invitation a été refusée.");
    } catch (error: any) {
      console.error("Erreur lors du refus de l'invitation :", error);
      Alert.alert('Erreur', error.message);
    }
  };

  const renderInvitation = ({ item }: { item: Invitation }) => {
    const sender = item.senderId;
    return (
      <View style={styles.invitationCard}>
        <Text style={styles.invitationText}>
          Invitation de {sender.firstname} {sender.lastname}
        </Text>
        <Text style={styles.invitationDate}>
          {new Date(item.createdAt).toLocaleString()}
        </Text>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.actionButton, styles.acceptButton]}
            onPress={() => handleAccept(item)}
          >
            <Text style={styles.actionButtonText}>Accepter</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.rejectButton]}
            onPress={() => handleReject(item)}
          >
            <Text style={styles.actionButtonText}>Refuser</Text>
          </TouchableOpacity>
        </View>
      </View>
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
        <Text style={styles.errorText}>Erreur : {error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Invitations</Text>
      </View>
      {invitations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons
            name="mail-unread-outline"
            size={64}
            color={Colors.gray400}
          />
          <Text style={styles.emptyText}>Aucune invitation</Text>
        </View>
      ) : (
        <FlatList
          data={invitations}
          keyExtractor={(item) => item._id}
          renderItem={renderInvitation}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: 20,
    paddingTop: 80,
    paddingBottom: 20,
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.text,
  },
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
  listContainer: {
    padding: 20,
  },
  invitationCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  invitationText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  invitationDate: {
    fontSize: 12,
    color: Colors.gray400,
    marginTop: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 16,
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  acceptButton: {
    backgroundColor: Colors.accent,
  },
  rejectButton: {
    backgroundColor: Colors.error,
  },
  actionButtonText: {
    color: Colors.white,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
  },
});
