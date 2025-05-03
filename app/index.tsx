import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import jwtDecode from 'jwt-decode';

type JwtPayload = {
  exp: number;
};

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    const checkToken = async () => {
      try {
        const token = await AsyncStorage.getItem('token');

        if (token) {
          // On décode le token pour vérifier l'expiration
          const { exp } = jwtDecode<JwtPayload>(token);
          const now = Date.now() / 1000; // en secondes

          if (exp && exp > now) {
            // Token valide
            router.replace('/(tabs)');
            return;
          }
        }
        // Pas de token ou token expiré
        router.replace('/(auth)/welcome');
      } catch (error) {
        console.error('Erreur lors de la vérification du token', error);
        router.replace('/(auth)/welcome');
      }
    };

    checkToken();
  }, [router]);

  return null;
}
