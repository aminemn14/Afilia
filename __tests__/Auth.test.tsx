import React from 'react';
import { act, render, fireEvent, waitFor } from '@testing-library/react-native';
import LoginScreen from '../app/(auth)/login';
import SignUpScreen from '../app/(auth)/signup';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

// ——— MOCKS ———
jest.mock('@/config/apiConfig', () => ({ baseURL: 'https://mock' }));
jest.spyOn(Alert, 'alert').mockImplementation(() => {});
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
}));
jest.mock('expo-router', () => ({
  __esModule: true,
  router: {
    replace: jest.fn(),
    push: jest.fn(),
    back: jest.fn(),
  },
}));
(global as any).fetch = jest.fn();

// ——— IMPORTS ———
const { router } = require('expo-router') as {
  router: { replace: jest.Mock; push: jest.Mock; back: jest.Mock };
};

// helper pour remplir SignUp
const fillAllRequired = (h: ReturnType<typeof render>) => {
  fireEvent.changeText(
    h.getByPlaceholderText("Choisir un nom d'utilisateur"),
    'userx'
  );
  fireEvent.changeText(h.getByPlaceholderText('Entrer votre email'), 'u@x.y');
  fireEvent.changeText(h.getByPlaceholderText('Entrer votre prénom'), 'Jean');
  fireEvent.changeText(h.getByPlaceholderText('Entrer votre nom'), 'Dupont');
  fireEvent.press(h.getByText('Homme'));
  fireEvent.changeText(
    h.getByPlaceholderText('Entrer votre numéro de téléphone'),
    '0123456789'
  );
};

describe('AuthScreens', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    router.replace.mockClear();
    router.push.mockClear();
    router.back.mockClear();
  });

  describe('LoginScreen', () => {
    it('succès de connexion stocke token+user et navigue', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ token: 't', user: { id: 'u' } }),
      });

      const { getByPlaceholderText, getByText } = render(<LoginScreen />);
      fireEvent.changeText(getByPlaceholderText('Entrer votre email'), 'a@b.c');
      fireEvent.changeText(
        getByPlaceholderText('Entrer votre mot de passe'),
        'pwd12345'
      );

      await act(async () => {
        fireEvent.press(getByText('Connexion'));
        // on attend le microtask flush
        await Promise.resolve();
      });

      expect(AsyncStorage.setItem).toHaveBeenCalledWith('token', 't');
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'user',
        JSON.stringify({ id: 'u' })
      );
      expect(router.replace).toHaveBeenCalledWith('/(tabs)');
    });

    it('échec de connexion affiche l’alerte avec le message retourné', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Bad creds' }),
      });

      const { getByPlaceholderText, getByText } = render(<LoginScreen />);
      fireEvent.changeText(getByPlaceholderText('Entrer votre email'), 'x@y.z');
      fireEvent.changeText(
        getByPlaceholderText('Entrer votre mot de passe'),
        'wrong'
      );

      await act(async () => {
        fireEvent.press(getByText('Connexion'));
        await Promise.resolve();
      });

      expect(Alert.alert).toHaveBeenCalledWith('Erreur', 'Bad creds');
      expect(router.replace).not.toHaveBeenCalled();
    });

    it("appuie sur 'S'inscrire' pousse vers signup", () => {
      const { getByText } = render(<LoginScreen />);
      fireEvent.press(getByText("S'inscrire"));
      expect(router.push).toHaveBeenCalledWith('/signup');
    });

    it('appuie sur back déclenche router.back()', () => {
      const { getByTestId } = render(<LoginScreen />);
      // on ajoute un testID dans le backButton pour le repérer
      fireEvent.press(getByTestId('back-button'));
      expect(router.back).toHaveBeenCalled();
    });
  });

  describe('SignUpScreen', () => {
    it('back-button appelle router.back()', () => {
      const { getByTestId } = render(<SignUpScreen />);
      fireEvent.press(getByTestId('back-button'));
      expect(router.back).toHaveBeenCalled();
    });

    it('succès d’inscription navigue vers login', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 'new' }),
      });

      const h = render(<SignUpScreen />);
      fillAllRequired(h);
      fireEvent.changeText(
        h.getByPlaceholderText('Créer un mot de passe'),
        'password1'
      );
      fireEvent.changeText(
        h.getByPlaceholderText('Confirmer votre mot de passe'),
        'password1'
      );

      await act(async () => {
        fireEvent.press(h.getAllByText('Créer un compte').pop()!);
        await Promise.resolve();
      });

      expect(router.replace).toHaveBeenCalledWith('/login');
    });
  });
});
