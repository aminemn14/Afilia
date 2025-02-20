import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import Colors from '../constants/Colors';
import type { SportGroup } from '@/app/types';

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

const SPORT_TYPES = ['Tous', 'Football', 'Basketball', 'Tennis'];

export default function HomeScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSport, setSelectedSport] = useState('Tous');
  const [groups, setGroups] = useState(MOCK_GROUPS);

  const filteredGroups = groups.filter((group) => {
    const matchesSearch = group.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesSport =
      selectedSport === 'Tous' ||
      group.sport_type.toLowerCase() === selectedSport.toLowerCase();
    return matchesSearch && matchesSport;
  });

  const renderGroupCard = ({
    item,
    index,
  }: {
    item: SportGroup;
    index: number;
  }) => (
    <MotiView
      from={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 100 }}
      style={styles.card}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.groupName}>{item.name}</Text>
        <View style={styles.sportBadge}>
          <Text style={styles.sportType}>{item.sport_type}</Text>
        </View>
      </View>

      <View style={styles.participantsContainer}>
        <Ionicons name="people" size={20} color={Colors.text} />
        <Text style={styles.participantsText}>
          {item.current_participants}/{item.required_participants} participants
        </Text>
      </View>

      <TouchableOpacity style={styles.joinButton}>
        <Text style={styles.joinButtonText}>Rejoindre le groupe</Text>
      </TouchableOpacity>
    </MotiView>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Trouver un groupe</Text>
        <View style={styles.searchContainer}>
          <Ionicons
            name="search"
            size={20}
            color={Colors.gray600}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un groupe..."
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
          data={SPORT_TYPES}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterButton,
                selectedSport === item && styles.filterButtonActive,
              ]}
              onPress={() => setSelectedSport(item)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  selectedSport === item && styles.filterButtonTextActive,
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
        data={filteredGroups}
        renderItem={renderGroupCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.groupsList}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    padding: 20,
    paddingTop: 80,
    backgroundColor: Colors.white,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
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
  groupsList: {
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
  groupName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  sportBadge: {
    backgroundColor: Colors.secondary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sportType: {
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
