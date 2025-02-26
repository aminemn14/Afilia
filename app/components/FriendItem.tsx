import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Colors from '../constants/Colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiConfig from '@/config/apiConfig';
import { Friend, FriendItemProps } from '../types';

const FriendItem = ({
  item,
  index,
  isFriend,
  onInviteSent,
  onAcceptReceived,
}: FriendItemProps) => {
  const [imageError, setImageError] = useState(false);

  const handleProfile = () => {
    router.push({
      pathname: '/(friends)/userProfile',
      params: { friendId: item.id },
    });
  };

  const handleInvite = async (e: any) => {
    e.stopPropagation && e.stopPropagation();

    // Récupérer l'utilisateur connecté depuis AsyncStorage
    const userString = await AsyncStorage.getItem('user');
    const currentUser = userString ? JSON.parse(userString) : null;
    const currentUserId = currentUser
      ? currentUser.id || currentUser._id
      : null;
    if (!currentUserId) {
      Alert.alert('Erreur', 'Utilisateur non authentifié.');
      return;
    }

    try {
      const response = await fetch(`${apiConfig.baseURL}/api/invitations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: currentUserId,
          receiverId: item.id,
        }),
      });
      if (!response.ok) {
        throw new Error(`Erreur HTTP ${response.status}`);
      }
      Alert.alert('Invitation envoyée', `Invitation envoyée à ${item.name}.`);
      // Marquer localement comme invitation envoyée (pending)
      onInviteSent && onInviteSent(item.id);
    } catch (error: any) {
      console.error("Erreur lors de l'envoi de l'invitation :", error);
      Alert.alert('Erreur', error.message);
    }
  };

  const handleAccept = () => {
    // On appelle le callback si défini
    onAcceptReceived &&
      onAcceptReceived(item, item.invitationReceivedId || null);
  };

  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ delay: index * 100 }}
    >
      <TouchableOpacity style={styles.friendCard} onPress={handleProfile}>
        <View style={styles.avatarContainer}>
          <Image
            source={
              imageError || !item.avatar
                ? require('@/assets/images/avatar-default.png')
                : { uri: item.avatar }
            }
            style={styles.avatar}
            onError={() => setImageError(true)}
          />
        </View>
        <View style={styles.friendContent}>
          <Text style={styles.friendName}>{item.name}</Text>
          <Text style={styles.friendUsername}>@{item.username}</Text>
        </View>
        {isFriend ? (
          <Ionicons name="chevron-forward" size={24} color={Colors.gray400} />
        ) : (
          <View style={styles.nonFriendActions}>
            {item.invitationReceived ? (
              <TouchableOpacity
                style={[styles.inviteButton, styles.acceptButton]}
                onPress={handleAccept}
              >
                <Text style={styles.inviteButtonText}>Accepter</Text>
              </TouchableOpacity>
            ) : item.invitationPending ? (
              <View style={[styles.inviteButton, styles.pendingButton]}>
                <Text style={[styles.inviteButtonText, styles.pendingText]}>
                  En attente
                </Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.inviteButton}
                onPress={handleInvite}
              >
                <Text style={styles.inviteButtonText}>Inviter</Text>
              </TouchableOpacity>
            )}
            <Ionicons name="chevron-forward" size={24} color={Colors.gray400} />
          </View>
        )}
      </TouchableOpacity>
    </MotiView>
  );
};

export default FriendItem;

const styles = StyleSheet.create({
  friendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    marginHorizontal: 20,
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  friendContent: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  friendUsername: {
    fontSize: 12,
    color: Colors.gray400,
    marginTop: 4,
  },
  nonFriendActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inviteButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginRight: 8,
  },
  pendingButton: {
    backgroundColor: Colors.gray500,
  },
  pendingText: {
    color: Colors.gray800,
  },
  acceptButton: {
    backgroundColor: Colors.accent,
  },
  inviteButtonText: {
    color: Colors.white,
    fontWeight: '600',
  },
});
