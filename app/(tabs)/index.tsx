import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import Colors from '../constants/Colors';
import { useRouter } from 'expo-router';
import type { Event, Location } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MOCK_LOCATIONS: Location[] = [
  {
    id: '1',
    name: 'Salle des Concerts',
    latitude: 50.64669971162,
    longitude: 3.051274251686708,
    created_at: new Date().toISOString(),
    address: "98 Façade de l'Esplanade",
    city: 'Lille',
    zipcode: '59000',
    event_types: ['concert'],
    image_url: '',
    description: 'Une salle dédiée aux concerts rock et pop.',
    tel: '01 23 45 67 89',
    email: 'contact@salledesconcerts.fr',
  },
  {
    id: '2',
    name: 'Théâtre de la Ville',
    latitude: 50.63794445148652,
    longitude: 3.0969858745452283,
    created_at: new Date().toISOString(),
    address: '64 Rue Louis Braille',
    city: 'Lille',
    zipcode: '59000',
    event_types: ['théâtre'],
    image_url: '',
    description: 'Un théâtre historique proposant des pièces classiques.',
    tel: '01 98 76 54 32',
    email: 'contact@theatre-ville.fr',
  },
  {
    id: '3',
    name: "Musée d'Art",
    latitude: 50.64,
    longitude: 3.05,
    created_at: new Date().toISOString(),
    address: '12 Rue du Louvre',
    city: 'Lille',
    zipcode: '59000',
    event_types: ['museum'],
    image_url: '',
    description: 'Musée consacré aux arts modernes et contemporains.',
    tel: '09 87 65 43 21',
    email: 'info@museedart.fr',
  },
  {
    id: '4',
    name: 'Centre Chorale',
    latitude: 50.635,
    longitude: 3.055,
    created_at: new Date().toISOString(),
    address: '5 Avenue de la Musique',
    city: 'Lille',
    zipcode: '59000',
    event_types: ['chorale'],
    image_url: '',
    description: 'Lieu de répétition et d’auditions pour chorales.',
    tel: '01 11 22 33 44',
    email: 'chorale@centre.fr',
  },
  {
    id: '5',
    name: "Galerie d'Exposition",
    latitude: 50.642,
    longitude: 3.045,
    created_at: new Date().toISOString(),
    address: '20 Rue des Arts',
    city: 'Lille',
    zipcode: '59000',
    event_types: ['exposition'],
    image_url: '',
    description:
      'Galerie privée exposant des artistes locaux et internationaux.',
    tel: '06 12 34 56 78',
    email: 'galerie@exposition.fr',
  },
];

const MOCK_EVENTS: Event[] = [
  {
    id: '1',
    name: 'Concert Rock',
    event_type: 'concert',
    current_participants: 50,
    max_participants: 100,
    remaining_participants: 50,
    location_id: '1',
    created_at: new Date().toISOString(),
    status: 'open',
    price: 20,
    is_free: false,
    organizer: 'John Doe Productions',
    tel: '01 23 45 67 89',
    email: 'contact@johndoeprod.fr',
    description: 'Un grand concert de rock avec plusieurs groupes locaux.',
    start_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Ex: dans 7 jours
    end_date: new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000
    ).toISOString(),
    start_time: '19:00',
    end_time: '23:00',
  },

  {
    id: '2',
    name: 'Théâtre Classique',
    event_type: 'theatre',
    current_participants: 30,
    max_participants: 50,
    remaining_participants: 20,
    location_id: '2',
    created_at: new Date().toISOString(),
    status: 'open',
    price: 15,
    is_free: false,
    organizer: 'Compagnie Molière',
    tel: '01 98 76 54 32',
    email: 'theatre@classique.fr',
    description: 'Représentation théâtrale inspirée d’œuvres classiques.',
    start_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    end_date: new Date(
      Date.now() + 10 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000
    ).toISOString(),
    start_time: '20:00',
    end_time: '23:00',
  },
  {
    id: '3',
    name: "Exposition d'Art Moderne",
    event_type: 'exposition',
    current_participants: 80,
    max_participants: 120,
    remaining_participants: 40,
    location_id: '5',
    created_at: new Date().toISOString(),
    status: 'open',
    price: 0,
    is_free: true,
    organizer: 'Galerie Contemporaine',
    tel: '09 87 65 43 21',
    email: 'info@artmoderne.com',
    description: "Découvrez les œuvres d'artistes émergents et reconnus.",
    start_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    end_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
    start_time: '10:00',
    end_time: '18:00',
  },
  {
    id: '4',
    name: 'Visite au Musée',
    event_type: 'museum',
    current_participants: 20,
    max_participants: 40,
    remaining_participants: 20,
    location_id: '3',
    created_at: new Date().toISOString(),
    status: 'open',
    price: 10,
    is_free: false,
    organizer: 'Musée National',
    tel: '01 11 22 33 44',
    email: 'contact@museenational.fr',
    description: 'Visite guidée des collections permanentes et temporaires.',
    start_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    end_date: new Date(
      Date.now() + 3 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000
    ).toISOString(),
    start_time: '14:00',
    end_time: '18:00',
  },
  {
    id: '5',
    name: "Chorale d'été",
    event_type: 'chorale',
    current_participants: 15,
    max_participants: 30,
    remaining_participants: 15,
    location_id: '4',
    created_at: new Date().toISOString(),
    status: 'open',
    price: 5,
    is_free: false,
    organizer: 'Association Chorale Libre',
    tel: '06 12 34 56 78',
    email: 'chorale@association.fr',
    description: "Une chorale accessible à tous pour célébrer l'été.",
    start_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    end_date: new Date(
      Date.now() + 14 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000
    ).toISOString(),
    start_time: '19:00',
    end_time: '21:00',
  },
];

const EVENT_TYPES = [
  'Tous',
  'Concert',
  'Théâtre',
  'Exposition',
  'Musée',
  'Chorale',
];

function getLocationById(locationId: string): Location | undefined {
  return MOCK_LOCATIONS.find((location) => location.id === locationId);
}

export default function HomeScreen() {
  const [user, setUser] = useState<any>(null);
  const [firstName, setFirstName] = useState<string | null>(null);
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('Tous');
  const [events, setEvents] = useState(MOCK_EVENTS);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userString = await AsyncStorage.getItem('user');
        if (userString) {
          const userObj = JSON.parse(userString);
          setUser(userObj);
          setFirstName(userObj.firstname);
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

  const filteredEvents = events.filter((event) => {
    const matchesSearch = event.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesType =
      selectedType === 'Tous' ||
      event.event_type.toLowerCase() === selectedType.toLowerCase();
    return matchesSearch && matchesType;
  });

  const renderEventCard = ({ item, index }: { item: Event; index: number }) => {
    const location = getLocationById(item.location_id);
    return (
      <MotiView
        from={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: index * 100 }}
        style={styles.card}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.eventName}>{item.name}</Text>
          <View style={styles.eventBadge}>
            <Text style={styles.eventType}>{item.event_type}</Text>
          </View>
        </View>

        <View style={styles.participantsContainer}>
          <Ionicons name="people" size={20} color={Colors.text} />
          <Text style={styles.participantsText}>
            {item.remaining_participants} places restantes
          </Text>
        </View>

        {location && (
          <Text style={styles.locationText}>
            {location.address}, {location.city}
          </Text>
        )}

        <TouchableOpacity
          style={styles.joinButton}
          onPress={() => router.push(`/(events)/event/${item.id}`)}
        >
          <Text style={styles.joinButtonText}>Participer</Text>
        </TouchableOpacity>
      </MotiView>
    );
  };

  if (firstName === null) {
    // Affiche un indicateur de chargement tant que le prénom n'est pas récupéré
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>Bienvenue {firstName} !</Text>
          {user && user.role === 'admin' && (
            <TouchableOpacity
              style={styles.newEventButton}
              onPress={() => router.push('/(admin)/addLocation')}
            >
              <Ionicons name="add-outline" size={18} color={Colors.white} />
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.subTitle}>Trouver un événement</Text>
        <View style={styles.searchContainer}>
          <Ionicons
            name="search"
            size={20}
            color={Colors.gray600}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher..."
            placeholderTextColor={Colors.gray600}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={EVENT_TYPES}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterButton,
                selectedType === item && styles.filterButtonActive,
              ]}
              onPress={() => setSelectedType(item)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  selectedType === item && styles.filterButtonTextActive,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.filterList}
        />
      </View>

      <FlatList
        data={filteredEvents}
        renderItem={renderEventCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.eventsList}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    padding: 20,
    paddingTop: 80,
    backgroundColor: Colors.white,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.text,
  },
  newEventButton: {
    width: 30,
    height: 30,
    borderRadius: 22,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subTitle: {
    fontSize: 20,
    color: Colors.gray800,
    marginBottom: 16,
    marginTop: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray100,
    borderRadius: 12,
    padding: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
  },
  filterContainer: {
    backgroundColor: Colors.white,
    paddingBottom: 16,
  },
  filterList: {
    paddingHorizontal: 20,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.gray100,
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: Colors.secondary,
  },
  filterButtonText: {
    fontSize: 14,
    color: Colors.gray600,
  },
  filterButtonTextActive: {
    color: Colors.text,
    fontWeight: '600',
  },
  eventsList: {
    padding: 20,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  eventName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  eventBadge: {
    backgroundColor: Colors.secondary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  eventType: {
    color: Colors.text,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  participantsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  participantsText: {
    marginLeft: 8,
    fontSize: 14,
    color: Colors.gray700,
  },
  locationText: {
    fontSize: 14,
    color: Colors.gray600,
    marginBottom: 8,
  },
  joinButton: {
    backgroundColor: Colors.accent,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  joinButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
