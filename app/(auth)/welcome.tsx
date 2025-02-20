import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';
import Colors from '../constants/Colors';

export default function WelcomeScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Bienvenue sur Afilia</Text>
        <Text style={styles.subtitle}>Se connecter par le sport</Text>
      </View>

      <View style={styles.features}>
        <Image
          source={{
            uri: 'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5',
          }}
          style={styles.featureImage}
        />
        <View style={styles.featureTextContainer}>
          <Text style={styles.featureTitle}>Trouvez vos partenaires</Text>
          <Text style={styles.featureDescription}>
            Rejoignez des groupes sportifs ou créez le vôtre. Entrez en contact
            avec des joueurs à proximité et commencez à jouer !
          </Text>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <Link href="/login" asChild>
          <TouchableOpacity style={[styles.button, styles.loginButton]}>
            <Text style={styles.buttonText}>Connexion</Text>
          </TouchableOpacity>
        </Link>
        <Link href="/signup" asChild>
          <TouchableOpacity style={[styles.button, styles.signupButton]}>
            <Text style={[styles.buttonText, styles.signupButtonText]}>
              S'inscrire
            </Text>
          </TouchableOpacity>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 20,
  },
  header: {
    marginTop: 60,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: Colors.gray600,
    marginBottom: 40,
  },
  features: {
    flex: 1,
    alignItems: 'center',
  },
  featureImage: {
    width: '100%',
    height: 250,
    borderRadius: 20,
    marginBottom: 24,
  },
  featureTextContainer: {
    alignItems: 'center',
    padding: 20,
  },
  featureTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 12,
  },
  featureDescription: {
    fontSize: 16,
    color: Colors.gray700,
    textAlign: 'center',
    lineHeight: 24,
  },
  buttonContainer: {
    marginBottom: 40,
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
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.white,
  },
  signupButtonText: {
    color: Colors.primary,
  },
});
