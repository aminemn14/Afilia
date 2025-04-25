import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import { Alert } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import HomeScreen, { getLocationById } from '../app/(tabs)/index';

// Données factices pour les tests utils et composant
const fakeUser = { firstname: 'Alice', role: 'user' };
const fakeEvents = [
  {
    _id: 'e1',
    name: 'Concert Rock',
    event_type: 'Concert',
    start_date: new Date(Date.now() + 86400000).toISOString(),
    remaining_participants: 5,
    location_id: 'l1',
  },
];
const fakeLocations = [{ _id: 'l1', address: '10 rue A', city: 'Paris' }];

// Mocks des modules externes
jest.mock('axios');
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
jest.mock('moti', () => ({
  MotiView: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }) }));

// Suite de tests pour le composant HomeScreen
describe('HomeScreen', () => {
  beforeEach(() => {
    // Mock de la récupération utilisateur et des appels API
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
      JSON.stringify(fakeUser)
    );
    (axios.get as jest.Mock)
      .mockResolvedValueOnce({ data: fakeEvents })
      .mockResolvedValueOnce({ data: fakeLocations });
  });

  // Test: affiche le prénom de l'utilisateur après chargement
  it('affiche le prénom de l’utilisateur', async () => {
    const { getByText } = render(<HomeScreen />);
    await waitFor(() => expect(getByText('Bienvenue Alice !')).toBeTruthy());
  });

  // Test: affiche le nom de l'événement et son lieu
  it('affiche l’événement et son lieu', async () => {
    const { getByText } = render(<HomeScreen />);
    await waitFor(() => {
      expect(getByText('Concert Rock')).toBeTruthy();
      expect(getByText('10 rue A, Paris')).toBeTruthy();
    });
  });

  // Test: gère l'erreur réseau en affichant une alerte
  it('affiche une alerte si l’API events échoue', async () => {
    // Réinitialise les mocks pour contrôler précisément les appels
    (axios.get as jest.Mock).mockReset();
    // 1er appel (events) → rejet, 2nd appel (locations) → réussite
    (axios.get as jest.Mock)
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({ data: fakeLocations });

    const alertSpy = jest.spyOn(Alert, 'alert');
    render(<HomeScreen />);
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        'Erreur',
        'Impossible de récupérer les événements.'
      );
    });
  });
});

// Suite de tests pour la fonction utilitaire getLocationById
describe('getLocationById', () => {
  // Test: retourne la bonne location lorsque l'ID existe
  it('retourne la bonne location', () => {
    expect(getLocationById('l1', fakeLocations)).toEqual(fakeLocations[0]);
    expect(getLocationById('foo', fakeLocations)).toBeUndefined();
  });
});
