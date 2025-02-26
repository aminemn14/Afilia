import { useEffect, useRef } from 'react';
import io, { Socket } from 'socket.io-client';
import apiConfig from '@/config/apiConfig';

export default function useSocket() {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    socketRef.current = io(apiConfig.baseURL, {
      transports: ['websocket'],
    });
    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  return socketRef;
}
