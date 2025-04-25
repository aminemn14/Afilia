import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import axios from 'axios';
import MapScreen from '../app/(tabs)/map';

// Mocks des modules externes
jest.mock('axios');

jest.mock('react-native-maps', () => {
  const React = require('react');
  const { View } = require('react-native');
  const MapView = ({ children }: { children: React.ReactNode }) =>
    React.createElement(View, null, children);
  const Marker = ({
    children,
    onPress,
  }: {
    children: React.ReactNode;
    onPress: () => void;
  }) =>
    React.createElement(
      View,
      {
        testID: 'marker',
        onStartShouldSetResponder: () => true,
        onResponderRelease: onPress,
      },
      children
    );
  const Callout = ({ children }: { children: React.ReactNode }) =>
    React.createElement(View, { testID: 'callout' }, children);
  return { __esModule: true, default: MapView, Marker, Callout };
});

jest.mock('moti', () => {
  return {
    MotiView: ({ children }: { children: React.ReactNode }) => children,
    AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
  };
});

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));

jest.mock('expo-constants', () => ({
  expoConfig: { extra: { apiBaseUrl: 'https://mock' } },
}));
jest.mock('@/config/apiConfig', () => ({ baseURL: 'https://mock' }));

jest.mock('../app/components/LoadingContainer', () => {
  const React = require('react');
  const { View } = require('react-native');
  return () => React.createElement(View, { testID: 'loading' });
});

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { View } = require('react-native');
  const Icon = () => React.createElement(View);
  return { Ionicons: Icon };
});

jest.mock('react-native-heroicons/outline', () => {
  const React = require('react');
  const { View } = require('react-native');
  const Icon = () => React.createElement(View);
  return {
    BuildingLibraryIcon: Icon,
    CameraIcon: Icon,
    MapPinIcon: Icon,
    MusicalNoteIcon: Icon,
    MicrophoneIcon: Icon,
    TicketIcon: Icon,
  };
});

describe('MapScreen', () => {
  const fakeLocations = [
    {
      _id: 'loc1',
      latitude: 0,
      longitude: 0,
      name: 'L1',
      address: 'A1',
      city: 'C1',
      zipcode: 'Z1',
    },
  ];
  const fakeEvents = [
    {
      _id: 'e1',
      location_id: 'loc1',
      start_date: new Date(Date.now() + 10000).toISOString(),
      event_type: 'Concert',
      remaining_participants: 1,
    },
  ];

  beforeEach(() => {
    // Mock axios.get pour /locations et /events
    (axios.get as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/locations'))
        return Promise.resolve({ data: fakeLocations });
      if (url.includes('/events')) return Promise.resolve({ data: fakeEvents });
      return Promise.resolve({ data: [] });
    });
  });

  // Test: loader initial s'affiche pendant le chargement
  it('affiche le loader au démarrage', () => {
    const { getByTestId } = render(<MapScreen />);
    expect(getByTestId('loading')).toBeTruthy();
  });

  // Test: affiche les markers sur la carte une fois le chargement terminé
  it('affiche les markers sur la carte après chargement', async () => {
    const { queryByTestId, getAllByTestId } = render(<MapScreen />);
    await waitFor(() => expect(queryByTestId('loading')).toBeNull());
    expect(getAllByTestId('marker')).toHaveLength(1);
  });

  // Test: filtre les markers selon le type sélectionné (par ex. Théâtre → 0 marcateurs)
  it('filtre les markers selon le type sélectionné', async () => {
    const { getByText, queryAllByTestId } = render(<MapScreen />);
    await waitFor(() => expect(queryAllByTestId('marker').length).toBe(1));
    fireEvent.press(getByText('Théâtre'));
    await waitFor(() => expect(queryAllByTestId('marker').length).toBe(0));
  });
});
