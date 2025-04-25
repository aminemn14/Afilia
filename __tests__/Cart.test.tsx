import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CartScreen from '../app/(tabs)/cart';

// Wrapper pour fournir le contexte de navigation
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <NavigationContainer>{children}</NavigationContainer>
);

// Mocks des dépendances externes
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
}));
jest.mock('../app/hooks/useSocket', () => () => ({ current: null }));
jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock('@/config/apiConfig', () => ({ baseURL: 'https://mock' }));
jest.mock('../app/components/LoadingContainer', () => {
  const React = require('react');
  const { View } = require('react-native');
  return () => React.createElement(View, { testID: 'loading' });
});
jest.mock('react-native-heroicons/outline', () => ({
  TrashIcon: () => null,
  ShoppingBagIcon: () => null,
}));

// Alias pour mocker fetch global
const globalAny: any = global;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('CartScreen', () => {
  const fakeUser = { _id: 'user1' };
  const fakeCartEmpty = { items: [] };
  const fakeCartItems = {
    items: [
      {
        event: {
          _id: 'e1',
          name: 'E1',
          start_date: '2025-05-01T00:00:00Z',
          location_id: 'loc1',
        },
        price: 12,
      },
    ],
  };
  const fakeLocation = { name: 'LocName' };

  // Test: loader initial
  it('affiche le loader au démarrage', () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
      JSON.stringify(fakeUser)
    );
    globalAny.fetch = jest.fn();
    const { getByTestId } = render(<CartScreen />, { wrapper });
    expect(getByTestId('loading')).toBeTruthy();
  });

  // Test: panier vide
  it('affiche message panier vide si pas d’items', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
      JSON.stringify(fakeUser)
    );
    globalAny.fetch = jest.fn((url: string) => {
      if (url.includes(`/api/users/${fakeUser._id}`))
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ cashbackBalance: 5 }),
        });
      if (url.includes(`/api/cart/${fakeUser._id}`))
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(fakeCartEmpty),
        });
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    const { getByText, queryByTestId } = render(<CartScreen />, { wrapper });
    await waitFor(() => expect(queryByTestId('loading')).toBeNull());
    expect(getByText('Votre panier est vide.')).toBeTruthy();
  });

  // Test: affiche les items du panier
  it('affiche les items du panier quand present', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
      JSON.stringify(fakeUser)
    );
    globalAny.fetch = jest.fn((url: string) => {
      if (url.includes(`/api/users/${fakeUser._id}`))
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ cashbackBalance: 0 }),
        });
      if (url.includes(`/api/cart/${fakeUser._id}`))
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(fakeCartItems),
        });
      if (url.includes('/api/locations/'))
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(fakeLocation),
        });
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    const { getByText, queryByTestId } = render(<CartScreen />, { wrapper });
    await waitFor(() => expect(queryByTestId('loading')).toBeNull());
    expect(getByText('E1')).toBeTruthy();
    expect(getByText('12 €')).toBeTruthy();
    expect(getByText('01/05/25')).toBeTruthy();
    expect(getByText('LocName')).toBeTruthy();
  });

  // Test: cashback impacte le montant final
  it('permet d’utiliser le cashback et met à jour le montant final', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
      JSON.stringify(fakeUser)
    );
    globalAny.fetch = jest.fn((url: string) => {
      if (url.includes(`/api/users/${fakeUser._id}`))
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ cashbackBalance: 5 }),
        });
      if (url.includes(`/api/cart/${fakeUser._id}`))
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(fakeCartItems),
        });
      if (url.includes('/api/locations/'))
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(fakeLocation),
        });
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    const { getByText, getByPlaceholderText, queryByTestId } = render(
      <CartScreen />,
      { wrapper }
    );
    await waitFor(() => expect(queryByTestId('loading')).toBeNull());

    // active cashback
    fireEvent.press(getByText('Utiliser mon cashback'));
    fireEvent.changeText(getByPlaceholderText('Montant à utiliser'), '5');
    fireEvent.press(getByText('Valider cashback'));

    // vérifie montant final 12 - 5 = 7
    await waitFor(() => expect(getByText('À payer')).toBeTruthy());
    expect(getByText('7.00 €')).toBeTruthy();
  });
});
