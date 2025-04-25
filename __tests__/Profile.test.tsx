import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ProfileScreen from '../app/(tabs)/profile';
import { act } from 'react-test-renderer';

// --- MOCKS ---

// mock apiConfig
jest.mock('@/config/apiConfig', () => ({ baseURL: 'https://mock' }));

// mock LoadingContainer
jest.mock('../app/components/LoadingContainer', () => {
  const React = require('react');
  const { View } = require('react-native');
  return () => React.createElement(View, { testID: 'loading' });
});

// mock expo-router
const mockReplace = jest.fn();
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace, push: mockPush }),
  useFocusEffect: (cb: any) => cb(),
}));

// mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  mergeItem: jest.fn().mockResolvedValue(undefined),
  removeItem: jest.fn(),
}));

// mock socket emitter
let mockSocketHandlers: Record<string, Function> = {};
const mockEmitter = {
  on: (ev: string, fn: Function) => {
    mockSocketHandlers[ev] = fn;
  },
  off: jest.fn(),
  emit: jest.fn(),
};
jest.mock('../app/hooks/useSocket', () => () => ({ current: mockEmitter }));

// mock vector-icons
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));

// global.fetch mock
global.fetch = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  mockSocketHandlers = {};
});

// --- TESTS ---

describe('ProfileScreen', () => {
  const fakeStoredUser = { _id: 'u1' };
  const fakeProfile = {
    _id: 'u1',
    firstname: 'Jean',
    lastname: 'Dupont',
    email: 'jean@example.com',
    username: 'jdupont',
    phoneNumber: '0123456789',
    bio: '',
    avatar: null,
    cashbackBalance: 7.5,
  };
  const fakeInvitations = [{ id: 'i1' }, { id: 'i2' }, { id: 'i3' }];

  it('affiche le loader tant que le profil n’est pas chargé', () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
      JSON.stringify(fakeStoredUser)
    );
    (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {})); // never resolves
    const { getByTestId } = render(<ProfileScreen />);
    expect(getByTestId('loading')).toBeTruthy();
  });

  it('récupère et affiche les données du profil et invitations', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
      JSON.stringify(fakeStoredUser)
    );
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(fakeProfile),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(fakeInvitations),
      });

    const { getByText, queryByTestId } = render(<ProfileScreen />);
    await waitFor(() => expect(queryByTestId('loading')).toBeNull());

    expect(getByText('Jean Dupont')).toBeTruthy();
    expect(getByText('jean@example.com')).toBeTruthy();
    expect(getByText('jdupont')).toBeTruthy();
    expect(getByText('0123456789')).toBeTruthy();
    expect(getByText('Aucune bio')).toBeTruthy();
    expect(getByText('7.50 €')).toBeTruthy();
    expect(getByText('Invitations en ami (3)')).toBeTruthy();

    await waitFor(() => {
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'user',
        JSON.stringify(fakeProfile)
      );
    });

    expect(mockEmitter.emit).toHaveBeenCalledWith('joinRoom', 'u1');
  });

  it('met à jour le compteur d’invitations sur event socket', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
      JSON.stringify(fakeStoredUser)
    );
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(fakeProfile),
      })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) });

    const { getByText, queryByTestId } = render(<ProfileScreen />);
    await waitFor(() => expect(queryByTestId('loading')).toBeNull());

    expect(getByText('Invitations en ami (0)')).toBeTruthy();

    act(() => {
      mockSocketHandlers['invitationReceived']();
    });
    expect(getByText('Invitations en ami (1)')).toBeTruthy();

    act(() => {
      mockSocketHandlers['invitationUpdated']();
    });
    expect(getByText('Invitations en ami (0)')).toBeTruthy();
  });

  it('met à jour le cashback sur event socket', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
      JSON.stringify(fakeStoredUser)
    );
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(fakeProfile),
      })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) });

    const { getByText, queryByTestId } = render(<ProfileScreen />);
    await waitFor(() => expect(queryByTestId('loading')).toBeNull());
    expect(getByText('7.50 €')).toBeTruthy();

    act(() => {
      mockSocketHandlers['cashbackUpdated']({
        userId: 'u1',
        newCashbackBalance: 12.34,
      });
    });
    expect(getByText('12.34 €')).toBeTruthy();
  });

  it('déconnexion : vide le storage et remplace la route', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
      JSON.stringify(fakeStoredUser)
    );
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(fakeProfile),
      })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) });

    const { getByText, queryByTestId } = render(<ProfileScreen />);
    await waitFor(() => expect(queryByTestId('loading')).toBeNull());

    fireEvent.press(getByText('Déconnexion'));
    await waitFor(() => {
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('token');
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('user');
      expect(mockReplace).toHaveBeenCalledWith('/welcome');
    });
  });
});
