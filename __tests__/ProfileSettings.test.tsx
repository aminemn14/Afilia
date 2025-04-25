import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import ProfileSettingsScreen from '../app/(settingsProfile)/index';
import apiConfig from '@/config/apiConfig';

// --- mocks ---
jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
}));

jest.spyOn(Alert, 'alert').mockImplementation(() => {});

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
  MediaTypeOptions: { Images: 'Images' },
}));

jest.mock('expo-file-system', () => ({
  getInfoAsync: jest.fn(),
}));

global.fetch = jest.fn();

describe('ProfileSettingsScreen', () => {
  const fakeUser = {
    _id: 'u1',
    username: 'jdoe',
    email: 'j@d.com',
    firstname: 'John',
    lastname: 'Doe',
    phoneNumber: '0123456789',
    bio: 'Hello!',
    avatar: 'https://foo/avatar.png',
  };

  let replaceMock: jest.Mock;
  let backMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    replaceMock = jest.fn();
    backMock = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({
      replace: replaceMock,
      back: backMock,
    });

    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
      JSON.stringify(fakeUser)
    );
    // default fetch → OK
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ ...fakeUser, username: 'newuser' }),
    });
  });

  it('loads initial user data into fields', async () => {
    const { getByPlaceholderText } = render(<ProfileSettingsScreen />);
    await waitFor(() =>
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('user')
    );
    expect(getByPlaceholderText("Nom d'utilisateur").props.value).toBe(
      fakeUser.username
    );
    expect(getByPlaceholderText('Email').props.value).toBe(fakeUser.email);
    expect(getByPlaceholderText('Prénom').props.value).toBe(fakeUser.firstname);
    expect(getByPlaceholderText('Nom').props.value).toBe(fakeUser.lastname);
    expect(getByPlaceholderText('Téléphone').props.value).toBe(
      fakeUser.phoneNumber
    );
    expect(getByPlaceholderText('Votre bio').props.value).toBe(fakeUser.bio);
  });

  it('pickAvatar: permission denied shows alert', async () => {
    (
      ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock
    ).mockResolvedValue({ status: 'denied' });
    const { getByText } = render(<ProfileSettingsScreen />);
    await waitFor(() => {}); // settle initial effect

    await act(async () => {
      fireEvent.press(getByText("Changer l'avatar"));
    });

    expect(Alert.alert).toHaveBeenCalledWith(
      'Permission requise',
      "L'accès à la galerie est nécessaire"
    );
  });

  it('handleSave success: PUT then AsyncStorage + alert + navigation', async () => {
    const { getByText } = render(<ProfileSettingsScreen />);
    await waitFor(() => {}); // initial load

    await act(async () => {
      fireEvent.press(getByText('Enregistrer'));
    });

    expect(fetch).toHaveBeenCalledWith(
      `${apiConfig.baseURL}/api/users/${fakeUser._id}`,
      expect.objectContaining({
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: fakeUser.username,
          email: fakeUser.email,
          firstname: fakeUser.firstname,
          lastname: fakeUser.lastname,
          phoneNumber: fakeUser.phoneNumber,
          bio: fakeUser.bio,
          avatar: fakeUser.avatar,
        }),
      })
    );

    await waitFor(() => {
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'user',
        JSON.stringify({ ...fakeUser, username: 'newuser' })
      );
      expect(Alert.alert).toHaveBeenCalledWith('Succès', 'Profil mis à jour');
      expect(replaceMock).toHaveBeenCalledWith('/(tabs)/profile');
    });
  });

  it('handleSave failure: shows error alert', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'Bad request' }),
    });

    const { getByText } = render(<ProfileSettingsScreen />);
    await waitFor(() => {});

    await act(async () => {
      fireEvent.press(getByText('Enregistrer'));
    });

    expect(Alert.alert).toHaveBeenCalledWith('Erreur', 'Bad request');
  });
});
