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
import Colors from '../constants/Colors';
import type { Location, SportGroup } from '@/app/types';

const MOCK_LOCATIONS: Location[] = [
  {
    id: '1',
    name: 'Terrain Adolphe Max',
    latitude: 50.64669971162,
    longitude: 3.051274251686708,
    address: "98 Façade de l'Esplanade",
    city: 'Lille',
    zipcode: '59000',
    type: 'outdoor',
    sport_type: 'football',
  },
  {
    id: '2',
    name: 'Hoops Factory',
    latitude: 50.63794445148652,
    longitude: 3.0969858745452283,
    address: '64 Rue Louis Braille',
    city: 'Lille',
    zipcode: '59000',
    type: 'indoor',
    sport_type: 'basketball',
  },
];

const MOCK_GROUPS: SportGroup[] = [
  {
    id: '1',
    name: 'Five Match',
    sport_type: 'football',
    current_participants: 8,
    required_participants: 10,
    location_id: '1',
    creator_id: '1',
    created_at: new Date().toISOString(),
    status: 'open',
  },
  {
    id: '2',
    name: 'Basketball 3v3',
    sport_type: 'basketball',
    current_participants: 4,
    required_participants: 6,
    location_id: '2',
    creator_id: '2',
    created_at: new Date().toISOString(),
    status: 'open',
  },
];

export default function MapScreen() {
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    null
  );

  const getGroupsAtLocation = (locationId: string) => {
    return MOCK_GROUPS.filter((group) => group.location_id === locationId);
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
              {(() => {
                const iconExists = (
                  Ionicons.glyphMap as Record<string, number>
                )[location.sport_type];
                const iconName = iconExists
                  ? location.sport_type
                  : 'location-outline';
                return (
                  <Ionicons
                    name={iconName as any}
                    size={24}
                    color={Colors.primary}
                  />
                );
              })()}
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

          <View style={styles.groupsContainer}>
            {getGroupsAtLocation(selectedLocation.id).length === 0 ? (
              <Text style={styles.noGroupText}>Aucun groupe Actif</Text>
            ) : (
              <>
                <Text style={styles.groupsTitle}>Groupes Actifs</Text>
                {getGroupsAtLocation(selectedLocation.id).map((group) => (
                  <View key={group.id} style={styles.groupCard}>
                    <View style={styles.groupInfo}>
                      <Text style={styles.groupName}>{group.name}</Text>
                      <View style={styles.participantsContainer}>
                        <Ionicons
                          name="people"
                          size={16}
                          color={Colors.primary}
                        />
                        <Text style={styles.participantsText}>
                          {group.current_participants}/
                          {group.required_participants}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity style={styles.joinButton}>
                      <Text style={styles.joinButtonText}>Rejoindre</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </>
            )}
          </View>

          <TouchableOpacity style={styles.createGroupButton}>
            <Text style={styles.createGroupButtonText}>Créer mon groupe</Text>
          </TouchableOpacity>
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
    borderRadius: 20,
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
  createGroupButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  createGroupButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
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
  groupsContainer: {
    gap: 12,
  },
  groupsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  noGroupText: {
    fontSize: 16,
    color: Colors.gray700,
    textAlign: 'center',
    marginVertical: 8,
  },
  groupCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.gray100,
    borderRadius: 12,
    padding: 12,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
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
    backgroundColor: Colors.secondary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  joinButtonText: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
});
