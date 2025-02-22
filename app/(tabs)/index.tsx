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
import type { Event } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
];

const EVENT_TYPES = ['Tous', 'Théâtre', 'Concert', 'Opéra', 'Spectacle'];

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

  const renderEventCard = ({ item, index }: { item: Event; index: number }) => (
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

      <TouchableOpacity style={styles.joinButton}>
        <Text style={styles.joinButtonText}>Participer</Text>
      </TouchableOpacity>
    </MotiView>
  );

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
          {/* Affiche le bouton addEvent seulement si l'utilisateur est admin */}
          {user && user.role === 'admin' && (
            <TouchableOpacity style={styles.newEventButton}>
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
