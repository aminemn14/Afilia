import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import {
  BuildingLibraryIcon,
  CameraIcon,
  MapPinIcon,
  MusicalNoteIcon,
  MicrophoneIcon,
  TicketIcon,
} from 'react-native-heroicons/outline';
import { router } from 'expo-router';

import Colors from '../constants/Colors';
import type { Location, Event } from '@/app/types';

function getIconForEventType(
  eventTypes: string[],
  size: number,
  color: string
): JSX.Element {
  // Si le tableau est vide ou si le lieu a plusieurs types, on affiche l'icône par défaut (MapPinIcon)
  if (!eventTypes || eventTypes.length !== 1) {
    return <MapPinIcon size={size} color={color} strokeWidth={1.8} />;
  }

  // S'il n'y a qu'un seul type, on choisit l'icône en fonction de ce type
  const type = eventTypes[0].toLowerCase();
  switch (type) {
    case 'chorale':
      return <MusicalNoteIcon size={size} color={color} strokeWidth={1.8} />;
    case 'museum':
      return (
        <BuildingLibraryIcon size={size} color={color} strokeWidth={1.8} />
      );
    case 'theatre':
      return <TicketIcon size={size} color={color} strokeWidth={1.8} />;
    case 'concert':
      return <MicrophoneIcon size={size} color={color} strokeWidth={1.8} />;
    case 'exposition':
      return <CameraIcon size={size} color={color} strokeWidth={1.8} />;
    default:
      return <MapPinIcon size={size} color={color} strokeWidth={1.8} />;
  }
}

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

export default function MapScreen() {
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    null
  );
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  const getEventsAtLocation = (locationId: string) => {
    return MOCK_EVENTS.filter((event) => event.location_id === locationId);
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: 50.63123052834233,
          longitude: 3.0524002455006882,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
      >
        {MOCK_LOCATIONS.map((location) => (
          <Marker
            key={location.id}
            coordinate={{
              latitude: location.latitude,
              longitude: location.longitude,
            }}
            onPress={() => setSelectedLocation(location)}
          >
            <View style={styles.markerContainer}>
              {getIconForEventType(location.event_types, 24, Colors.primary)}
            </View>
            <Callout>
              <View style={styles.callout}>
                <Text style={styles.calloutTitle}>{location.name}</Text>
                <Text style={styles.calloutAddress}>
                  {location.address}
                  {'\n'}
                  {location.city} - {location.zipcode}
                </Text>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

      {selectedLocation && (
        <MotiView
          style={styles.locationDetails}
          from={{ translateY: 300 }}
          animate={{ translateY: 0 }}
          exit={{ translateY: 300 }}
        >
          <View style={styles.locationHeader}>
            <Text style={styles.locationName}>{selectedLocation.name}</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setSelectedLocation(null)}
            >
              <Ionicons name="close" size={24} color={Colors.gray600} />
            </TouchableOpacity>
          </View>

          <Text style={styles.locationAddress}>{selectedLocation.address}</Text>
          <Text style={styles.locationCity}>
            {selectedLocation.city} - {selectedLocation.zipcode}
          </Text>

          <View style={styles.eventsContainer}>
            {getEventsAtLocation(selectedLocation.id).length === 0 ? (
              <Text style={styles.noEventText}>Aucun événement Actif</Text>
            ) : (
              <>
                <Text style={styles.eventsTitle}>Événements Actifs</Text>
                {getEventsAtLocation(selectedLocation.id).map((event) => (
                  <View key={event.id} style={styles.eventCard}>
                    <View style={styles.eventInfo}>
                      <Text style={styles.eventName}>{event.name}</Text>
                      <View style={styles.participantsContainer}>
                        <Ionicons
                          name="people"
                          size={16}
                          color={Colors.primary}
                        />
                        <Text style={styles.participantsText}>
                          {event.remaining_participants} places restantes
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={styles.joinButton}
                      onPress={() => router.push(`/(events)/event/${event.id}`)}
                    >
                      <Text style={styles.joinButtonText}>Participer</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </>
            )}
          </View>
        </MotiView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  markerContainer: {
    backgroundColor: Colors.white,
    borderRadius: 150,
    padding: 8,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  callout: {
    padding: 8,
    minWidth: 180,
  },
  calloutTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  calloutAddress: {
    fontSize: 12,
    color: Colors.gray600,
  },
  locationDetails: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
  },
  closeButton: {
    padding: 4,
  },
  locationAddress: {
    fontSize: 16,
    color: Colors.gray600,
    marginBottom: 4,
  },
  locationCity: {
    fontSize: 16,
    color: Colors.gray600,
    marginBottom: 20,
  },
  eventsContainer: {
    gap: 12,
  },
  eventsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  noEventText: {
    fontSize: 16,
    color: Colors.gray700,
    textAlign: 'center',
    marginVertical: 8,
  },
  eventCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.gray100,
    borderRadius: 12,
    padding: 12,
  },
  eventInfo: {
    flex: 1,
  },
  eventName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 4,
  },
  participantsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  participantsText: {
    fontSize: 14,
    color: Colors.gray700,
  },
  joinButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  joinButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
});
