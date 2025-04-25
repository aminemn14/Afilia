import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import axios from 'axios';
import { Alert } from 'react-native';
import apiConfig from '@/config/apiConfig';
import CreateEventScreen from '../app/(admin)/addEvent';
import CreateLocationScreen from '../app/(admin)/addLocation';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.spyOn(Alert, 'alert').mockImplementation(() => {});

describe('CreateEventScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('récupère les lieux via axios.get et gère l’erreur', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('fail'));
    render(<CreateEventScreen />);
    await waitFor(() =>
      expect(Alert.alert).toHaveBeenCalledWith(
        'Erreur',
        'Impossible de récupérer les lieux.'
      )
    );
  });

  it('alerte si un champ obligatoire est vide', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: [{ _id: 'loc1', name: 'L1', event_types: ['concert'] }],
    });
    const { getByText } = render(<CreateEventScreen />);
    await waitFor(() => expect(mockedAxios.get).toHaveBeenCalled());

    await act(async () => {
      fireEvent.press(getByText("Créer l'événement"));
    });

    expect(Alert.alert).toHaveBeenCalledWith(
      'Erreur',
      'Veuillez remplir tous les champs obligatoires.'
    );
  });

  it('sur succès poste les données correctement et navigue', async () => {
    const lieux = [{ _id: 'loc1', name: 'L1', event_types: ['concert'] }];
    mockedAxios.get.mockResolvedValueOnce({ data: lieux });
    mockedAxios.post.mockResolvedValueOnce({ data: { id: 'e1' } });

    const { getByPlaceholderText, getByText, getByTestId } = render(
      <CreateEventScreen />
    );
    await waitFor(() => expect(mockedAxios.get).toHaveBeenCalled());

    // Remplissage du formulaire
    fireEvent.changeText(getByPlaceholderText("Nom de l'événement"), 'Evt1');
    fireEvent.press(getByText('Concert'));
    fireEvent.changeText(getByPlaceholderText('Exemple : 100'), '50');

    // Sélection du lieu via testID
    const pickerInput = getByTestId('text_input');
    await act(async () => {
      fireEvent(pickerInput, 'onValueChange', 'loc1');
    });

    fireEvent.press(getByText('Non')); // is_free = false
    fireEvent.changeText(getByPlaceholderText('Entrez le prix'), '12.5');
    fireEvent.changeText(getByPlaceholderText("Nom de l'organisateur"), 'Org');
    fireEvent.changeText(getByPlaceholderText('Téléphone'), '0123');
    fireEvent.changeText(getByPlaceholderText('Email'), 'a@b.c');
    fireEvent.changeText(
      getByPlaceholderText("Description de l'événement"),
      'Desc'
    );

    await act(async () => {
      fireEvent.press(getByText("Créer l'événement"));
    });

    expect(mockedAxios.post).toHaveBeenCalledWith(
      `${apiConfig.baseURL}/api/events`,
      expect.objectContaining({
        name: 'Evt1',
        event_type: 'concert',
        max_participants: 50,
        location_id: 'loc1',
        price: 12.5,
        is_free: false,
        organizer: 'Org',
        tel: '0123',
        email: 'a@b.c',
        description: 'Desc',
      })
    );
    expect(Alert.alert).toHaveBeenCalledWith(
      'Succès',
      "L'événement a été créé avec succès"
    );
    expect(mockPush).toHaveBeenCalledWith('/(tabs)');
  });
});

describe('CreateLocationScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('toggle des chips d’événement fonctionne', () => {
    const { getByText } = render(<CreateLocationScreen />);
    const chip = getByText('Théâtre');
    // avant clic, non sélectionné
    const styleBefore = chip.props.style;
    fireEvent.press(chip);
    const styleAfter = chip.props.style;
    expect(styleAfter).not.toEqual(styleBefore);
  });

  it('sur succès poste les données et navigue', async () => {
    mockedAxios.post.mockResolvedValueOnce({ data: { id: 'loc1' } });

    const { getByPlaceholderText, getByText } = render(
      <CreateLocationScreen />
    );

    fireEvent.changeText(getByPlaceholderText('Nom du lieu'), 'L1');
    fireEvent.changeText(getByPlaceholderText('Latitude'), '48.8');
    fireEvent.changeText(getByPlaceholderText('Longitude'), '2.3');
    fireEvent.changeText(getByPlaceholderText('Adresse'), 'Adr');
    fireEvent.changeText(getByPlaceholderText('Ville'), 'Paris');
    fireEvent.changeText(getByPlaceholderText('Code postal'), '75000');
    fireEvent.press(getByText('Chorale'));
    fireEvent.changeText(getByPlaceholderText('Description du lieu'), 'Desc');
    fireEvent.changeText(getByPlaceholderText('Téléphone'), '0123');
    fireEvent.changeText(getByPlaceholderText('Email'), 'x@y.z');

    await act(async () => {
      fireEvent.press(getByText('Créer le lieu'));
    });

    expect(mockedAxios.post).toHaveBeenCalledWith(
      `${apiConfig.baseURL}/api/locations`,
      expect.objectContaining({
        name: 'L1',
        latitude: 48.8,
        longitude: 2.3,
        address: 'Adr',
        city: 'Paris',
        zipcode: '75000',
        event_types: ['chorale'],
        description: 'Desc',
        tel: '0123',
        email: 'x@y.z',
      })
    );
    expect(Alert.alert).toHaveBeenCalledWith(
      'Succès',
      'Le lieu a été créé avec succès'
    );
    expect(mockPush).toHaveBeenCalledWith('/(tabs)');
  });

  it('sur erreur POST affiche une alerte', async () => {
    mockedAxios.post.mockRejectedValueOnce(new Error('fail'));
    const { getByText } = render(<CreateLocationScreen />);

    await act(async () => {
      fireEvent.press(getByText('Créer le lieu'));
    });

    expect(Alert.alert).toHaveBeenCalledWith(
      'Erreur',
      'Une erreur est survenue lors de la création du lieu'
    );
  });
});
