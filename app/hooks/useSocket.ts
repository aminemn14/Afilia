// hooks/useSocket.ts
import { useEffect, useRef } from 'react';
import io, { Socket } from 'socket.io-client';
import apiConfig from '@/config/apiConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function useSocket() {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    (async () => {
      const userString = await AsyncStorage.getItem('user');
      console.log('🎯 Stored user string:', userString);
      let currentUser = null;
      try {
        currentUser = userString ? JSON.parse(userString) : null;
      } catch (err) {
        console.warn('⚠️ JSON parse error for stored user:', err);
      }
      console.log('🎯 Parsed currentUser:', currentUser);

      const userId = currentUser?.id || currentUser?._id;
      console.log('🎯 Computed userId:', userId);
      if (!userId) return;

      socketRef.current = io(apiConfig.baseURL, {
        transports: ['websocket'],
        secure: true,
        reconnection: true,
        reconnectionAttempts: 5,
        timeout: 20000,
        auth: { userId },
      });
    })();

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  return socketRef;
}
