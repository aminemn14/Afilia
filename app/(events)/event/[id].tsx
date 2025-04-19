import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ImageBackground,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import LoadingContainer from '../../components/LoadingContainer';

import Colors from '@/app/constants/Colors';
import apiConfig from '@/config/apiConfig';
import { useSearchParams } from 'expo-router/build/hooks';
import { Event, Location } from '../../types';

export default function EventDetailScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  const [userId, setUserId] = useState<string | null>(null);
  const [event, setEvent] = useState<Event | null>(null);
  const [location, setLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Charger l'utilisateur
  useEffect(() => {
    AsyncStorage.getItem('user')
      .then((json) => {
        if (json) {
          const u = JSON.parse(json);
          setUserId(u._id || u.id);
        }
      })
      .catch((err) => console.error('Erreur loadUser', err));
  }, []);

  // Charger l'événement et le lieu
  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await fetch(`${apiConfig.baseURL}/api/events/${id}`);
        if (!res.ok) throw new Error('Erreur récupération événement');
        const data: Event = await res.json();
        setEvent(data);
        if (data.location_id) {
          const locRes = await fetch(
            `${apiConfig.baseURL}/api/locations/${data.location_id}`
          );
          if (locRes.ok) {
            const locData: Location = await locRes.json();
            setLocation(locData);
          }
        }
      } catch (err) {
        console.error(err);
        Alert.alert('Erreur', 'Impossible de récupérer l’événement.');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleAddToCart = async () => {
    if (!userId || !event) {
      Alert.alert('Erreur', 'Utilisateur ou événement introuvable.');
      return;
    }
    try {
      const res = await fetch(`${apiConfig.baseURL}/api/cart/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, eventId: event._id }),
      });
      const body = await res.json();
      if (!res.ok) {
        if (body.error?.includes('déjà')) {
          Alert.alert('Attention', 'Cet événement est déjà dans votre panier.');
        } else {
          throw new Error(body.error || 'Erreur ajout panier');
        }
        return;
      }
      Alert.alert('Succès', 'Événement ajouté au panier 🎉', [
        {
          text: 'Voir mon panier',
          onPress: () => router.push('/cart'),
          style: 'cancel',
        },
        { text: 'Rester ici' },
      ]);
    } catch (err: any) {
      console.error(err);
      Alert.alert('Erreur', err.message);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.mainContainer}>
        <LoadingContainer />
      </SafeAreaView>
    );
  }

  if (!event) {
    return (
      <SafeAreaView style={styles.mainContainer}>
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

  const isSoldOut = event.remaining_participants === 0;

  // Formatage
  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  const displayPrice = event.is_free ? 'Gratuit' : `${event.price}€`;
  const eventType =
    event.event_type.charAt(0).toUpperCase() + event.event_type.slice(1);
  const sameDay = (d1: string, d2: string) =>
    new Date(d1).toDateString() === new Date(d2).toDateString();
  const dateTimeString = sameDay(event.start_date, event.end_date)
    ? `Le ${formatDate(event.start_date)} de ${event.start_time} à ${
        event.end_time
      }`
    : `Du ${formatDate(event.start_date)} à ${
        event.start_time
      }\nAu ${formatDate(event.end_date)} à ${event.end_time}`;

  return (
    <View style={styles.mainContainer}>
      <View style={styles.container}>
        <View style={styles.bannerContainer}>
          <ImageBackground
            source={{ uri: location?.image_url }}
            style={styles.bannerImage}
          >
            <LinearGradient
              colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.7)']}
              style={styles.bannerOverlay}
            >
              <TouchableOpacity
                onPress={() => router.back()}
                style={styles.backIcon}
              >
                <Ionicons name="chevron-back" size={16} color={Colors.text} />
              </TouchableOpacity>
              <Text style={styles.bannerTitle}>{event.name}</Text>
              <Text style={styles.bannerPrice}>{displayPrice}</Text>
            </LinearGradient>
          </ImageBackground>
        </View>
        <ScrollView
          contentContainerStyle={styles.scrollContentContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.chipContainer}>
            <View style={[styles.chipBase, styles.typeChip]}>
              <MaterialCommunityIcons
                name="star-four-points-outline"
                size={16}
                color={Colors.text}
                style={{ marginRight: 4 }}
              />
              <Text style={styles.typeChipText}>{eventType}</Text>
            </View>
            <View style={[styles.chipBase, styles.participantsChip]}>
              <Ionicons
                name="people"
                size={16}
                color={Colors.white}
                style={{ marginRight: 4 }}
              />
              <Text style={styles.chipText}>
                {event.remaining_participants} places restantes
              </Text>
            </View>
          </View>
          <View style={styles.detailCard}>
            <Text style={styles.cardTitle}>Dates et Horaires</Text>
            <Text style={styles.cardText}>{dateTimeString}</Text>
          </View>
          <View style={styles.detailCard}>
            <Text style={styles.cardTitle}>Infos Organisateur</Text>
            {['person', 'call', 'mail'].map((icon, idx) => (
              <View key={idx} style={styles.infoLine}>
                <Ionicons
                  name={icon as any}
                  size={18}
                  color={Colors.primary}
                  style={styles.infoIcon}
                />
                <Text style={styles.infoText}>
                  {
                    {
                      person: event.organizer || '—',
                      call: event.tel
                        ? event.tel.replace(/(\d{2})(?=\d)/g, '$1 ')
                        : '—',
                      mail: event.email || '—',
                    }[icon]
                  }
                </Text>
              </View>
            ))}
          </View>
          <View style={styles.detailCard}>
            <Text style={styles.cardTitle}>Description</Text>
            <Text style={styles.cardText}>{event.description}</Text>
          </View>
          <View style={styles.detailCard}>
            <Text style={styles.cardTitle}>Lieu</Text>
            <Text style={styles.cardText}>
              {location
                ? `${location.name}, ${location.address}`
                : 'Adresse non disponible'}
            </Text>
          </View>
        </ScrollView>
        <TouchableOpacity
          style={[styles.fixedButton, isSoldOut && styles.disabledButton]}
          onPress={handleAddToCart}
          disabled={isSoldOut}
        >
          <Text
            style={[
              styles.fixedButtonText,
              isSoldOut && styles.disabledButtonText,
            ]}
          >
            {isSoldOut ? 'Événement Complet' : 'Ajouter au panier'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: Colors.background },
  container: {
    flex: 1,
    position: 'relative',
    backgroundColor: Colors.background,
  },
  bannerContainer: { width: '100%', height: 220, overflow: 'hidden' },
  bannerImage: { flex: 1, justifyContent: 'flex-end' },
  bannerOverlay: {
    width: '100%',
    height: '100%',
    paddingTop: 40,
    paddingHorizontal: 16,
    paddingBottom: 16,
    justifyContent: 'flex-end',
  },
  backIcon: {
    position: 'absolute',
    top: 60,
    left: 16,
    zIndex: 2,
    backgroundColor: Colors.white,
    padding: 6,
    borderRadius: 20,
  },
  bannerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 4,
  },
  bannerPrice: { fontSize: 20, fontWeight: '600', color: Colors.white },
  scrollContentContainer: { padding: 16, paddingBottom: 100 },
  chipContainer: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  chipBase: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 30,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  typeChip: { backgroundColor: Colors.secondary },
  participantsChip: { backgroundColor: Colors.accent },
  typeChipText: { fontSize: 14, color: Colors.text, fontWeight: '600' },
  chipText: { fontSize: 14, color: Colors.white, fontWeight: '600' },
  detailCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  cardText: { fontSize: 15, lineHeight: 22, color: Colors.gray700 },
  infoLine: { flexDirection: 'row', alignItems: 'center', marginVertical: 8 },
  infoIcon: { marginRight: 6 },
  infoText: { fontSize: 15, color: Colors.gray700 },
  fixedButton: {
    position: 'absolute',
    bottom: 20,
    width: '80%',
    alignSelf: 'center',
    backgroundColor: Colors.accent,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    elevation: 2,
  },
  fixedButtonText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
  disabledButton: {
    backgroundColor: Colors.gray300,
  },
  disabledButtonText: {
    color: Colors.gray500,
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
  backButtonText: { fontSize: 16, color: Colors.white },
});
