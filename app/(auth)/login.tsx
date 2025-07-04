import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Colors from '../constants/Colors';
import apiConfig from '@/config/apiConfig';
import Checkbox from 'expo-checkbox';
import TermsModal from '../components/TermsModal';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const openModal = () => setModalVisible(true);
  const closeModal = () => setModalVisible(false);

  const handleLogin = async () => {
    if (!acceptedTerms) {
      Alert.alert(
        'Attention',
        "Vous devez accepter les conditions d'utilisation pour continuer."
      );
      return;
    }
    try {
      const response = await fetch(`${apiConfig.baseURL}/api/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la connexion');
      }

      const data = await response.json();
      await AsyncStorage.setItem('token', data.token);
      await AsyncStorage.setItem('user', JSON.stringify(data.user));
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert(
        'Erreur',
        (error as Error).message || 'Échec de la connexion. Veuillez réessayer.'
      );
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        testID="back-button"
        onPress={() => router.back()}
      >
        <Ionicons name="chevron-back" size={28} color={Colors.primary} />
      </TouchableOpacity>

      <View style={styles.headerTextContainer}>
        <Text style={styles.title}>Bienvenue !</Text>
        <Text style={styles.subtitle}>Connexion à votre compte</Text>
      </View>

      <View style={styles.form}>
        {/* Email & Password inputs    */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Entrer votre email"
            placeholderTextColor={Colors.gray600}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Mot de passe</Text>
          <View style={styles.inputWithIconContainer}>
            <TextInput
              style={[styles.input, styles.inputWithIcon]}
              value={password}
              onChangeText={setPassword}
              placeholder="Entrer votre mot de passe"
              placeholderTextColor={Colors.gray600}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity
              style={styles.iconContainer}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons
                name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                size={24}
                color={Colors.gray600}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Checkbox + link to open modal */}
        <View style={styles.checkboxContainer}>
          <Checkbox
            value={acceptedTerms}
            onValueChange={setAcceptedTerms}
            color={acceptedTerms ? Colors.primary : undefined}
          />
          <View style={styles.labelContainer}>
            <Text style={styles.checkboxText}>J'accepte les </Text>
            <TouchableOpacity onPress={openModal}>
              <Text style={styles.linkText}>conditions d'utilisation</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
          <Text style={styles.loginButtonText}>Connexion</Text>
        </TouchableOpacity>

        <View style={styles.signupContainer}>
          <Text style={styles.signupText}>Pas de compte ? </Text>
          <TouchableOpacity onPress={() => router.push('/signup')}>
            <Text style={styles.signupLink}>S'inscrire</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Terms modal component */}
      <TermsModal visible={modalVisible} onClose={closeModal} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: 20 },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 10,
    padding: 10,
  },
  headerTextContainer: {
    marginTop: 120,
    marginBottom: 30,
    alignItems: 'flex-start',
  },
  title: { fontSize: 32, fontWeight: 'bold', color: Colors.text },
  subtitle: { fontSize: 18, color: Colors.gray600, marginTop: 4 },
  form: { flex: 1 },
  inputContainer: { marginBottom: 20 },
  label: { fontSize: 16, color: Colors.text, marginBottom: 8 },
  input: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.gray200,
  },
  inputWithIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.gray200,
    backgroundColor: Colors.white,
  },
  inputWithIcon: {
    flex: 1,
    borderWidth: 0,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  iconContainer: { paddingHorizontal: 12 },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  labelContainer: { flexDirection: 'row', flexWrap: 'wrap', marginLeft: 8 },
  checkboxText: { fontSize: 14, color: Colors.text },
  linkText: {
    fontSize: 14,
    textDecorationLine: 'underline',
    color: Colors.primary,
  },
  loginButton: {
    backgroundColor: Colors.primary,
    borderRadius: 28,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  loginButtonText: { color: Colors.white, fontSize: 18, fontWeight: '600' },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  signupText: { color: Colors.gray600, fontSize: 16 },
  signupLink: { color: Colors.primary, fontSize: 16, fontWeight: '600' },
});
