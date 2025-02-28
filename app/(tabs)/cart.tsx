import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { MotiView } from 'moti';
import { TrashIcon, ShoppingBagIcon } from 'react-native-heroicons/outline';
import Colors from '../constants/Colors';
import { useRouter } from 'expo-router';

// Formatage de la date
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear().toString().slice(-2);
  return `${day}/${month}/${year}`;
};

// MOCK des événements pour tester
const MOCK_EVENTS = [
  {
    _id: '1',
    id: '1',
    name: 'Concert Rock Live',
    event_type: 'concert',
    current_participants: 10,
    max_participants: 100,
    remaining_participants: 90,
    location_id: 'loc1',
    created_at: '2025-02-01',
    status: 'open',
    price: 29.99,
    is_free: false,
    organizer: 'Organizer1',
    tel: '0123456789',
    email: 'contact@organizer1.com',
    description: 'Un concert rock exceptionnel.',
    start_date: '2025-03-15',
    end_date: '2025-03-15',
    start_time: '20:00',
    end_time: '23:00',
  },
  {
    _id: '2',
    id: '2',
    name: 'Spectacle de Magie',
    event_type: 'théâtre',
    current_participants: 20,
    max_participants: 80,
    remaining_participants: 60,
    location_id: 'loc2',
    created_at: '2025-02-05',
    status: 'open',
    price: 19.99,
    is_free: false,
    organizer: 'Organizer2',
    tel: '0987654321',
    email: 'contact@organizer2.com',
    description: 'Un spectacle de magie fascinant.',
    start_date: '2025-04-10',
    end_date: '2025-04-10',
    start_time: '18:00',
    end_time: '20:00',
  },
  {
    _id: '3',
    id: '3',
    name: 'Festival de Jazz',
    event_type: 'concert',
    current_participants: 50,
    max_participants: 150,
    remaining_participants: 100,
    location_id: 'loc3',
    created_at: '2025-02-10',
    status: 'open',
    price: 39.99,
    is_free: false,
    organizer: 'Organizer3',
    tel: '0112233445',
    email: 'contact@organizer3.com',
    description: 'Un festival de jazz en plein air.',
    start_date: '2025-05-05',
    end_date: '2025-05-05',
    start_time: '16:00',
    end_time: '22:00',
  },
];

// MOCK des lieux pour tester
const MOCK_LOCATIONS = [
  {
    _id: 'loc1',
    id: 'loc1',
    name: 'Salle des Fêtes de Lille',
    latitude: 50.6292,
    longitude: 3.0573,
    created_at: '2025-01-01',
    address: '12 Rue de la Liberté',
    city: 'Lille',
    zipcode: '59000',
    event_types: ['concert', 'théâtre'],
    image_url: 'https://example.com/image1.jpg',
    description: 'Lieu mythique pour les concerts à Lille.',
    tel: '0102030405',
    email: 'contact@sallefesteslille.com',
  },
  {
    _id: 'loc2',
    id: 'loc2',
    name: 'Théâtre de la Magie Lille',
    latitude: 50.6334,
    longitude: 3.066,
    created_at: '2025-01-05',
    address: '25 Rue Faidherbe',
    city: 'Lille',
    zipcode: '59000',
    event_types: ['théâtre'],
    image_url: 'https://example.com/image2.jpg',
    description: 'Scène pour spectacles de magie à Lille.',
    tel: '0504030201',
    email: 'info@theatredelamagielille.com',
  },
  {
    _id: 'loc3',
    id: 'loc3',
    name: 'Parc du Jazz Lillois',
    latitude: 50.6333,
    longitude: 3.0586,
    created_at: '2025-01-10',
    address: '5 Boulevard Vauban',
    city: 'Lomme',
    zipcode: '59700',
    event_types: ['concert'],
    image_url: 'https://example.com/image3.jpg',
    description: 'Festival en plein air dans la métropole lilloise.',
    tel: '0607080910',
    email: 'contact@parcdujazzlille.com',
  },
];

export default function CartScreen() {
  const router = useRouter();
  const [events, setEvents] = useState(MOCK_EVENTS);
  const [recapExpanded, setRecapExpanded] = useState(false);

  const removeEvent = (id: string) => {
    setEvents((prevEvents) => prevEvents.filter((event) => event.id !== id));
  };

  const renderEventItem = ({
    item,
    index,
  }: {
    item: (typeof MOCK_EVENTS)[0];
    index: number;
  }) => {
    // Recherche du lieu correspondant à l'événement
    const location = MOCK_LOCATIONS.find((loc) => loc.id === item.location_id);

    return (
      <MotiView
        from={{ opacity: 0, translateY: 10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ delay: index * 100 }}
        style={styles.card}
      >
        <View style={styles.cardHeader}>
          <View style={styles.infoContainer}>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.eventDate}>{formatDate(item.start_date)}</Text>
          </View>
          <View style={styles.actionContainer}>
            <Text style={styles.itemPrice}>{item.price.toFixed(0)} €</Text>
            <TouchableOpacity
              onPress={() => removeEvent(item.id)}
              style={styles.deleteButton}
            >
              <TrashIcon color={Colors.error} size={20} />
            </TouchableOpacity>
          </View>
        </View>
        {location && (
          <Text style={styles.eventLocation}>
            {location.address}, {location.city} {location.zipcode}
          </Text>
        )}
      </MotiView>
    );
  };

  // Calcul du montant total
  const totalAmount = events.reduce((total, item) => total + item.price, 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mon Panier</Text>
      </View>
      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        renderItem={renderEventItem}
        contentContainerStyle={styles.cartList}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <ShoppingBagIcon
              color={Colors.gray400}
              size={60}
              style={styles.emptyIcon}
            />
            <Text style={styles.emptyText}>Votre panier est vide.</Text>
          </View>
        }
      />
      <View style={styles.footer}>
        {/* Bouton pour afficher/masquer le récapitulatif */}
        <TouchableOpacity
          onPress={() => setRecapExpanded(!recapExpanded)}
          style={styles.recapToggleContainer}
        >
          <Text style={styles.recapToggleText}>
            {recapExpanded
              ? 'Masquer le récapitulatif'
              : 'Afficher le récapitulatif'}
          </Text>
        </TouchableOpacity>

        {/* Récapitulatif collapsible */}
        {recapExpanded && (
          <View style={styles.priceRecapContainer}>
            {events.map((item, index) => (
              <View key={index} style={styles.priceRecapRow}>
                <Text style={styles.priceRecapLabel}>{item.name}</Text>
                <Text style={styles.priceRecapAmount}>
                  {item.price.toFixed(0)} €
                </Text>
              </View>
            ))}
          </View>
        )}
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalAmount}>{totalAmount.toFixed(0)} €</Text>
        </View>
        <TouchableOpacity
          style={styles.checkoutButton}
          onPress={() => router.push('/(payment)')}
        >
          <Text style={styles.checkoutButtonText}>Passer au paiement</Text>
        </TouchableOpacity>
      </View>
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
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.text,
  },
  cartList: {
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
  },
  infoContainer: {
    flex: 1,
  },
  actionContainer: {
    alignItems: 'flex-end',
  },
  itemName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  eventDate: {
    fontSize: 14,
    color: Colors.gray600,
    marginTop: 4,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  deleteButton: {
    marginTop: 4,
  },
  eventLocation: {
    fontSize: 14,
    color: Colors.gray600,
    marginTop: 12,
  },
  footer: {
    paddingHorizontal: 20,

    paddingBottom: 120,
    borderTopWidth: 1,
    borderTopColor: Colors.gray100,
    backgroundColor: Colors.white,
  },
  recapToggleContainer: {
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
    marginBottom: 8,
  },
  recapToggleText: {
    fontSize: 16,
    color: Colors.accent,
    fontWeight: '500',
  },
  priceRecapContainer: {
    marginBottom: 8,
  },
  priceRecapRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceRecapLabel: {
    fontSize: 14,
    color: Colors.gray600,
  },
  priceRecapAmount: {
    fontSize: 14,
    color: Colors.gray600,
    textAlign: 'right',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 12,
  },
  totalLabel: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'right',
  },
  checkoutButton: {
    backgroundColor: Colors.accent,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  checkoutButtonText: {
    color: Colors.white,
    fontSize: 24,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    color: Colors.gray600,
  },
});
