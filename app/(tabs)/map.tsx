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

// Icons from different libraries
import { Ionicons } from '@expo/vector-icons';
import { BuildingLibraryIcon } from 'react-native-heroicons/outline';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import Entypo from 'react-native-vector-icons/Entypo';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import Colors from '../constants/Colors';
import type { Location, Event } from '@/app/types';

function getIconForEventType(type: string, size: number, color: string) {
  switch (type.toLowerCase()) {
    case 'chorale':
      return <Ionicons name="musical-notes" size={size} color={color} />;
    case 'museum':
      return <BuildingLibraryIcon size={size} color={color} />;
    case 'theatre':
      return <FontAwesome5 name="theater-masks" size={size} color={color} />;
    case 'concert':
      return <Entypo name="modern-mic" size={size} color={color} />;
    case 'exposition':
      return <MaterialIcons name="local-see" size={size} color={color} />;
    default:
      return <Ionicons name="location-outline" size={size} color={color} />;
  }
}

const MOCK_LOCATIONS: Location[] = [
  {
    id: '1',
    name: 'Salle des Concerts',
    latitude: 50.64669971162,
    longitude: 3.051274251686708,
    address: "98 Façade de l'Esplanade",
    city: 'Lille',
    zipcode: '59000',
    event_type: 'concert',
  },
  {
    id: '2',
    name: 'Théâtre de la Ville',
    latitude: 50.63794445148652,
    longitude: 3.0969858745452283,
    address: '64 Rue Louis Braille',
    city: 'Lille',
    zipcode: '59000',
    event_type: 'theatre',
  },
  {
    id: '3',
    name: "Musée d'Art",
    latitude: 50.64,
    longitude: 3.05,
    address: '12 Rue du Louvre',
    city: 'Lille',
    zipcode: '59000',
    event_type: 'museum',
  },
  {
    id: '4',
    name: 'Centre Chorale',
    latitude: 50.635,
    longitude: 3.055,
    address: '5 Avenue de la Musique',
    city: 'Lille',
    zipcode: '59000',
    event_type: 'chorale',
  },
  {
    id: '5',
    name: "Galerie d'Exposition",
    latitude: 50.642,
    longitude: 3.045,
    address: '20 Rue des Arts',
    city: 'Lille',
    zipcode: '59000',
    event_type: 'exposition',
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
    creator_id: '1',
    created_at: new Date().toISOString(),
    status: 'open',
  },
  {
    id: '2',
    name: 'Théâtre Classique',
    event_type: 'theatre',
    current_participants: 30,
    max_participants: 50,
    remaining_participants: 20,
    location_id: '2',
    creator_id: '2',
    created_at: new Date().toISOString(),
    status: 'open',
  },
  {
    id: '3',
    name: "Exposition d'Art Moderne",
    event_type: 'exposition',
    current_participants: 80,
    max_participants: 120,
    remaining_participants: 40,
    location_id: '5',
    creator_id: '3',
    created_at: new Date().toISOString(),
    status: 'open',
  },
  {
    id: '4',
    name: 'Visite au Musée',
    event_type: 'museum',
    current_participants: 20,
    max_participants: 40,
    remaining_participants: 20,
    location_id: '3',
    creator_id: '4',
    created_at: new Date().toISOString(),
    status: 'open',
  },
  {
    id: '5',
    name: "Chorale d'été",
    event_type: 'chorale',
    current_participants: 15,
    max_participants: 30,
    remaining_participants: 15,
    location_id: '4',
    creator_id: '5',
    created_at: new Date().toISOString(),
    status: 'open',
  },
];

export default function MapScreen() {
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    null
  );

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
              {getIconForEventType(location.event_type, 24, Colors.primary)}
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
                    <TouchableOpacity style={styles.joinButton}>
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
