import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MessagesScreen from '../app/(tabs)/messages';

// Wrapper pour fournir NavigationContainer
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <NavigationContainer>{children}</NavigationContainer>
);

// Mocks externes
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
}));
jest.mock('../app/hooks/useSocket', () => () => ({
  current: { on: jest.fn(), off: jest.fn(), emit: jest.fn() },
}));
jest.mock('expo-router', () => ({
  router: { replace: jest.fn(), push: jest.fn() },
}));
jest.mock('@/config/apiConfig', () => ({ baseURL: 'https://mock' }));
jest.mock('../app/components/LoadingContainer', () => {
  const React = require('react');
  const { View } = require('react-native');
  return () => React.createElement(View, { testID: 'loading' });
});
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));

// Alias pour mock fetch
global.fetch = jest.fn();

beforeEach(() => jest.clearAllMocks());

describe('MessagesScreen', () => {
  const fakeUser = { id: 'user1' };
  const fakeConvos = [
    {
      id: 'conv1',
      friend: { id: 'f1', name: 'Alice Doe', avatar: null },
      lastMessage: 'Hello there',
      updatedAt: '2025-06-02T12:00:00Z',
      unread: true,
    },
  ];
  const fakeFriends = [
    {
      friendId: {
        _id: 'f2',
        firstname: 'Bob',
        lastname: 'Smith',
        avatar: null,
      },
    },
  ];

  // Test: loader initial s'affiche
  it('affiche le loader au démarrage', () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
      JSON.stringify(fakeUser)
    );
    const { getByTestId } = render(<MessagesScreen />, { wrapper });
    expect(getByTestId('loading')).toBeTruthy();
  });

  // Test: affiche conversations reçues depuis l'API
  it("affiche la liste des conversations quand l'API renvoie des données", async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
      JSON.stringify(fakeUser)
    );
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes(`/api/conversations/${fakeUser.id}`)) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(fakeConvos),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    const { getByText, queryByTestId } = render(<MessagesScreen />, {
      wrapper,
    });
    // attendre la fin du chargement
    await waitFor(() => expect(queryByTestId('loading')).toBeNull());
    // vérifie nom, dernier message et date formatée
    expect(getByText('Alice Doe')).toBeTruthy();
    expect(getByText('Hello there')).toBeTruthy();
    expect(getByText('02/06')).toBeTruthy();
  });

  // Test: fallback 404 conversations → amis transformés en conversations
  it("fallback: en l'absence de conversations, récupère les amis et les affiche", async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
      JSON.stringify(fakeUser)
    );
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes(`/api/conversations/${fakeUser.id}`)) {
        return Promise.resolve({ ok: false, status: 404 });
      }
      if (url.includes(`/api/friends/${fakeUser.id}`)) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(fakeFriends),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    const { getByText, queryByTestId } = render(<MessagesScreen />, {
      wrapper,
    });
    await waitFor(() => expect(queryByTestId('loading')).toBeNull());
    // attend que le nom complet de l'ami apparaisse
    expect(getByText('Bob Smith')).toBeTruthy();
    expect(getByText('Démarrer une conversation!')).toBeTruthy();
  });

  // Test: filtre la liste avec la barre de recherche
  it('filtre les conversations selon la recherche', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
      JSON.stringify(fakeUser)
    );
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes(`/api/conversations/${fakeUser.id}`)) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(fakeConvos),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    const { getByPlaceholderText, queryByTestId, queryByText } = render(
      <MessagesScreen />,
      { wrapper }
    );
    // attendre la fin du chargement
    await waitFor(() => expect(queryByTestId('loading')).toBeNull());

    // filtre sur "bob" : Alice Doe doit disparaître
    fireEvent.changeText(
      getByPlaceholderText('Rechercher une conversation...'),
      'bob'
    );
    await waitFor(() => {
      expect(queryByText('Alice Doe')).toBeNull();
    });
  });
});
