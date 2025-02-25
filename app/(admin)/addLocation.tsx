import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import axios from 'axios';
import { supabase } from '@/lib/supabaseClient';
import Colors from '../constants/Colors';
import { useRouter } from 'expo-router';
import apiConfig from '@/config/apiConfig';

const eventTypeOptions = [
  { label: 'Théâtre', value: 'theatre' },
  { label: 'Concert', value: 'concert' },
  { label: 'Chorale', value: 'chorale' },
  { label: 'Exposition', value: 'exposition' },
  { label: 'Musée', value: 'museum' },
];

export default function CreateLocationScreen() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: '',
    latitude: '',
    longitude: '',
    address: '',
    city: '',
    zipcode: '',
    eventTypes: [] as string[],
    localImageUri: '',
    imageUrl: '',
    description: '',
    tel: '',
    email: '',
  });

  const [uploading, setUploading] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const toggleEventType = (value: string) => {
    const { eventTypes } = formData;
    if (eventTypes.includes(value)) {
      setFormData({
        ...formData,
        eventTypes: eventTypes.filter((t) => t !== value),
      });
    } else {
      setFormData({ ...formData, eventTypes: [...eventTypes, value] });
    }
  };

  // Sélection via picker : stocke l'URI locale (upload différé)
  const pickImage = async () => {
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
      console.log("URI de l'image sélectionnée :", image.uri);

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

      setFormData({ ...formData, localImageUri: image.uri, imageUrl: '' });
    }
  };

  const handleDeleteImage = () => {
    setFormData({ ...formData, localImageUri: '', imageUrl: '' });
  };

  // Upload de l'image locale vers Supabase et renvoi de l'URL publique
  const uploadLocalImage = async (): Promise<string> => {
    if (!formData.localImageUri) return '';
    try {
      const arrayBuffer = await fetch(formData.localImageUri).then((res) =>
        res.arrayBuffer()
      );
      const fileExt =
        formData.localImageUri.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `locations/location_${Date.now()}.${fileExt}`;
      console.log('Nom de fichier généré :', fileName);

      const { data, error } = await supabase.storage
        .from('Afilia-UserPicture')
        .upload(fileName, arrayBuffer, {
          contentType: formData.localImageUri.includes('.png')
            ? 'image/png'
            : 'image/jpeg',
        });

      console.log('Upload response :', { data, error });
      if (error) {
        console.error('Erreur lors de l’upload sur Supabase', error.message);
        throw error;
      }

      const { data: publicData } = supabase.storage
        .from('Afilia-UserPicture')
        .getPublicUrl(fileName);
      const publicUrl = publicData.publicUrl;
      if (!publicUrl) {
        throw new Error("L'URL de l'image n'a pas pu être récupérée");
      }
      console.log('URL publique :', publicUrl);
      return publicUrl;
    } catch (err) {
      Alert.alert('Erreur', "Impossible d'uploader l'image");
      throw err;
    }
  };

  const handleAddLocation = async () => {
    try {
      setUploading(true);
      let uploadedImageUrl = formData.imageUrl;
      // Upload uniquement si une image a été sélectionnée via le picker
      if (formData.localImageUri && !uploadedImageUrl) {
        uploadedImageUrl = await uploadLocalImage();
      }

      const locationData = {
        name: formData.name,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        address: formData.address,
        city: formData.city,
        zipcode: formData.zipcode,
        event_types: formData.eventTypes,
        image_url: uploadedImageUrl,
        description: formData.description,
        tel: formData.tel,
        email: formData.email,
      };

      // Logs pour débogage
      const apiUrl = `${apiConfig.baseURL}/api/locations`;
      console.log('API URL:', apiUrl);
      console.log('Données envoyées:', locationData);

      const response = await axios.post(apiUrl, locationData);
      console.log('Réponse de l’API:', response.data);
      Alert.alert('Succès', 'Le lieu a été créé avec succès');
      router.back();
    } catch (error: any) {
      console.error('Erreur lors de la création du lieu :', error);
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Données de l’erreur:', error.response.data);
      }
      Alert.alert(
        'Erreur',
        'Une erreur est survenue lors de la création du lieu'
      );
    } finally {
      setUploading(false);
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
        <Text style={styles.title}>Créer un lieu</Text>
        <Text style={styles.subtitle}>Ajoutez un lieu pour vos événements</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Nom</Text>
          <TextInput
            style={styles.input}
            placeholder="Nom du lieu"
            placeholderTextColor={Colors.gray600}
            value={formData.name}
            onChangeText={(text) => handleInputChange('name', text)}
          />
        </View>

        {/* Latitude */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Latitude</Text>
          <TextInput
            style={styles.input}
            placeholder="Latitude"
            placeholderTextColor={Colors.gray600}
            keyboardType="numeric"
            value={formData.latitude}
            onChangeText={(text) => handleInputChange('latitude', text)}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Longitude</Text>
          <TextInput
            style={styles.input}
            placeholder="Longitude"
            placeholderTextColor={Colors.gray600}
            keyboardType="numeric"
            value={formData.longitude}
            onChangeText={(text) => handleInputChange('longitude', text)}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Adresse</Text>
          <TextInput
            style={styles.input}
            placeholder="Adresse"
            placeholderTextColor={Colors.gray600}
            value={formData.address}
            onChangeText={(text) => handleInputChange('address', text)}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Ville</Text>
          <TextInput
            style={styles.input}
            placeholder="Ville"
            placeholderTextColor={Colors.gray600}
            value={formData.city}
            onChangeText={(text) => handleInputChange('city', text)}
          />
        </View>

        {/* Code postal */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Code postal</Text>
          <TextInput
            style={styles.input}
            placeholder="Code postal"
            placeholderTextColor={Colors.gray600}
            keyboardType="numeric"
            value={formData.zipcode}
            onChangeText={(text) => handleInputChange('zipcode', text)}
          />
        </View>

        {/* Sélection multiple des types d'événement */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Types d'événement</Text>
          <View style={styles.chipsContainer}>
            {eventTypeOptions.map((option) => {
              const selected = formData.eventTypes.includes(option.value);
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.chip, selected && styles.chipSelected]}
                  onPress={() => toggleEventType(option.value)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      selected && styles.chipTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Image</Text>
          <View style={styles.imageContainer}>
            {formData.localImageUri || formData.imageUrl ? (
              <>
                <Image
                  source={{
                    uri: formData.localImageUri || formData.imageUrl,
                  }}
                  style={styles.image}
                />
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={handleDeleteImage}
                >
                  <Ionicons
                    name="close-circle"
                    size={24}
                    color={Colors.error}
                  />
                </TouchableOpacity>
              </>
            ) : (
              <Text style={styles.placeholderText}>
                Aucune image sélectionnée
              </Text>
            )}
          </View>
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={pickImage}
            disabled={uploading}
          >
            <Text style={styles.uploadButtonText}>
              {uploading ? 'Upload en cours...' : 'Choisir une image'}
            </Text>
          </TouchableOpacity>
          <Text style={styles.orText}>OU</Text>
          <TextInput
            style={styles.input}
            placeholder="URL de l'image"
            placeholderTextColor={Colors.gray600}
            value={formData.imageUrl}
            onChangeText={(text) => handleInputChange('imageUrl', text)}
            onBlur={() => {
              // Si une URL est saisie, on réinitialise la sélection locale
              if (formData.imageUrl) {
                setFormData({ ...formData, localImageUri: '' });
              }
            }}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.multilineInput]}
            placeholder="Description du lieu"
            placeholderTextColor={Colors.gray600}
            value={formData.description}
            onChangeText={(text) => handleInputChange('description', text)}
            multiline
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Téléphone</Text>
          <TextInput
            style={styles.input}
            placeholder="Téléphone"
            placeholderTextColor={Colors.gray600}
            keyboardType="phone-pad"
            value={formData.tel}
            onChangeText={(text) => handleInputChange('tel', text)}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={Colors.gray600}
            keyboardType="email-address"
            value={formData.email}
            onChangeText={(text) => handleInputChange('email', text)}
          />
        </View>

        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleAddLocation}
        >
          <Text style={styles.submitButtonText}>Créer le lieu</Text>
        </TouchableOpacity>
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
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.gray200,
    backgroundColor: Colors.white,
    marginRight: 8,
    marginBottom: 8,
  },
  chipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: 16,
    color: Colors.text,
  },
  chipTextSelected: {
    color: Colors.white,
  },
  imageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
    width: '100%',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.gray200,
    backgroundColor: Colors.white,
    marginBottom: 12,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  deleteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: Colors.white,
    borderRadius: 12,
  },
  placeholderText: {
    color: Colors.gray600,
    fontSize: 16,
  },
  uploadButton: {
    backgroundColor: Colors.primary,
    borderRadius: 28,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  uploadButtonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '600',
  },
  orText: {
    textAlign: 'center',
    marginVertical: 8,
    color: Colors.gray600,
  },
  multilineInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: Colors.primary,
    borderRadius: 28,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 40,
  },
  submitButtonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '600',
  },
});
