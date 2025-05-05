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
      const currentUser = userString ? JSON.parse(userString) : null;
      const userId = currentUser?.id || currentUser?._id;
      if (!userId) return;

      // connexion unique
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
