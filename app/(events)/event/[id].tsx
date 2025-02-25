import React from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Colors from '@/app/constants/Colors';
import { useSearchParams } from 'expo-router/build/hooks';
import { Event, Location } from '@/app/types';

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
    start_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
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

const getLocationById = (locationId: string) =>
  MOCK_LOCATIONS.find((loc) => loc.id === locationId);

const getEventById = (eventId: string) =>
  MOCK_EVENTS.find((event) => event.id === eventId);

const EventDetailScreen = () => {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const router = useRouter();
  const event = getEventById(id as string);

  if (!event) {
    return (
      <SafeAreaView style={styles.safeContainer}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Événement non trouvé</Text>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Text style={styles.backButtonText}>Retour</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const location = getLocationById(event.location_id);

  return (
    <SafeAreaView style={styles.safeContainer}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backIcon}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.title} numberOfLines={1}>
            {event.name}
          </Text>
        </View>
        {/* Contenu */}
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.tagsContainer}>
            <View style={[styles.tag, { backgroundColor: Colors.secondary }]}>
              <Text style={styles.tagText}>
                {event.event_type.charAt(0).toUpperCase() +
                  event.event_type.slice(1)}
              </Text>
            </View>
            <View style={[styles.tag, { backgroundColor: Colors.gray200 }]}>
              <Text style={styles.tagText}>
                Encore {event.remaining_participants} places
              </Text>
            </View>
            <View style={[styles.tag, { backgroundColor: Colors.accent }]}>
              <Text style={styles.tagText}>25€</Text>
            </View>
          </View>
          <View style={styles.detailSection}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.sectionContent}>{event.description}</Text>
          </View>
          <View style={styles.detailSection}>
            <Text style={styles.sectionTitle}>Adresse</Text>
            <Text style={styles.sectionContent}>
              {location
                ? `${location.address}, ${location.city}, ${location.zipcode}`
                : 'Adresse non disponible'}
            </Text>
          </View>
        </ScrollView>
        <TouchableOpacity style={styles.addButton} onPress={() => {}}>
          <Text style={styles.addButtonText}>Ajouter au Panier</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 10,
    paddingHorizontal: 20,
    backgroundColor: Colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.gray200,
  },
  backIcon: {
    paddingRight: 10,
  },
  title: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 80, // pour laisser de la place au bouton fixe
  },
  tagsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  tag: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  tagText: {
    fontSize: 14,
    color: Colors.white,
    fontWeight: '600',
  },
  detailSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 6,
  },
  sectionContent: {
    fontSize: 16,
    color: Colors.gray700,
    lineHeight: 22,
  },
  addButton: {
    backgroundColor: Colors.accent,
    paddingVertical: 15,
    marginHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
  },
  addButtonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  backButtonText: {
    fontSize: 16,
    color: Colors.white,
  },
});

export default EventDetailScreen;
