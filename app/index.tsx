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
        router.replace('/(tabs)');
      } catch (error) {
        console.error('Erreur lors de la vérification du token', error);
        router.replace('/(tabs)');
      }
    };
    checkToken();
  }, [router]);

  return null;
}
