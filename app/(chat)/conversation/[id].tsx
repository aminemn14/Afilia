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
  id: string;
  friend: string;
};

const ChatConversation = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<{ params: RouteParams }, 'params'>>();
  const { id, friend } = route.params;
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

  // Anti-dédoublement par ID
  const addMessage = (newMsg: MessageType) => {
    setMessages((prev) =>
      prev.some((m) => m.id === newMsg.id) ? prev : [...prev, newMsg]
    );
  };

  // Récupération du user
  useEffect(() => {
    AsyncStorage.getItem('user')
      .then((str) => {
        const usr = str ? JSON.parse(str) : null;
        if (usr) setCurrentUserId(usr.id || usr._id);
      })
      .catch((err) => console.error('Erreur fetch user', err));
  }, []);

  // … en haut du composant
  const socket = socketRef.current;

  useEffect(() => {
    if (!socket) return;

    // 1. Se connecter explicitement si besoin
    if (typeof socket.connect === 'function') {
      socket.connect();
    }

    // 2. Quand la socket est connectée, rejoindre la conversation
    const onConnect = () => {
      console.log('Socket connectée, j’émet joinConversation', id);
      socket.emit('joinConversation', id);
    };
    socket.on('connect', onConnect);

    // 3. Listener pour les nouveaux messages
    const onNewMessage = (message: any) => {
      const isMe = message.sender_id === currentUserId;
      const newMsg: MessageType = {
        id: message._id,
        text: message.content,
        sender: isMe ? 'me' : 'friend',
        createdAt: new Date(message.created_at),
      };

      if (isMe) {
        // Remplace l'optimistic message temp_xxx par la version officielle
        setMessages((prev) => {
          const idx = prev.findIndex(
            (m) => m.id.startsWith('temp_') && m.text === message.content
          );
          if (idx !== -1) {
            const next = [...prev];
            next[idx] = newMsg;
            return next;
          }
          // Si aucun temp trouvé (cas rare), on ajoute quand même
          return [...prev, newMsg];
        });
      } else {
        // Pour les messages de l'ami, on ajoute si pas déjà présent
        addMessage(newMsg);
      }

      // Scroll jusqu'en bas
      flatListRef.current?.scrollToEnd({ animated: true });
    };
    socket.on('newMessage', onNewMessage);

    // 4. Cleanup à la sortie
    return () => {
      socket.off('connect', onConnect);
      socket.off('newMessage', onNewMessage);
      // déconnecter si vous ne voulez pas garder la connexion en arrière-plan
      if (typeof socket.disconnect === 'function') {
        socket.disconnect();
      }
    };
  }, [socket, id, parsedFriend.id]);

  // Fetch initial
  useEffect(() => {
    fetch(`${apiConfig.baseURL}/api/messages/conversations/${id}/messages`)
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then((data) => {
        const mapped = data
          .map((msg: any) => ({
            id: msg._id,
            text: msg.content,
            sender: msg.sender_id === parsedFriend.id ? 'friend' : 'me',
            createdAt: new Date(msg.created_at),
          }))
          .reverse();
        setMessages(mapped);
      })
      .catch((err) => console.error('Erreur fetch messages', err));
  }, [id, parsedFriend.id]);

  // Scroll to bottom at mount
  useEffect(() => {
    setTimeout(
      () => flatListRef.current?.scrollToEnd({ animated: false }),
      300
    );
  }, []);

  const goToUserProfile = () =>
    router.push({
      pathname: '/(friends)/userProfile',
      params: { friendId: parsedFriend.id },
    });

  const sendMessage = () => {
    if (!inputMessage.trim() || !currentUserId) return;
    const tempId = `temp_${Date.now()}`;
    addMessage({
      id: tempId,
      text: inputMessage,
      sender: 'me',
      createdAt: new Date(),
    });
    setInputMessage('');
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

    socketRef.current?.emit('sendMessage', {
      conversationId: id,
      content: inputMessage,
      sender_id: currentUserId,
      receiver_id: parsedFriend.id,
    });

    fetch(`${apiConfig.baseURL}/api/messages/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversation_id: id,
        sender_id: currentUserId,
        receiver_id: parsedFriend.id,
        content: inputMessage,
      }),
    })
      .then((res) => !res.ok && console.error('Erreur POST', res.status))
      .catch((err) => console.error('Erreur POST', err));
  };

  const formatTime = (d: Date) =>
    d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const formatDate = (d: Date) => {
    const day = d.getDate(),
      mon = d.getMonth() + 1;
    return `${day < 10 ? '0' + day : day}/${mon < 10 ? '0' + mon : mon}`;
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
            {formatDate(item.createdAt)}
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
        keyboardVerticalOffset={10}
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
        {messages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Démarrer la conversation</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(i) => i.id}
            contentContainerStyle={[
              styles.messagesList,
              { flexGrow: 1, justifyContent: 'flex-end' },
            ]}
            onContentSizeChange={() =>
              flatListRef.current?.scrollToEnd({ animated: true })
            }
          />
        )}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Votre message..."
            placeholderTextColor={Colors.gray400}
            value={inputMessage}
            onChangeText={setInputMessage}
            returnKeyType="send"
            returnKeyLabel="Envoyer"
            onSubmitEditing={sendMessage}
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
  safeArea: { flex: 1, backgroundColor: Colors.white },
  container: { flex: 1, backgroundColor: Colors.white },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
  },
  backButton: { marginRight: 8 },
  profileHeader: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 20,
  },
  headerTextContainer: { flex: 1, marginHorizontal: 8 },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: Colors.text },
  headerUsername: { fontSize: 12, color: Colors.gray400 },
  messagesList: { padding: 16, paddingBottom: 80 },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyText: { fontSize: 18, color: Colors.gray400 },
  messageContainer: {
    marginVertical: 4,
    maxWidth: '70%',
    padding: 10,
    borderRadius: 10,
  },
  messageLeft: { alignSelf: 'flex-start', backgroundColor: Colors.gray100 },
  messageRight: { alignSelf: 'flex-end', backgroundColor: Colors.primary },
  messageText: { fontSize: 16, color: Colors.text },
  messageTextRight: { color: Colors.white },
  messageDateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  messageDate: { fontSize: 10, marginRight: 8 },
  messageTime: { fontSize: 10, textAlign: 'right' },
  dateTimeMine: { color: Colors.gray100 },
  dateTimeFriend: { color: Colors.gray400 },
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
  errorText: { fontSize: 18, color: 'red' },
});

export default ChatConversation;
