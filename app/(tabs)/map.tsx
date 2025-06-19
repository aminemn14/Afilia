import React, { useState, useEffect, JSX } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
  FlatList,
} from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import { MotiView, AnimatePresence } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import axios from 'axios';

import Colors from '../constants/Colors';
import apiConfig from '@/config/apiConfig';
import { Location, Event } from '../types';

import LoadingContainer from '../components/LoadingContainer';

const TYPE_MAP: Record<string, string> = {
  Tous: '',
  Concert: 'concert',
  Théâtre: 'theatre',
  Exposition: 'exposition',
  Musée: 'museum',
  Chorale: 'chorale',
};

const EVENT_TYPES = [
  'Tous',
  'Concert',
  'Théâtre',
  'Exposition',
  'Musée',
  'Chorale',
];

function getIconForEventType(
  eventTypes: string[],
  size: number,
  color: string
): JSX.Element {
  if (!eventTypes || eventTypes.length !== 1) {
    return <Ionicons name="location-outline" size={size} color={color} />;
  }
  switch (eventTypes[0].toLowerCase()) {
    case 'chorale':
      return (
        <Ionicons name="musical-notes-outline" size={size} color={color} />
      );
    case 'museum': // plus besoin de 'musée'
      return <Ionicons name="business-outline" size={size} color={color} />;
    case 'theatre': // pour 'Théâtre'
      return <Ionicons name="pricetag-outline" size={size} color={color} />;
    case 'concert':
      return <Ionicons name="mic-outline" size={size} color={color} />;
    case 'exposition':
      return <Ionicons name="camera-outline" size={size} color={color} />;
    default:
      return <Ionicons name="location-outline" size={size} color={color} />;
  }
}

export default function MapScreen() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const now = new Date();
  const [loading, setLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    null
  );
  const [selectedType, setSelectedType] = useState('Tous');

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

  const getEventsAtLocation = (locationId: string) => {
    return events.filter(
      (event) =>
        event.location_id === locationId && new Date(event.start_date) >= now // ⇐ uniquement futurs
    );
  };

  const filteredLocations = locations.filter((loc) => {
    const evs = getEventsAtLocation(loc._id || loc.id || '');
    if (selectedType === 'Tous') return true;

    const mappedType = TYPE_MAP[selectedType as keyof typeof TYPE_MAP];

    return evs.some((e) => e.event_type.toLowerCase() === mappedType);
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingContainer />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: 50.63123,
          longitude: 3.0524,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
      >
        {filteredLocations.map((loc) => {
          const locId = loc._id || loc.id;
          if (!locId) return null;
          const types = getEventsAtLocation(locId).map((e) =>
            e.event_type.toLowerCase()
          );
          return (
            <Marker
              key={locId}
              coordinate={{
                latitude: loc.latitude,
                longitude: loc.longitude,
              }}
              onPress={() => setSelectedLocation(loc)}
            >
              <AnimatePresence>
                <MotiView
                  from={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  transition={{ duration: 300, delay: 100 }}
                >
                  <View style={styles.markerContainer}>
                    {getIconForEventType(types, 24, Colors.primary)}
                  </View>
                </MotiView>
              </AnimatePresence>
              <Callout>
                <View style={styles.callout}>
                  <Text style={styles.calloutTitle}>
                    {loc.name || 'Lieu sans nom'}
                  </Text>
                  <Text style={styles.calloutAddress}>
                    {loc.address}
                    {'\n'}
                    {loc.city} {loc.zipcode}
                  </Text>
                </View>
              </Callout>
            </Marker>
          );
        })}
      </MapView>

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
              <Text style={styles.noEventText}>Aucun événement actif</Text>
            ) : (
              <>
                <Text style={styles.eventsTitle}>Événements Actifs</Text>
                {getEventsAtLocation(
                  selectedLocation._id || selectedLocation.id || ''
                ).map((ev) => {
                  const evId = ev._id || ev.id;
                  const soldOut = ev.remaining_participants === 0;
                  return (
                    <View key={evId} style={styles.eventCard}>
                      <View style={styles.eventInfo}>
                        <Text style={styles.eventName}>{ev.name}</Text>
                        <View style={styles.participantsContainer}>
                          <Ionicons
                            name="people"
                            size={16}
                            color={Colors.primary}
                          />
                          <Text style={styles.participantsText}>
                            {ev.remaining_participants} places restantes
                          </Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        style={[
                          styles.joinButton,
                          soldOut && styles.disabledJoinButton,
                        ]}
                        onPress={() =>
                          !soldOut &&
                          router.push(`/(events)/event/${ev._id || ev.id}`)
                        }
                        disabled={soldOut}
                      >
                        <Text
                          style={[
                            styles.joinButtonText,
                            soldOut && styles.disabledJoinButtonText,
                          ]}
                        >
                          {soldOut ? 'Complet' : 'Participer'}
                        </Text>
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
  filterContainer: {
    position: 'absolute',
    top: 70,
    left: 20,
    right: 20,
    backgroundColor: Colors.white,
    borderRadius: 100,
    paddingVertical: 8,
    paddingHorizontal: 16,
    elevation: 5,
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  filterList: {
    paddingHorizontal: 0,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.gray200,
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: Colors.secondary,
  },
  filterButtonText: {
    fontSize: 14,
    color: Colors.gray900,
  },
  filterButtonTextActive: {
    color: Colors.text,
    fontWeight: '600',
  },
  locationDetails: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 120,
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
  disabledJoinButton: {
    backgroundColor: Colors.gray300,
  },
  disabledJoinButtonText: {
    color: Colors.gray500,
  },
});
