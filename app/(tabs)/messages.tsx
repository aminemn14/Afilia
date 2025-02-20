import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
} from 'react-native';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/Colors';
import type { Message } from '@/app/types';

const MOCK_MESSAGES: (Message & { user: { name: string; avatar: string } })[] =
  [
    {
      id: '1',
      sender_id: '2',
      receiver_id: '1',
      content: 'Tu viens au match de basket ce soir ?',
      created_at: '2024-01-20T10:00:00Z',
      read: false,
      user: {
        name: 'John Smith',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e',
      },
    },
    {
      id: '2',
      sender_id: '3',
      receiver_id: '1',
      content: "C'était un super match hier ! On rejoue la semaine prochaine ?",
      created_at: '2024-01-19T15:30:00Z',
      read: true,
      user: {
        name: 'Sarah Johnson',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330',
      },
    },
  ];

const MessageItem = ({
  item,
  index,
}: {
  item: (typeof MOCK_MESSAGES)[0];
  index: number;
}) => {
  const [imageError, setImageError] = useState(false);

  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ delay: index * 100 }}
    >
      <TouchableOpacity style={styles.messageCard}>
        <View style={styles.avatarContainer}>
          <Image
            source={
              imageError || !item.user.avatar
                ? require('@/assets/images/avatar-default.png')
                : { uri: item.user.avatar }
            }
            style={styles.avatar}
            onError={() => setImageError(true)}
          />
          {!item.read && <View style={styles.unreadBadge} />}
        </View>
        <View style={styles.messageContent}>
          <View style={styles.messageHeader}>
            <Text
              style={[styles.userName, !item.read && { fontWeight: 'bold' }]}
            >
              {item.user.name}
            </Text>
            <Text
              style={[styles.messageTime, !item.read && { fontWeight: 'bold' }]}
            >
              {new Date(item.created_at).toLocaleDateString()}
            </Text>
          </View>
          <Text
            style={[styles.messageText, !item.read && { fontWeight: 'bold' }]}
            numberOfLines={1}
          >
            {item.content}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={Colors.gray400} />
      </TouchableOpacity>
    </MotiView>
  );
};

export default function MessagesScreen() {
  const [messages] = useState(MOCK_MESSAGES);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
        <TouchableOpacity style={styles.newMessageButton}>
          <Ionicons name="create-outline" size={24} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {messages.length > 0 ? (
        <FlatList
          data={messages}
          renderItem={({ item, index }) => (
            <MessageItem item={item} index={index} />
          )}
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
            Aucun message pour l'instant
          </Text>
          <Text style={styles.emptyStateSubtext}>
            Commencez à vous connecter avec d'autres utilisateurs d'Afilia !
          </Text>
        </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 80,
    backgroundColor: Colors.white,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.text,
  },
  newMessageButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesList: {
    padding: 20,
  },
  messageCard: {
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
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  unreadBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 18,
    height: 18,
    borderRadius: 100,
    backgroundColor: Colors.primary,
    borderWidth: 2,
    borderColor: Colors.white,
  },
  messageContent: {
    flex: 1,
    marginRight: 8,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  messageTime: {
    fontSize: 12,
    color: Colors.gray600,
  },
  messageText: {
    fontSize: 14,
    color: Colors.gray700,
    lineHeight: 20,
  },
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
