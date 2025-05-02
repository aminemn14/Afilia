import React from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import Colors from '../constants/Colors';
import LottieView from 'lottie-react-native';
import welcomeAnimation from '@/assets/media/welcome-afilia-animation.json';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Bienvenue sur Afilia</Text>
          <Text style={styles.subtitle}>
            Découvrez et réservez vos événements autour de vous
          </Text>
        </View>

        <View style={styles.features}>
          <LottieView
            source={welcomeAnimation}
            autoPlay
            loop
            style={styles.animation}
          />
          <View style={styles.featureTextContainer}>
            <Text style={styles.featureTitle}>Des événements vibrants</Text>
            <Text style={styles.featureDescription}>
              Explorez les activités près de chez vous et réservez en quelques
              clics !
            </Text>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.loginButton]}
            onPress={() => router.push('/login')}
          >
            <Text style={styles.buttonText}>Connexion</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.signupButton]}
            onPress={() => router.push('/signup')}
          >
            <Text style={[styles.buttonText, styles.signupButtonText]}>
              S'inscrire
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/(tabs)')}>
            <Text style={styles.withoutText}>Continuer sans s'identifier</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginTop: Platform.OS === 'android' ? 30 : 60,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: Colors.gray600,
    marginBottom: 20,
    textAlign: 'center',
  },
  features: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  animation: {
    width: 320,
    height: 320,
  },
  featureTextContainer: {
    marginTop: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  featureTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  featureDescription: {
    fontSize: 16,
    color: Colors.gray700,
    textAlign: 'center',
    lineHeight: 24,
  },
  buttonContainer: {
    marginTop: 60,
    marginBottom: 20,
  },
  button: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  loginButton: {
    backgroundColor: Colors.primary,
  },
  signupButton: {
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  withoutLoginButton: {
    color: Colors.primary,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.white,
  },
  withoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
    textAlign: 'center',
    marginTop: 5,
  },
  signupButtonText: {
    color: Colors.primary,
  },
});
