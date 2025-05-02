import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  Button,
} from 'react-native';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/Colors';
import { useRouter } from 'expo-router';
import LoadingContainer from '../components/LoadingContainer';
import apiConfig from '@/config/apiConfig';
import useSocket from '../hooks/useSocket';

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const dd = date.getDate().toString().padStart(2, '0');
  const mm = (date.getMonth() + 1).toString().padStart(2, '0');
  const yy = date.getFullYear().toString().slice(-2);
  return `${dd}/${mm}/${yy}`;
}

export default function CartScreen() {
  const router = useRouter();
  const socketRef = useSocket();

  const [userId, setUserId] = useState<string | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [cashbackBalance, setCashbackBalance] = useState<number>(0);
  const [useCashback, setUseCashback] = useState<boolean>(false);
  const [cashbackToUse, setCashbackToUse] = useState<string>('0');
  const [cashbackValidated, setCashbackValidated] = useState<boolean>(false);

  const [events, setEvents] = useState<
    {
      id: string;
      name: string;
      price: number;
      start_date: string;
      locationName: string;
    }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [recapExpanded, setRecapExpanded] = useState(false);

  // Récupération de l'utilisateur et du solde cashback
  useEffect(() => {
    AsyncStorage.getItem('user')
      .then((json) => {
        if (!json) {
          setLoadingUser(false);
          return;
        }
        const u = JSON.parse(json);
        const id = u._id || u.id;
        setUserId(id);
        socketRef.current?.emit('joinRoom', id);
        setLoadingUser(false);
        // Récupérer le cashback
        fetch(`${apiConfig.baseURL}/api/users/${id}`)
          .then((r) => (r.ok ? r.json() : Promise.reject()))
          .then((uData) => setCashbackBalance(uData.cashbackBalance ?? 0))
          .catch(console.error);
      })
      .catch(console.error);
  }, []);

  // Fetch du panier
  const fetchCart = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${apiConfig.baseURL}/api/cart/${userId}`);
      if (!res.ok) throw new Error('Impossible de charger le panier');
      const cart = await res.json();
      const enriched = await Promise.all(
        cart.items.map(async (it: any) => {
          const { event, price } = it;
          let locationName = '';
          try {
            const locRes = await fetch(
              `${apiConfig.baseURL}/api/locations/${event.location_id}`
            );
            if (locRes.ok) {
              const locData = await locRes.json();
              locationName = locData.name;
            }
          } catch {}
          return {
            id: event._id,
            name: event.name,
            price,
            start_date: event.start_date,
            locationName,
          };
        })
      );
      setEvents(enriched);
    } catch (err: any) {
      console.error(err);
      Alert.alert('Erreur', 'Échec récupération du panier');
    } finally {
      setLoading(false);
    }
  };

  // Fetch au focus de l'écran
  useFocusEffect(
    useCallback(() => {
      fetchCart();
      setCashbackValidated(false);
      setUseCashback(false);
      setCashbackToUse('0');
    }, [userId])
  );

  // Mises à jour via WebSocket
  useEffect(() => {
    if (!socketRef.current || !userId) return;
    const handler = (data: any) => {
      setEvents(
        data.items.map((it: any) => ({
          id: it.event._id,
          name: it.event.name,
          price: it.price,
          start_date: it.event.start_date,
          locationName: '',
        }))
      );
      fetchCart();
    };
    socketRef.current.on('cartUpdated', handler);
    return () => {
      socketRef.current?.off('cartUpdated', handler);
    };
  }, [socketRef, userId]);

  // Supprimer un item du panier
  const removeEvent = async (eventId: string) => {
    if (!userId) return;
    try {
      const res = await fetch(`${apiConfig.baseURL}/api/cart/remove`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, eventId }),
      });
      if (!res.ok) throw new Error('Échec suppression');
      setEvents((ev) => ev.filter((e) => e.id !== eventId));
    } catch (err: any) {
      console.error(err);
      Alert.alert('Erreur', err.message);
    }
  };

  // 1. Tant que l'état utilisateur est en cours de chargement
  if (loadingUser) return <LoadingContainer />;

  // 2. Vue "invité" si non connecté
  if (!userId) {
    return (
      <View style={styles.mustConnectContainer}>
        <Ionicons
          name="alert-circle-outline"
          size={60}
          color={Colors.gray400}
        />
        <Text style={styles.mustConnectText}>
          Vous devez vous connecter pour accéder au panier.
        </Text>
        <TouchableOpacity
          style={styles.connectButton}
          onPress={() => router.replace('/(auth)/welcome')}
        >
          <Text style={styles.connectButtonText}>Se connecter</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // 3. Tant que le panier se charge
  if (loading) return <LoadingContainer />;

  // Calculs des totaux
  const totalAmount = events.reduce((sum, e) => sum + e.price, 0);
  const maxCashback = Math.min(cashbackBalance, totalAmount);
  const used = useCashback ? parseFloat(cashbackToUse) || 0 : 0;
  const finalAmount = Math.max(0, totalAmount - used);

  // Validation du cashback
  const validateCashback = () => {
    const amt = parseFloat(cashbackToUse);
    if (isNaN(amt) || amt <= 0) {
      Alert.alert('Erreur', 'Saisissez un montant valide');
    } else if (amt > maxCashback) {
      Alert.alert(
        'Erreur',
        `Vous ne pouvez utiliser que ${maxCashback.toFixed(2)} €`
      );
    } else {
      setCashbackValidated(true);
    }
  };

  // Rendu de chaque item
  const renderItem = ({ item, index }: { item: any; index: number }) => (
    <MotiView
      from={{ opacity: 0, translateY: 10 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ delay: index * 100 }}
      style={styles.card}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemPrice}>{item.price.toFixed(0)} €</Text>
      </View>
      <Text style={styles.eventDate}>{formatDate(item.start_date)}</Text>
      <View style={styles.addressContainer}>
        <Text style={styles.locationText}>{item.locationName}</Text>
        <TouchableOpacity
          onPress={() => removeEvent(item.id)}
          style={styles.deleteButton}
        >
          <Ionicons name="trash-outline" size={20} color={Colors.error} />
        </TouchableOpacity>
      </View>
    </MotiView>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mon Panier</Text>
      </View>

      <FlatList
        data={events}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
        contentContainerStyle={styles.cartList}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="bag-outline" size={60} color={Colors.gray400} />
            <Text style={styles.emptyText}>Votre panier est vide.</Text>
          </View>
        }
      />

      {events.length > 0 && (
        <View style={styles.footer}>
          {/* Récapitulatif */}
          <TouchableOpacity
            onPress={() => setRecapExpanded((e) => !e)}
            style={styles.recapToggleContainer}
          >
            <Text style={styles.recapToggleText}>
              {recapExpanded
                ? 'Masquer le récapitulatif'
                : 'Afficher le récapitulatif'}
            </Text>
          </TouchableOpacity>
          {recapExpanded && (
            <View style={styles.priceRecapContainer}>
              {events.map((e, i) => (
                <View key={i} style={styles.priceRecapRow}>
                  <Text style={styles.priceRecapLabel}>{e.name}</Text>
                  <Text style={styles.priceRecapAmount}>
                    {e.price.toFixed(0)} €
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Total avant cashback */}
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalAmount}>{totalAmount.toFixed(2)} €</Text>
          </View>

          {/* Option cashback */}
          {cashbackBalance > 0 && (
            <View style={styles.cashbackContainer}>
              <Text style={styles.cashbackLabel}>
                Cashback dispo : {cashbackBalance.toFixed(2)} €
              </Text>

              <TouchableOpacity
                onPress={() => {
                  setUseCashback((u) => !u);
                  setCashbackValidated(false);
                  setCashbackToUse('0');
                }}
              >
                <Text
                  style={[
                    styles.cashbackToggle,
                    useCashback && styles.cashbackOn,
                  ]}
                >
                  {useCashback ? 'Annuler cashback' : 'Utiliser mon cashback'}
                </Text>
              </TouchableOpacity>

              {useCashback && (
                <>
                  <View style={styles.cashbackInputRow}>
                    <TextInput
                      style={styles.cashbackInput}
                      keyboardType="decimal-pad"
                      value={cashbackToUse}
                      onChangeText={(t) => {
                        const cleaned = t
                          .replace(',', '.')
                          .replace(/[^0-9.]/g, '');
                        setCashbackToUse(cleaned);
                      }}
                      placeholder="Montant à utiliser"
                    />
                    <Text style={styles.cashbackMax}>
                      / {maxCashback.toFixed(2)}
                    </Text>
                  </View>

                  {!cashbackValidated && (
                    <TouchableOpacity
                      style={styles.validateButton}
                      onPress={validateCashback}
                    >
                      <Text style={styles.validateButtonText}>
                        Valider cashback
                      </Text>
                    </TouchableOpacity>
                  )}
                </>
              )}
            </View>
          )}

          {/* Total final */}
          {useCashback && cashbackValidated && (
            <View style={styles.finalContainer}>
              <Text style={styles.finalLabel}>À payer</Text>
              <Text style={styles.finalAmount}>{finalAmount.toFixed(2)} €</Text>
            </View>
          )}

          {/* Bouton paiement */}
          {(!useCashback || cashbackValidated) && (
            <TouchableOpacity
              style={styles.checkoutButton}
              onPress={() =>
                router.push({
                  pathname: '/(payment)',
                  params: {
                    total: finalAmount,
                    items: JSON.stringify(events),
                    cashbackUsed: used,
                  },
                })
              }
            >
              <Text style={styles.checkoutButtonText}>Passer au paiement</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    padding: 20,
    paddingTop: 80,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  title: { fontSize: 32, fontWeight: 'bold', color: Colors.text },
  cartList: { padding: 20 },
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
  itemName: { fontSize: 18, fontWeight: '600', color: Colors.text },
  eventDate: { fontSize: 14, color: Colors.gray600, marginTop: 4 },
  itemPrice: { fontSize: 16, fontWeight: '600', color: Colors.text },
  addressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  locationText: { fontSize: 14, color: Colors.gray600 },
  deleteButton: { marginLeft: 12 },
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
  recapToggleText: { fontSize: 16, color: Colors.accent, fontWeight: '500' },
  priceRecapContainer: { marginBottom: 8 },
  priceRecapRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  priceRecapLabel: { fontSize: 14, color: Colors.gray600 },
  priceRecapAmount: { fontSize: 14, color: Colors.gray600 },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 12,
  },
  totalLabel: { fontSize: 20, fontWeight: 'bold', color: Colors.text },
  totalAmount: { fontSize: 20, fontWeight: 'bold', color: Colors.text },
  cashbackContainer: { marginVertical: 12 },
  cashbackLabel: { fontSize: 14, color: Colors.gray600 },
  cashbackToggle: { marginTop: 6, fontSize: 16, color: Colors.accent },
  cashbackOn: { color: Colors.primary },
  cashbackInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  cashbackInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.gray300,
    borderRadius: 6,
    padding: 8,
    fontSize: 16,
  },
  cashbackMax: { marginLeft: 8, fontSize: 14, color: Colors.gray600 },
  validateButton: {
    marginTop: 10,
    backgroundColor: Colors.accent,
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  validateButtonText: { color: Colors.white, fontSize: 16, fontWeight: '600' },
  finalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 12,
  },
  finalLabel: { fontSize: 18, color: Colors.text },
  finalAmount: { fontSize: 18, fontWeight: 'bold', color: Colors.text },
  checkoutButton: {
    marginTop: 12,
    backgroundColor: Colors.accent,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  checkoutButtonText: { color: Colors.white, fontSize: 24, fontWeight: '600' },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    paddingTop: 235,
  },
  mustConnectContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: { marginBottom: 16 },
  emptyText: { fontSize: 18, color: Colors.gray600 },

  mustConnectText: {
    textAlign: 'center',
    fontSize: 18,
    color: Colors.gray600,
    marginVertical: 20,
  },
  connectButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  connectButtonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '700',
  },
});
