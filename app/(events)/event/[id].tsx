import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  ImageBackground,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import Colors from '@/app/constants/Colors';
import apiConfig from '@/config/apiConfig';
import { useSearchParams } from 'expo-router/build/hooks';
import { Event, Location } from '../../types';

export default function EventDetailScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  const [event, setEvent] = useState<Event | null>(null);
  const [location, setLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!id) return;

    const fetchEvent = async () => {
      try {
        const response = await fetch(`${apiConfig.baseURL}/api/events/${id}`);
        if (!response.ok) {
          throw new Error('Erreur lors de la récupération de l’événement');
        }
        const eventData: Event = await response.json();
        setEvent(eventData);

        const locationId = eventData.location_id;
        if (locationId) {
          const locRes = await fetch(
            `${apiConfig.baseURL}/api/locations/${locationId}`
          );
          if (!locRes.ok) {
            throw new Error('Erreur lors de la récupération du lieu');
          }
          const locationData: Location = await locRes.json();
          setLocation(locationData);
        }
      } catch (error) {
        console.error(error);
        Alert.alert(
          'Erreur',
          'Impossible de récupérer les données de cet événement.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView style={styles.mainContainer}>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
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

  // Fonctions de formatage
  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTimeDisplay = (timeString: string) => {
    return timeString;
  };

  const formatPhoneNumber = (phone: string) => {
    return phone.replace(/(\d{2})(?=\d)/g, '$1 ').trim();
  };

  const isSameDay = (dateString1: string, dateString2: string) => {
    const d1 = new Date(dateString1);
    const d2 = new Date(dateString2);
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };

  const displayPrice = event.is_free ? 'Gratuit' : `${event.price}€`;
  const eventType =
    event.event_type.charAt(0).toUpperCase() + event.event_type.slice(1);

  const dateTimeString = isSameDay(event.start_date, event.end_date)
    ? `Le ${formatDate(event.start_date)} de ${formatTimeDisplay(
        event.start_time
      )} à ${formatTimeDisplay(event.end_time)}`
    : `Du ${formatDate(event.start_date)} à ${formatTimeDisplay(
        event.start_time
      )}\nAu ${formatDate(event.end_date)} à ${formatTimeDisplay(
        event.end_time
      )}`;

  const bannerImageUri = location ? location.image_url : '';

  return (
    <View style={styles.mainContainer}>
      <View style={styles.container}>
        <View style={styles.bannerContainer}>
          <ImageBackground
            source={{ uri: bannerImageUri }}
            style={styles.bannerImage}
            resizeMode="cover"
          >
            <LinearGradient
              colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.7)']}
              style={styles.bannerOverlay}
            >
              <TouchableOpacity
                style={styles.backIcon}
                onPress={() => router.back()}
              >
                <Ionicons name="chevron-back" size={16} color={Colors.text} />
              </TouchableOpacity>
              <Text style={styles.bannerTitle}>{event.name}</Text>
              <Text style={styles.bannerPrice}>{displayPrice}</Text>
            </LinearGradient>
          </ImageBackground>
        </View>

        {/* Contenu principal */}
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
            <View style={styles.infoLine}>
              <Ionicons
                name="person"
                size={18}
                color={Colors.primary}
                style={styles.infoIcon}
              />
              <Text style={styles.infoText}>{event.organizer || '—'}</Text>
            </View>
            <View style={styles.infoLine}>
              <Ionicons
                name="call"
                size={18}
                color={Colors.primary}
                style={styles.infoIcon}
              />
              <Text style={styles.infoText}>
                {event.tel ? formatPhoneNumber(event.tel) : '—'}
              </Text>
            </View>
            <View style={styles.infoLine}>
              <Ionicons
                name="mail"
                size={18}
                color={Colors.primary}
                style={styles.infoIcon}
              />
              <Text style={styles.infoText}>{event.email || '—'}</Text>
            </View>
          </View>

          <View style={styles.detailCard}>
            <Text style={styles.cardTitle}>Description</Text>
            <Text style={styles.cardText}>{event.description}</Text>
          </View>

          <View style={styles.detailCard}>
            <Text style={styles.cardTitle}>Lieu</Text>
            {location ? (
              <>
                <Text style={styles.cardText}>
                  <Text style={{ fontWeight: '700' }}>
                    {location.name}
                    {'\n'}
                  </Text>
                  {location.address}, {location.city} {location.zipcode}
                </Text>
                {location.description ? (
                  <View style={{ marginTop: 8 }}>
                    <Text style={styles.cardSubtitle}>À propos du lieu</Text>
                    <Text style={styles.cardText}>{location.description}</Text>
                  </View>
                ) : null}
              </>
            ) : (
              <Text style={styles.cardText}>Adresse non disponible</Text>
            )}
          </View>
        </ScrollView>

        <TouchableOpacity
          style={styles.fixedButton}
          onPress={() => {
            // TODO: Ajouter l'événement au panier
          }}
        >
          <Text style={styles.fixedButtonText}>Ajouter au panier</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    position: 'relative',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerContainer: {
    width: '100%',
    height: 220,
    backgroundColor: Colors.gray300,
    overflow: 'hidden',
  },
  bannerImage: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  bannerOverlay: {
    width: '100%',
    height: '100%',
    paddingTop: 40,
    paddingHorizontal: 16,
    paddingBottom: 16,
    justifyContent: 'flex-end',
  },
  bannerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 4,
  },
  bannerPrice: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.white,
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
  scrollContentContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  chipBase: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 30,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  typeChip: {
    backgroundColor: Colors.secondary,
  },
  participantsChip: {
    backgroundColor: Colors.accent,
  },
  typeChipText: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '600',
  },
  chipText: {
    fontSize: 14,
    color: Colors.white,
    fontWeight: '600',
  },
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
  cardSubtitle: {
    marginTop: 6,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.gray700,
    marginBottom: 4,
  },
  cardText: {
    fontSize: 15,
    lineHeight: 22,
    color: Colors.gray700,
  },
  infoLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  infoIcon: {
    marginRight: 6,
  },
  infoText: {
    fontSize: 15,
    color: Colors.gray700,
  },
  fixedButton: {
    position: 'absolute',
    bottom: 20,
    backgroundColor: Colors.accent,
    paddingVertical: 16,
    width: '80%',
    alignSelf: 'center',
    borderRadius: 30,
    alignItems: 'center',
    elevation: 2,
  },
  fixedButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  backButton: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  backButtonText: {
    fontSize: 16,
    color: Colors.white,
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
});
