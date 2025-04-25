import React from 'react';
import { act, render, waitFor, fireEvent } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiConfig from '@/config/apiConfig';

// ─── MOCKS ────────────────────────────────────────────────────────────
// 1) react-navigation/native
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: jest.fn() }),
  useRoute: () => ({
    params: {
      conversationId: 'conv1',
      friend: JSON.stringify({ id: 'f1', name: 'Alice', avatar: null }),
    },
  }),
}));

// 2) expo-router
jest.mock('expo-router', () => {
  return {
    __esModule: true,
    router: {
      push: jest.fn(),
    },
  };
});

// 3) AsyncStorage.getItem
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
}));

// 4) useSocket
let socketHandlers: Record<string, Function> = {};
const mockSocket = {
  current: {
    on: (evt: string, fn: Function) => {
      socketHandlers[evt] = fn;
    },
    off: jest.fn(),
    emit: jest.fn(),
  },
};
jest.mock('../app/hooks/useSocket', () => () => mockSocket);

// 5) global.fetch
global.fetch = jest.fn();

// ─── IMPORT APRÈS LES MOCKS ────────────────────────────────────────────
import ChatConversation from '../app/(chat)/conversation/[id]';
const { router } = require('expo-router'); // on récupère le mocké

describe('ChatConversation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    socketHandlers = {};
    // Simule un user "u1" dans AsyncStorage
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
      JSON.stringify({ id: 'u1' })
    );
  });

  it('charge et affiche les messages initiaux depuis l’API', async () => {
    const apiData = [
      {
        _id: 'm1',
        content: 'Hello',
        sender_id: 'f1',
        created_at: '2025-01-01T10:00:00Z',
      },
      {
        _id: 'm2',
        content: 'Hi',
        sender_id: 'u1',
        created_at: '2025-01-01T10:01:00Z',
      },
    ];
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(apiData),
    });

    const { getByText, queryByText } = render(<ChatConversation />);

    // Avant fetch : state vide
    expect(getByText('Démarrer la conversation')).toBeTruthy();

    // Après fetch : on affiche "Hello" puis "Hi"
    await waitFor(() => {
      expect(queryByText('Démarrer la conversation')).toBeNull();
      expect(getByText('Hello')).toBeTruthy();
      expect(getByText('Hi')).toBeTruthy();
    });
  });

  it('réagit aux nouveaux messages via socket', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    });
    const { getByText, queryByText } = render(<ChatConversation />);
    await waitFor(() =>
      expect(queryByText('Démarrer la conversation')).toBeTruthy()
    );

    act(() => {
      socketHandlers['newMessage']!({
        _id: 'm3',
        content: 'Yo!',
        sender_id: 'f1',
        created_at: '2025-01-01T11:00:00Z',
      });
    });

    expect(getByText('Yo!')).toBeTruthy();
  });

  it('envoie un message : optimiste + socket.emit + POST API', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    });

    const { getByPlaceholderText, getByTestId, getByText } = render(
      <ChatConversation />
    );
    await waitFor(() => {}); // attend la récupération du user

    fireEvent.changeText(
      getByPlaceholderText('Votre message...'),
      'Salut Alice'
    );
    fireEvent.press(getByTestId('send-button'));

    // 1) UI optimiste
    expect(getByText('Salut Alice')).toBeTruthy();
    expect(getByPlaceholderText('Votre message...').props.value).toBe('');

    // 2) socket.emit
    expect(mockSocket.current.emit).toHaveBeenCalledWith('sendMessage', {
      conversationId: 'conv1',
      content: 'Salut Alice',
      sender_id: 'u1',
      receiver_id: 'f1',
    });

    // 3) POST API
    expect(fetch).toHaveBeenLastCalledWith(
      `${apiConfig.baseURL}/api/messages/`,
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: 'conv1',
          sender_id: 'u1',
          receiver_id: 'f1',
          content: 'Salut Alice',
        }),
      })
    );
  });

  it('back-button nève plante pas sur press', () => {
    const { getByTestId } = render(<ChatConversation />);
    fireEvent.press(getByTestId('back-button'));
    // pas d’erreur : OK
  });

  it('appuie sur profile-header déclenche router.push()', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    });
    const { getByTestId } = render(<ChatConversation />);
    // on s’assure que les useEffect sont partis
    await act(async () => void 0);

    fireEvent.press(getByTestId('profile-header'));
    expect(router.push).toHaveBeenCalledWith({
      pathname: '/(friends)/userProfile',
      params: { friendId: 'f1' },
    });
  });
});
