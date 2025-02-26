import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert,
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
import axios from 'axios';

import Colors from '../constants/Colors';
import apiConfig from '@/config/apiConfig';
import { Location, Event } from '../types';

function getIconForEventType(
  eventTypes: string[],
  size: number,
  color: string
): JSX.Element {
  // Si le tableau est vide ou si le lieu a plusieurs types => icône par défaut
  if (!eventTypes || eventTypes.length !== 1) {
    return <MapPinIcon size={size} color={color} strokeWidth={1.8} />;
  }

  const type = eventTypes[0].toLowerCase();
  switch (type) {
    case 'chorale':
      return <MusicalNoteIcon size={size} color={color} strokeWidth={1.8} />;
    case 'musée':
    case 'museum':
      return (
        <BuildingLibraryIcon size={size} color={color} strokeWidth={1.8} />
      );
    case 'théâtre':
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

export default function MapScreen() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    null
  );

  // Récupération des lieux
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await axios.get<Location[]>(
          `${apiConfig.baseURL}/api/locations`
        );
        setLocations(response.data);
      } catch (error) {
        Alert.alert('Erreur', 'Impossible de récupérer les lieux.');
        console.error(error);
      }
    };

    // Récupération des événements
    const fetchEvents = async () => {
      try {
        const response = await axios.get<Event[]>(
          `${apiConfig.baseURL}/api/events`
        );
        setEvents(response.data);
      } catch (error) {
        Alert.alert('Erreur', 'Impossible de récupérer les événements.');
        console.error(error);
      }
    };

    Promise.all([fetchLocations(), fetchEvents()]).finally(() => {
      setLoading(false);
    });
  }, []);

  // Pour récupérer les événements liés à un lieu donné
  const getEventsAtLocation = (locationId: string) => {
    return events.filter((event) => event.location_id === locationId);
  };

  const getEventTypesForLocation = (locationId: string) => {
    const types = events
      .filter((event) => event.location_id === locationId)
      .map((e) => e.event_type.toLowerCase());

    return types;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

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
        {locations.map((location) => {
          const locationId = location._id || location.id;
          if (!locationId) return null;

          const eventTypes = getEventTypesForLocation(locationId);

          return (
            <Marker
              key={locationId}
              coordinate={{
                latitude: location.latitude,
                longitude: location.longitude,
              }}
              onPress={() => setSelectedLocation(location)}
            >
              <View style={styles.markerContainer}>
                {getIconForEventType(eventTypes, 24, Colors.primary)}
              </View>
              <Callout>
                <View style={styles.callout}>
                  <Text style={styles.calloutTitle}>
                    {location.name || 'Lieu sans nom'}
                  </Text>
                  <Text style={styles.calloutAddress}>
                    {location.address}
                    {'\n'}
                    {location.city} {location.zipcode}
                  </Text>
                </View>
              </Callout>
            </Marker>
          );
        })}
      </MapView>

      {selectedLocation && (
        <MotiView
          style={styles.locationDetails}
          from={{ translateY: 300 }}
          animate={{ translateY: 0 }}
          exit={{ translateY: 300 }}
        >
          <View style={styles.locationHeader}>
            <Text style={styles.locationName}>
              {selectedLocation.name || 'Lieu sans nom'}
            </Text>
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
            {getEventsAtLocation(
              selectedLocation._id || selectedLocation.id || ''
            ).length === 0 ? (
              <Text style={styles.noEventText}>Aucun événement Actif</Text>
            ) : (
              <>
                <Text style={styles.eventsTitle}>Événements Actifs</Text>
                {getEventsAtLocation(
                  selectedLocation._id || selectedLocation.id || ''
                ).map((event) => {
                  const eventId = event._id || event.id;
                  return (
                    <View key={eventId} style={styles.eventCard}>
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
                        onPress={() =>
                          router.push(
                            `/(events)/event/${event._id || event.id}`
                          )
                        }
                      >
                        <Text style={styles.joinButtonText}>Participer</Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </>
            )}
          </View>
        </MotiView>
      )}
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
