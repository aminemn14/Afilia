import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Colors from '../constants/Colors';
import apiConfig from '@/config/apiConfig';

export default function SignUpScreen() {
  // Calcul de la date maximale autorisée (au moins 12 ans)
  const maxAllowedDate = new Date();
  maxAllowedDate.setFullYear(maxAllowedDate.getFullYear() - 12);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstname: '',
    lastname: '',
    birthDate: maxAllowedDate,
    sexe: '',
    phoneNumber: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Calcule l'âge à partir d'un objet Date
  const calculateAge = (birthDate: Date) => {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR');
  };

  const handleDateChange = (event: any, selectedDate: Date | undefined) => {
    if (selectedDate) {
      setFormData({ ...formData, birthDate: selectedDate });
    }
  };

  const handleSignUp = async () => {
    try {
      const {
        username,
        email,
        password,
        confirmPassword,
        firstname,
        lastname,
        birthDate,
        sexe,
        phoneNumber,
      } = formData;

      if (
        !username ||
        !email ||
        !password ||
        !confirmPassword ||
        !firstname ||
        !lastname ||
        !birthDate ||
        !sexe ||
        !phoneNumber
      ) {
        Alert.alert('Erreur', 'Veuillez remplir tous les champs');
        return;
      }

      if (password !== confirmPassword) {
        Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
        return;
      }

      if (password.length < 8) {
        Alert.alert(
          'Erreur',
          'Le mot de passe doit comporter au moins 8 caractères'
        );
        return;
      }

      const age = calculateAge(birthDate);
      if (age < 12) {
        Alert.alert(
          'Erreur',
          'Vous devez avoir au moins 12 ans pour vous inscrire.'
        );
        return;
      }

      const isoBirthDate = birthDate.toISOString();
      const isoCreatedAt = new Date().toISOString();

      const userData = {
        username,
        email,
        password,
        firstname,
        lastname,
        birthDate: isoBirthDate,
        age,
        sexe,
        phoneNumber,
        role: 'user',
        createdAt: isoCreatedAt,
      };

      const response = await fetch(`${apiConfig.baseURL}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || 'Erreur lors de la création du compte'
        );
      }

      const data = await response.json();
      console.log('Utilisateur créé :', data);
      // Redirige vers l'écran de connexion
      router.replace('/login');
    } catch (error) {
      Alert.alert(
        'Erreur',
        (error as Error).message ||
          'La création du compte a échoué. Veuillez réessayer.'
      );
    }
  };

  return (
    <KeyboardAwareScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      extraScrollHeight={20}
      enableOnAndroid={true}
    >
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="chevron-back" size={28} color={Colors.primary} />
      </TouchableOpacity>

      <View style={styles.headerTextContainer}>
        <Text style={styles.title}>Créer un compte</Text>
        <Text style={styles.subtitle}>Rejoindre la communauté Afilia</Text>
      </View>

      <View style={styles.form}>
        {/* Nom d'utilisateur */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Nom d'utilisateur</Text>
          <TextInput
            style={styles.input}
            value={formData.username}
            onChangeText={(text) =>
              setFormData({ ...formData, username: text })
            }
            placeholder="Choisir un nom d'utilisateur"
            placeholderTextColor={Colors.gray600}
            autoCapitalize="none"
          />
        </View>

        {/* Email */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={formData.email}
            onChangeText={(text) => setFormData({ ...formData, email: text })}
            placeholder="Entrer votre email"
            placeholderTextColor={Colors.gray600}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {/* Prénom */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Prénom</Text>
          <TextInput
            style={styles.input}
            value={formData.firstname}
            onChangeText={(text) =>
              setFormData({ ...formData, firstname: text })
            }
            placeholder="Entrer votre prénom"
            placeholderTextColor={Colors.gray600}
          />
        </View>

        {/* Nom */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Nom</Text>
          <TextInput
            style={styles.input}
            value={formData.lastname}
            onChangeText={(text) =>
              setFormData({ ...formData, lastname: text })
            }
            placeholder="Entrer votre nom"
            placeholderTextColor={Colors.gray600}
          />
        </View>

        {/* Date de naissance */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Date de naissance</Text>
          <View style={styles.datePickerContainer}>
            <DateTimePicker
              value={formData.birthDate}
              mode="date"
              display="default"
              onChange={handleDateChange}
              // Empêche de choisir une date rendant l'utilisateur plus jeune que 12 ans
              maximumDate={maxAllowedDate}
              locale="fr-FR"
              themeVariant="light"
            />
          </View>
        </View>

        {/* Sexe */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Sexe</Text>
          <View style={styles.sexContainer}>
            <TouchableOpacity
              style={[
                styles.sexButton,
                formData.sexe === 'homme' && styles.sexButtonSelected,
              ]}
              onPress={() => setFormData({ ...formData, sexe: 'homme' })}
            >
              <Text style={styles.sexButtonText}>Homme</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.sexButton,
                formData.sexe === 'femme' && styles.sexButtonSelected,
              ]}
              onPress={() => setFormData({ ...formData, sexe: 'femme' })}
            >
              <Text style={styles.sexButtonText}>Femme</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Téléphone */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Téléphone</Text>
          <TextInput
            style={styles.input}
            value={formData.phoneNumber}
            onChangeText={(text) =>
              setFormData({ ...formData, phoneNumber: text })
            }
            placeholder="Entrer votre numéro de téléphone"
            placeholderTextColor={Colors.gray600}
            keyboardType="phone-pad"
          />
        </View>

        {/* Mot de passe */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Mot de passe</Text>
          <View style={styles.inputWithIconContainer}>
            <TextInput
              style={[styles.input, styles.inputWithIcon]}
              value={formData.password}
              onChangeText={(text) =>
                setFormData({ ...formData, password: text })
              }
              placeholder="Créer un mot de passe"
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
          <Text style={styles.helperText}>
            Doit comporter au moins 8 caractères
          </Text>
        </View>

        {/* Confirmer le mot de passe */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Confirmer le mot de passe</Text>
          <View style={styles.inputWithIconContainer}>
            <TextInput
              style={[styles.input, styles.inputWithIcon]}
              value={formData.confirmPassword}
              onChangeText={(text) =>
                setFormData({ ...formData, confirmPassword: text })
              }
              placeholder="Confirmer votre mot de passe"
              placeholderTextColor={Colors.gray600}
              secureTextEntry={!showConfirmPassword}
            />
            <TouchableOpacity
              style={styles.iconContainer}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              <Ionicons
                name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'}
                size={24}
                color={Colors.gray600}
              />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.signupButton} onPress={handleSignUp}>
          <Text style={styles.signupButtonText}>Créer un compte</Text>
        </TouchableOpacity>

        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>Vous avez déjà un compte ? </Text>
          <TouchableOpacity onPress={() => router.push('/login')}>
            <Text style={styles.loginLink}>Se connecter</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  contentContainer: {
    padding: 20,
  },
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
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 18,
    color: Colors.gray600,
    marginTop: 4,
  },
  form: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: Colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.gray200,
  },
  datePickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderColor: Colors.gray200,
    overflow: 'hidden',
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
  iconContainer: {
    paddingHorizontal: 12,
  },
  helperText: {
    fontSize: 12,
    color: Colors.gray600,
    marginTop: 4,
  },
  signupButton: {
    backgroundColor: Colors.primary,
    borderRadius: 28,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 24,
  },
  signupButtonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '600',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  loginText: {
    color: Colors.gray600,
    fontSize: 16,
  },
  loginLink: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  sexContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  sexButton: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.gray200,
    backgroundColor: Colors.white,
    minWidth: 100,
    alignItems: 'center',
  },
  sexButtonSelected: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.secondary,
  },
  sexButtonText: {
    color: Colors.text,
  },
});
