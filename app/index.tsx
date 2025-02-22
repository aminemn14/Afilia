import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import jwtDecode from 'jwt-decode';

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    const checkToken = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (token) {
          const decoded: { exp: number } = jwtDecode(token);
          // Vérifier la propriété exp (expiration) du token
          const currentTime = Date.now() / 1000;
          if (decoded.exp && decoded.exp > currentTime) {
            // Le token est valide, rediriger vers les onglets
            router.replace('/(tabs)');
            return;
          }
        }
        // Si aucun token, ou token expiré, rediriger vers welcome
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
