import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '../../constants/Colors';
import apiConfig from '@/config/apiConfig';
import useSocket from '../../hooks/useSocket';
import { MessageType } from '../../types';

type RouteParams = {
  conversationId: string;
  friend: string;
};

const ChatConversation = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<{ params: RouteParams }, 'params'>>();

  const { conversationId, friend } = route.params;
  const parsedFriend = typeof friend === 'string' ? JSON.parse(friend) : friend;

  if (!parsedFriend || !parsedFriend.id) {
    console.error('Erreur : Friend est invalide', parsedFriend);
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Erreur : conversation invalide</Text>
        </View>
      </SafeAreaView>
    );
  }

  const [messages, setMessages] = useState<MessageType[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const socketRef = useSocket();

  // Fonction pour ajouter ou mettre à jour un message afin d'éviter le doublon
  const addMessage = (newMsg: MessageType) => {
    setMessages((prev) => {
      const index = prev.findIndex((m) => {
        return (
          m.sender === newMsg.sender &&
          m.text.trim() === newMsg.text.trim() &&
          m.id.startsWith('temp_') &&
          Math.abs(m.createdAt.getTime() - newMsg.createdAt.getTime()) < 2000
        );
      });
      if (index !== -1) {
        const newMessages = [...prev];
        newMessages[index] = newMsg;
        return newMessages;
      }
      return [...prev, newMsg];
    });
  };

  // Récupération de l'utilisateur courant
  useEffect(() => {
    const getUser = async () => {
      try {
        const userString = await AsyncStorage.getItem('user');
        const currentUser = userString ? JSON.parse(userString) : null;
        if (currentUser) {
          const userId = currentUser.id || currentUser._id;
          setCurrentUserId(userId);
        }
      } catch (error) {
        console.error('Erreur lors de la récupération du user:', error);
      }
    };
    getUser();
  }, []);

  // Dès que currentUserId est disponible, rejoindre la room Socket.IO
  useEffect(() => {
    if (socketRef.current && currentUserId) {
      socketRef.current.emit('joinRoom', currentUserId);
    }
  }, [currentUserId, socketRef]);

  // Écoute des messages via Socket.IO
  useEffect(() => {
    if (!socketRef.current) return;
    socketRef.current.on('newMessage', (message: any) => {
      const senderType =
        message.sender_id === parsedFriend.id ? 'friend' : 'me';
      const newMsg: MessageType = {
        id: message._id || message.id,
        text: message.content,
        sender: senderType,
        createdAt: new Date(message.created_at),
      };
      addMessage(newMsg);
    });
    return () => {
      socketRef.current?.off('newMessage');
    };
  }, [parsedFriend.id, socketRef]);

  // Chargement initial des messages depuis l'API
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch(
          `${apiConfig.baseURL}/api/messages/conversations/${conversationId}/messages`
        );
        if (response.ok) {
          const data = await response.json();
          // Inverser l'ordre pour afficher chronologiquement (ancien en haut)
          const mappedMessages = data
            .map((msg: any) => ({
              id: msg._id,
              text: msg.content,
              sender: msg.sender_id === parsedFriend.id ? 'friend' : 'me',
              createdAt: new Date(msg.created_at),
            }))
            .reverse();
          setMessages(mappedMessages);
        } else {
          console.error('Erreur lors du chargement des messages');
        }
      } catch (error) {
        console.error('Erreur de fetch des messages', error);
      }
    };
    fetchMessages();
  }, [conversationId, parsedFriend.id]);

  // Scroll initial vers le bas
  useEffect(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: false });
    }, 300);
  }, []);

  // Navigation vers le profil utilisateur
  const goToUserProfile = () => {
    router.push({
      pathname: '/(friends)/userProfile',
      params: { friendId: parsedFriend.id },
    });
  };

  // Envoi d'un message
  const sendMessage = async () => {
    if (!inputMessage.trim() || !currentUserId) return;
    const tempId = `temp_${Date.now()}`;
    const newMsg: MessageType = {
      id: tempId,
      text: inputMessage,
      sender: 'me',
      createdAt: new Date(),
    };
    addMessage(newMsg);
    setInputMessage('');
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
    if (socketRef.current) {
      socketRef.current.emit('sendMessage', {
        conversationId,
        content: inputMessage,
        sender_id: currentUserId,
        receiver_id: parsedFriend.id,
      });
    }
    const payload = {
      conversation_id: conversationId,
      sender_id: currentUserId,
      receiver_id: parsedFriend.id,
      content: inputMessage,
    };
    console.log('Envoi du message avec le payload :', payload);
    try {
      const response = await fetch(`${apiConfig.baseURL}/api/messages/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        console.error(
          'Erreur lors de l’enregistrement du message, status:',
          response.status
        );
      }
    } catch (error) {
      console.error('Erreur API lors de l’envoi du message:', error);
    }
  };

  // Formatage de l'heure (HH:MM)
  const formatTime = (date: Date) =>
    date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  // Formatage de la date (DD/MM)
  const formatDateShort = (date: Date) => {
    const d = date.getDate();
    const m = date.getMonth() + 1;
    return `${d < 10 ? '0' + d : d}/${m < 10 ? '0' + m : m}`;
  };

  const renderMessage = ({ item }: { item: MessageType }) => {
    const isMe = item.sender === 'me';
    return (
      <View
        style={[
          styles.messageContainer,
          isMe ? styles.messageRight : styles.messageLeft,
        ]}
      >
        <Text style={[styles.messageText, isMe && styles.messageTextRight]}>
          {item.text}
        </Text>
        <View style={styles.messageDateContainer}>
          <Text
            style={[
              styles.messageDate,
              isMe ? styles.dateTimeMine : styles.dateTimeFriend,
            ]}
          >
            {formatDateShort(item.createdAt)}
          </Text>
          <Text
            style={[
              styles.messageTime,
              isMe ? styles.dateTimeMine : styles.dateTimeFriend,
            ]}
          >
            {formatTime(item.createdAt)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 10}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="chevron-back" size={28} color={Colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.profileHeader}
            onPress={goToUserProfile}
          >
            <Image
              source={
                parsedFriend.avatar
                  ? { uri: parsedFriend.avatar }
                  : require('@/assets/images/avatar-default.png')
              }
              style={styles.avatar}
            />
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>
                {parsedFriend.name || 'Conversation'}
              </Text>
              {parsedFriend.username && (
                <Text style={styles.headerUsername}>
                  {parsedFriend.username}
                </Text>
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* Liste des messages */}
        {messages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Démarrer la conversation</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={[
              styles.messagesList,
              { flexGrow: 1, justifyContent: 'flex-end' },
            ]}
            onContentSizeChange={() =>
              flatListRef.current?.scrollToEnd({ animated: true })
            }
          />
        )}

        {/* Zone de saisie */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Votre message..."
            placeholderTextColor={Colors.gray400}
            value={inputMessage}
            onChangeText={setInputMessage}
          />
          <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
            <Ionicons name="send" size={24} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
  },
  backButton: {
    marginRight: 8,
  },
  profileHeader: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 20,
  },
  headerTextContainer: {
    flex: 1,
    marginHorizontal: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  headerUsername: {
    fontSize: 12,
    color: Colors.gray400,
  },
  messagesList: {
    padding: 16,
    paddingBottom: 80,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 18,
    color: Colors.gray400,
  },
  messageContainer: {
    marginVertical: 4,
    maxWidth: '70%',
    padding: 10,
    borderRadius: 10,
  },
  messageLeft: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.gray100,
  },
  messageRight: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.primary,
  },
  messageText: {
    fontSize: 16,
    color: Colors.text,
  },
  messageTextRight: {
    color: Colors.white,
  },
  messageDateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  messageDate: {
    fontSize: 10,
    marginRight: 8,
  },
  messageTime: {
    fontSize: 10,
    textAlign: 'right',
  },
  dateTimeMine: {
    color: Colors.gray100,
  },
  dateTimeFriend: {
    color: Colors.gray400,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.gray200,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.gray200,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    fontSize: 16,
    color: Colors.text,
  },
  sendButton: {
    backgroundColor: Colors.primary,
    borderRadius: 20,
    padding: 10,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  errorText: {
    fontSize: 18,
    color: 'red',
  },
});

export default ChatConversation;
