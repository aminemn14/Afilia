import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import Colors from '../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import apiConfig from '@/config/apiConfig';

export default function ProfileSettingsScreen() {
  const [user, setUser] = useState<any>(null);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [firstname, setFirstname] = useState('');
  const [lastname, setLastname] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  // Nouvelle variable pour stocker l'URI locale sélectionnée (sans upload immédiat)
  const [localAvatarUri, setLocalAvatarUri] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userString = await AsyncStorage.getItem('user');
        if (userString) {
          const userObj = JSON.parse(userString);
          setUser(userObj);
          setUsername(userObj.username);
          setEmail(userObj.email);
          setFirstname(userObj.firstname);
          setLastname(userObj.lastname);
          setPhoneNumber(userObj.phoneNumber);
          setBio(userObj.bio || '');
          setAvatar(userObj.avatar || null);
        }
      } catch (error) {
        console.error(
          'Erreur lors de la récupération des infos utilisateur',
          error
        );
      }
    };
    fetchUserData();
  }, []);

  const pickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission requise', "L'accès à la galerie est nécessaire");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1],
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const image = result.assets[0];
      if (!image.uri) {
        Alert.alert('Erreur', "Aucune URI n'a été retournée");
        return;
      }
      console.log("URI locale de l'image sélectionnée :", image.uri);

      // Vérifier la taille du fichier (limite à 50 Mo)
      const fileInfo = await FileSystem.getInfoAsync(image.uri);
      if (
        fileInfo.exists &&
        typeof fileInfo.size === 'number' &&
        fileInfo.size > 50 * 1024 * 1024
      ) {
        Alert.alert(
          'Fichier trop volumineux',
          "L'image doit être inférieure à 50 Mo."
        );
        return;
      }

      // Stocker l'URI localement sans uploader immédiatement
      setLocalAvatarUri(image.uri);
      // Afficher l'image sélectionnée dans l'interface
      setAvatar(image.uri);
    }
  };

  const uploadFileToBackend = async (
    fileUri: string,
    folder = 'profile-pictures'
  ) => {
    const formData = new FormData();
    formData.append('file', {
      uri: fileUri,
      name: 'file.jpg',
      type: 'image/jpeg',
    } as any);

    const response = await fetch(
      `${apiConfig.baseURL}/api/upload?folder=${folder}`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erreur lors de l'upload : ${errorText}`);
    }

    const data = await response.json();
    return data.url;
  };

  const handleSave = async () => {
    try {
      let updatedAvatar = avatar;

      if (localAvatarUri) {
        updatedAvatar = await uploadFileToBackend(localAvatarUri);
      }

      const updatedData = {
        username,
        email,
        firstname,
        lastname,
        phoneNumber,
        bio,
        avatar: updatedAvatar,
      };

      const response = await fetch(
        `${apiConfig.baseURL}/api/users/${user._id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || 'Erreur lors de la mise à jour du profil'
        );
      }

      const updatedUser = await response.json();
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      Alert.alert('Succès', 'Profil mis à jour');
      router.replace('/(tabs)/profile');
    } catch (error) {
      Alert.alert(
        'Erreur',
        (error as Error).message || 'Échec de la mise à jour'
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="chevron-back" size={28} color={Colors.primary} />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.container}>
        <TouchableOpacity style={styles.avatarWrapper} onPress={pickAvatar}>
          <Image
            source={
              avatar
                ? { uri: avatar }
                : require('@/assets/images/avatar-default.png')
            }
            style={styles.avatar}
          />
          <Text style={styles.changeAvatarText}>Changer l'avatar</Text>
        </TouchableOpacity>
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Nom d'utilisateur</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="Nom d'utilisateur"
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Email"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Prénom</Text>
            <TextInput
              style={styles.input}
              value={firstname}
              onChangeText={setFirstname}
              placeholder="Prénom"
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Nom</Text>
            <TextInput
              style={styles.input}
              value={lastname}
              onChangeText={setLastname}
              placeholder="Nom"
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Téléphone</Text>
            <TextInput
              style={styles.input}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              placeholder="Téléphone"
              keyboardType="phone-pad"
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Bio</Text>
            <TextInput
              style={[styles.input, styles.bioInput]}
              value={bio}
              onChangeText={setBio}
              placeholder="Votre bio"
              multiline
            />
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Enregistrer</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 10,
    padding: 10,
  },
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  avatarWrapper: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 140,
    height: 140,
    borderRadius: 70,
  },
  changeAvatarText: {
    marginTop: 8,
    color: Colors.primary,
    fontSize: 14,
  },
  form: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    color: Colors.gray600,
    marginBottom: 4,
  },
  input: {
    backgroundColor: Colors.gray100,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.text,
  },
  bioInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '600',
  },
});
