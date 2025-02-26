import React, { useState, useEffect } from 'react';
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
import axios from 'axios';
import Colors from '../constants/Colors';
import { useRouter } from 'expo-router';
import apiConfig from '@/config/apiConfig';
import RNPickerSelect from 'react-native-picker-select';

const eventTypeOptions = [
  { label: 'Théâtre', value: 'theatre' },
  { label: 'Concert', value: 'concert' },
  { label: 'Chorale', value: 'chorale' },
  { label: 'Exposition', value: 'exposition' },
  { label: 'Musée', value: 'museum' },
];

export default function CreateEventScreen() {
  const router = useRouter();
  const [locations, setLocations] = useState<any[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    event_type: '',
    max_participants: '',
    location_id: '',
    price: '',
    is_free: true,
    organizer: '',
    tel: '',
    email: '',
    description: '',
  });

  // États pour les dates et heures (en tant que Date)
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());

  // Fonction de formatage des heures
  const formatTime = (date: Date) => date.toTimeString().slice(0, 5);

  // Fonction pour obtenir une date ISO en heure locale
  const toLocalISOString = (date: Date) => {
    const tzoffset = date.getTimezoneOffset() * 60000; // décalage en ms
    return new Date(date.getTime() - tzoffset).toISOString().slice(0, 19);
  };

  // Récupération des lieux enregistrés
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        setLoadingLocations(true);
        const response = await axios.get(`${apiConfig.baseURL}/api/locations`);
        console.log('Locations fetched:', response.data);
        setLocations(response.data as any[]);
      } catch (err) {
        console.error('Erreur lors de la récupération des lieux :', err);
        Alert.alert('Erreur', 'Impossible de récupérer les lieux.');
      } finally {
        setLoadingLocations(false);
      }
    };
    fetchLocations();
  }, []);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData({ ...formData, [field]: value });
  };

  const selectEventType = (value: string) => {
    setFormData({ ...formData, event_type: value });
  };

  const handleAddEvent = async () => {
    if (
      !formData.name ||
      !formData.event_type ||
      !formData.max_participants ||
      !formData.location_id ||
      (!formData.is_free && !formData.price) ||
      !formData.organizer ||
      !formData.tel ||
      !formData.email ||
      !formData.description
    ) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires.');
      return;
    }

    try {
      const eventData = {
        name: formData.name,
        event_type: formData.event_type,
        max_participants: parseInt(formData.max_participants, 10),
        location_id: formData.location_id,
        price: formData.is_free ? 0 : parseFloat(formData.price),
        is_free: formData.is_free,
        organizer: formData.organizer,
        tel: formData.tel,
        email: formData.email,
        description: formData.description,
        start_date: toLocalISOString(startDate),
        end_date: toLocalISOString(endDate),
        start_time: formatTime(startTime),
        end_time: formatTime(endTime),
      };

      const apiUrl = `${apiConfig.baseURL}/api/events`;
      console.log('API URL:', apiUrl);
      console.log('Données envoyées:', eventData);

      const response = await axios.post(apiUrl, eventData);
      console.log("Réponse de l'API:", response.data);
      Alert.alert('Succès', "L'événement a été créé avec succès");
      router.push('/(tabs)');
    } catch (error: any) {
      console.error("Erreur lors de la création de l'événement :", error);
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error("Données de l'erreur:", error.response.data);
      }
      Alert.alert(
        'Erreur',
        "Une erreur est survenue lors de la création de l'événement"
      );
    }
  };

  const filteredLocations = locations.filter(
    (loc) => loc.event_types && loc.event_types.includes(formData.event_type)
  );

  const pickerRef = React.useRef<RNPickerSelect | null>(null);

  return (
    <KeyboardAwareScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      extraScrollHeight={20}
      enableOnAndroid={true}
    >
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.push('/(tabs)')}
      >
        <Ionicons name="chevron-back" size={28} color={Colors.primary} />
      </TouchableOpacity>

      <View style={styles.headerTextContainer}>
        <Text style={styles.title}>Créer un événement</Text>
        <Text style={styles.subtitle}>
          Remplissez les informations de l'événement
        </Text>
      </View>

      <View style={styles.form}>
        {/* Nom */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Nom</Text>
          <TextInput
            style={styles.input}
            placeholder="Nom de l'événement"
            placeholderTextColor={Colors.gray600}
            value={formData.name}
            onChangeText={(text) => handleInputChange('name', text)}
          />
        </View>

        {/* Type d'événement (chips) */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Type d'événement</Text>
          <View style={styles.chipsContainer}>
            {eventTypeOptions.map((option) => {
              const selected = formData.event_type === option.value;
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.chip, selected && styles.chipSelected]}
                  onPress={() => selectEventType(option.value)}
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

        {/* Nombre maximum de participants */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Nombre maximum de participants</Text>
          <TextInput
            style={styles.input}
            placeholder="Exemple : 100"
            placeholderTextColor={Colors.gray600}
            keyboardType="numeric"
            value={formData.max_participants}
            onChangeText={(text) => handleInputChange('max_participants', text)}
          />
        </View>

        {/* Choix du lieu */}
        {formData.event_type && (
          <View style={styles.locationContainer}>
            <Text style={styles.label}>Lieu</Text>
            {loadingLocations ? (
              <Text>Chargement des lieux...</Text>
            ) : locations.length === 0 ? (
              <View>
                <Text style={styles.noLocationForType}>
                  Aucun lieu enregistré.{' '}
                </Text>
                <TouchableOpacity
                  style={styles.redirectButton}
                  onPress={() => router.push('/addLocation')}
                >
                  <Text style={styles.redirectButtonText}>Ajouter un lieu</Text>
                </TouchableOpacity>
              </View>
            ) : filteredLocations.length === 0 ? (
              <View>
                <Text style={styles.noLocationForType}>
                  Aucun lieu disponible pour ce type.{' '}
                </Text>
                <TouchableOpacity
                  style={styles.redirectButton}
                  onPress={() => router.push('/addLocation')}
                >
                  <Text style={styles.redirectButtonText}>Ajouter un lieu</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <RNPickerSelect
                onValueChange={(value) =>
                  handleInputChange('location_id', value)
                }
                items={filteredLocations.map((loc) => ({
                  label: loc.name,
                  value: loc._id || loc.id,
                }))}
                placeholder={{ label: 'Sélectionner un lieu', value: '' }}
                style={pickerSelectStyles}
                darkTheme={true}
                ref={pickerRef}
                useNativeAndroidPickerStyle={false}
                Icon={() => (
                  <Ionicons
                    name="chevron-down"
                    size={24}
                    color={Colors.gray600}
                  />
                )}
              />
            )}
          </View>
        )}

        {/* Gratuité et Prix */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>L'événement est gratuit ?</Text>
          <View style={styles.switchContainer}>
            <TouchableOpacity
              style={[
                styles.switchButton,
                formData.is_free && styles.switchButtonActive,
              ]}
              onPress={() => handleInputChange('is_free', true)}
            >
              <Text
                style={[
                  styles.switchButtonText,
                  formData.is_free && styles.switchButtonTextActive,
                ]}
              >
                Oui
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.switchButton,
                !formData.is_free && styles.switchButtonActive,
              ]}
              onPress={() => handleInputChange('is_free', false)}
            >
              <Text
                style={[
                  styles.switchButtonText,
                  !formData.is_free && styles.switchButtonTextActive,
                ]}
              >
                Non
              </Text>
            </TouchableOpacity>
          </View>
          {!formData.is_free && (
            <View style={styles.priceInputContainer}>
              <Text style={styles.label}>Prix de l'événement</Text>
              <TextInput
                style={styles.input}
                placeholder="Entrez le prix"
                placeholderTextColor={Colors.gray600}
                keyboardType="numeric"
                value={formData.price}
                onChangeText={(text) => handleInputChange('price', text)}
              />
            </View>
          )}
        </View>

        {/* Organisateur */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Organisateur</Text>
          <TextInput
            style={styles.input}
            placeholder="Nom de l'organisateur"
            placeholderTextColor={Colors.gray600}
            value={formData.organizer}
            onChangeText={(text) => handleInputChange('organizer', text)}
          />
        </View>

        {/* Téléphone */}
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

        {/* Email */}
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

        {/* Description */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.multilineInput]}
            placeholder="Description de l'événement"
            placeholderTextColor={Colors.gray600}
            value={formData.description}
            onChangeText={(text) => handleInputChange('description', text)}
            multiline
          />
        </View>

        {/* Dates et Heures */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Date de début</Text>
          <TouchableOpacity style={styles.dateButton}>
            <DateTimePicker
              value={startDate}
              mode="date"
              display="default"
              locale="fr-FR"
              themeVariant="light"
              onChange={(event, selectedDate) => {
                const currentDate = selectedDate || startDate;
                setStartDate(currentDate);
              }}
            />
          </TouchableOpacity>
        </View>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Date de fin</Text>
          <TouchableOpacity style={styles.dateButton}>
            <DateTimePicker
              value={endDate}
              mode="date"
              display="default"
              locale="fr-FR"
              themeVariant="light"
              onChange={(event, selectedDate) => {
                const currentDate = selectedDate || endDate;
                setEndDate(currentDate);
              }}
            />
          </TouchableOpacity>
        </View>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Heure de début</Text>
          <TouchableOpacity style={styles.hourButton}>
            <DateTimePicker
              value={startTime}
              mode="time"
              display="default"
              themeVariant="light"
              onChange={(event, selectedDate) => {
                const currentDate = selectedDate || startTime;
                setStartTime(currentDate);
              }}
            />
          </TouchableOpacity>
        </View>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Heure de fin</Text>
          <TouchableOpacity style={styles.hourButton}>
            <DateTimePicker
              value={endTime}
              mode="time"
              display="default"
              themeVariant="light"
              onChange={(event, selectedDate) => {
                const currentDate = selectedDate || endTime;
                setEndTime(currentDate);
              }}
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.submitButton} onPress={handleAddEvent}>
          <Text style={styles.submitButtonText}>Créer l'événement</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAwareScrollView>
  );
}

const pickerSelectStyles = {
  inputIOS: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: Colors.gray200,
    borderRadius: 12,
    color: Colors.text,
    backgroundColor: Colors.white,
    paddingRight: 30,
  },
  inputAndroid: {
    fontSize: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.gray200,
    borderRadius: 12,
    color: Colors.text,
    backgroundColor: Colors.white,
  },
  iconContainer: {
    top: 10,
    right: 12,
  },
};

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
  priceInputContainer: {
    marginTop: 20,
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
  pickerIOS: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: Colors.gray200,
    borderRadius: 12,
    color: Colors.text,
    backgroundColor: Colors.white,
    paddingRight: 30,
  },
  pickerAndroid: {
    color: Colors.text,
  },
  picker: {
    color: Colors.text,
    height: 56,
    width: '100%',
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
  locationContainer: {
    marginBottom: 20,
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
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 12,
  },
  switchButton: {
    borderWidth: 1,
    borderColor: Colors.gray200,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  switchButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  switchButtonText: {
    fontSize: 16,
    color: Colors.text,
  },
  switchButtonTextActive: {
    color: Colors.white,
  },
  dateButton: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.gray200,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  hourButton: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.gray200,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 1,
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
  redirectButton: {
    backgroundColor: Colors.secondary,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  redirectButtonText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  noLocationForType: {
    color: Colors.gray600,
    marginBottom: 8,
  },
});
