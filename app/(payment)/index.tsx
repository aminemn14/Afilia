import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from 'react';
import {
  Dimensions,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Image,
  ScrollView,
  Keyboard,
  Alert,
} from 'react-native';
import Colors from '../constants/Colors';
import cardBackgrounds from '../constants/CardBackgrounds';

export default function PaymentScreen(): JSX.Element {
  const windowWidth = Dimensions.get('window').width;
  const CARD_WIDTH = windowWidth * 0.9;
  const CARD_HEIGHT = CARD_WIDTH / 1.59;

  const [currentCardBackground] = useState(Math.floor(Math.random() * 25 + 1));
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardMonth, setCardMonth] = useState('');
  const [cardYear, setCardYear] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [isCardFlipped, setIsCardFlipped] = useState(false);

  // Animated values pour chaque input
  const cardNumberAnim = useRef(new Animated.Value(0)).current;
  const cardNameAnim = useRef(new Animated.Value(0)).current;
  const cardMonthAnim = useRef(new Animated.Value(0)).current;
  const cardYearAnim = useRef(new Animated.Value(0)).current;
  const cardCvvAnim = useRef(new Animated.Value(0)).current;

  // Animation pour le flip de la carte
  const flipAnim = useRef(new Animated.Value(0)).current;
  const flipCard = (status: boolean) => {
    setIsCardFlipped(status);
    Animated.timing(flipAnim, {
      toValue: status ? 1 : 0,
      duration: 800,
      useNativeDriver: true,
    }).start();
  };

  const animateFocus = (anim: Animated.Value, toValue: number) => {
    Animated.timing(anim, {
      toValue,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  // Interpolations pour chaque champ
  const getBorderColor = (anim: Animated.Value) =>
    anim.interpolate({
      inputRange: [0, 1],
      outputRange: [Colors.gray300, Colors.accent],
    });

  const getShadowOpacity = (anim: Animated.Value) =>
    anim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 0.8],
    });

  const minCardYear = new Date().getFullYear();

  const minCardMonth = useMemo(() => {
    if (parseInt(cardYear) === minCardYear % 100) {
      return new Date().getMonth() + 1;
    }
    return 1;
  }, [cardYear]);

  useEffect(() => {
    if (cardMonth && parseInt(cardMonth) < minCardMonth) {
      setCardMonth('');
    }
  }, [cardYear]);

  const frontInterpolate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });
  const backInterpolate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'],
  });

  // Affichage du numéro de carte sur la carte
  const renderCardNumber = () => {
    // Supprime les espaces pour obtenir exactement les chiffres saisis
    const cleanedNumber = cardNumber.replace(/\s/g, '');
    const paddedNumber = cleanedNumber.padEnd(16, '•');
    let masked = '';
    for (let i = 0; i < 16; i++) {
      if (i < 4) {
        // Les 4 premiers chiffres s'affichent normalement
        masked += paddedNumber[i];
      } else if (i >= 4 && i < 12) {
        // Les chiffres du milieu sont masqués
        masked += paddedNumber[i] === '•' ? '•' : '*';
      } else {
        // Les 4 derniers chiffres s'affichent normalement
        masked += paddedNumber[i];
      }
      // Insère un espace toutes les 4 positions, sauf après le dernier groupe
      if ((i + 1) % 4 === 0 && i < 15) {
        masked += ' ';
      }
    }
    return masked;
  };

  // Formatage du numéro de carte dans l'input
  const handleCardNumberChange = (text: string) => {
    const cleaned = text.replace(/\s/g, '');
    const maxLength = 16;
    if (/^\d*$/.test(cleaned) && cleaned.length <= maxLength) {
      const formatted = cleaned.replace(/(.{4})/g, '$1 ').trim();
      setCardNumber(formatted);
    }
  };

  const keyboardOffset = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const showEvent =
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent =
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const keyboardShowListener = Keyboard.addListener(showEvent, (event) => {
      const offset = event.endCoordinates.height;
      Animated.timing(keyboardOffset, {
        toValue: -offset,
        duration: event.duration || 250,
        useNativeDriver: true,
      }).start();
    });
    const keyboardHideListener = Keyboard.addListener(hideEvent, (event) => {
      Animated.timing(keyboardOffset, {
        toValue: 0,
        duration: event.duration || 250,
        useNativeDriver: true,
      }).start();
    });

    return () => {
      keyboardShowListener.remove();
      keyboardHideListener.remove();
    };
  }, [keyboardOffset]);

  // Fonction de validation du formulaire
  const handleValidation = useCallback(() => {
    if (!cardName || !cardNumber || !cardMonth || !cardYear || !cardCvv) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }
    const currentYear = new Date().getFullYear();
    const currentYearTwoDigit = currentYear % 100;
    const inputYear = parseInt(cardYear, 10);
    const inputMonth = parseInt(cardMonth, 10);
    if (isNaN(inputYear) || isNaN(inputMonth)) {
      Alert.alert('Erreur', "La date d'expiration est invalide");
      return;
    }
    if (inputMonth < 1 || inputMonth > 12) {
      Alert.alert('Erreur', 'Le mois doit être compris entre 1 et 12');
      return;
    }
    if (inputYear < currentYearTwoDigit) {
      Alert.alert('Erreur', 'La carte est expirée');
      return;
    }
    if (
      inputYear === currentYearTwoDigit &&
      inputMonth < new Date().getMonth() + 1
    ) {
      Alert.alert('Erreur', "Le mois d'expiration est invalide");
      return;
    }
    if (cardNumber.replace(/\s/g, '').length !== 16) {
      Alert.alert('Erreur', 'Le numéro de carte doit contenir 16 chiffres');
      return;
    }
    if (cardCvv.length !== 3) {
      Alert.alert('Erreur', 'Le CVV doit contenir 3 chiffres');
      return;
    }
    Alert.alert('Succès', 'Paiement effectué');
  }, [cardName, cardNumber, cardMonth, cardYear, cardCvv]);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.container}>
          <View
            style={[
              styles.cardContainer,
              { width: CARD_WIDTH, height: CARD_HEIGHT },
            ]}
          >
            <Animated.View
              style={[
                styles.card,
                {
                  width: CARD_WIDTH,
                  height: CARD_HEIGHT,
                  transform: [
                    { perspective: 1000 },
                    { rotateY: frontInterpolate },
                  ],
                },
              ]}
            >
              <Image
                source={cardBackgrounds[currentCardBackground]}
                style={[
                  styles.cardBg,
                  { width: CARD_WIDTH, height: CARD_HEIGHT },
                ]}
              />
              <View style={styles.overlay} />
              <View style={styles.cardContent}>
                <View style={styles.cardTop}>
                  <Image
                    source={require('@/assets/images/chip.png')}
                    style={styles.chip}
                  />
                  <Image
                    source={require('@/assets/images/visa.png')}
                    style={styles.cardType}
                  />
                </View>
                <Text style={styles.cardNumber}>{renderCardNumber()}</Text>
                <View style={styles.cardBottom}>
                  <View>
                    <Text style={styles.label}>Titulaire</Text>
                    <Text style={styles.cardHolder}>
                      {cardName || 'Nom complet'}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.label}>EXP</Text>
                    <Text style={styles.expiry}>
                      {cardMonth || 'MM'}/
                      {cardYear ? String(cardYear).slice(-2) : 'AA'}
                    </Text>
                  </View>
                </View>
              </View>
            </Animated.View>

            <Animated.View
              style={[
                styles.card,
                styles.cardBack,
                {
                  width: CARD_WIDTH,
                  height: CARD_HEIGHT,
                  transform: [
                    { perspective: 1000 },
                    { rotateY: backInterpolate },
                  ],
                },
              ]}
            >
              <Image
                source={cardBackgrounds[currentCardBackground]}
                style={[
                  styles.cardBg,
                  { width: CARD_WIDTH, height: CARD_HEIGHT },
                ]}
              />
              <View style={styles.overlay} />
              <View style={styles.cardBackContent}>
                <View style={styles.strip} />
                <View style={styles.cvvContainer}>
                  <Text style={styles.cvvLabel}>CVV</Text>
                  <View style={styles.cvvBox}>
                    <Text style={styles.cvvText}>
                      {(cardCvv || '').padEnd(3, '*')}
                    </Text>
                  </View>
                  <Image
                    source={require('@/assets/images/visa.png')}
                    style={styles.cardTypeBack}
                  />
                </View>
              </View>
            </Animated.View>
          </View>

          <View style={styles.form}>
            {/* Numéro de carte */}
            <Text style={styles.inputLabel}>Numéro de carte</Text>
            <Animated.View
              style={[
                styles.inputContainer,
                {
                  borderColor: getBorderColor(cardNumberAnim),
                  shadowColor: Colors.accent,
                  shadowOpacity: getShadowOpacity(cardNumberAnim),
                },
              ]}
            >
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={cardNumber}
                onChangeText={handleCardNumberChange}
                onFocus={() => animateFocus(cardNumberAnim, 1)}
                onBlur={() => animateFocus(cardNumberAnim, 0)}
                placeholder="Numéro de carte"
                placeholderTextColor={Colors.gray600}
                autoComplete="cc-number"
                accessible={true}
                accessibilityLabel="Numéro de carte de crédit"
              />
            </Animated.View>

            {/* Titulaire */}
            <Text style={styles.inputLabel}>Titulaire</Text>
            <Animated.View
              style={[
                styles.inputContainer,
                {
                  borderColor: getBorderColor(cardNameAnim),
                  shadowColor: Colors.accent,
                  shadowOpacity: getShadowOpacity(cardNameAnim),
                },
              ]}
            >
              <TextInput
                style={styles.input}
                value={cardName}
                onChangeText={(text) => {
                  const capitalizedText = text
                    .toLowerCase()
                    .split(' ')
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ');
                  setCardName(capitalizedText);
                }}
                onFocus={() => animateFocus(cardNameAnim, 1)}
                onBlur={() => animateFocus(cardNameAnim, 0)}
                placeholder="Nom complet"
                placeholderTextColor={Colors.gray600}
                autoComplete="name"
                maxLength={30}
              />
            </Animated.View>

            <View style={styles.row}>
              {/* Mois */}
              <View style={[styles.column, { flex: 2 }]}>
                <Text style={styles.inputLabel}>Mois</Text>
                <Animated.View
                  style={[
                    styles.inputContainer,
                    {
                      borderColor: getBorderColor(cardMonthAnim),
                      shadowColor: Colors.accent,
                      shadowOpacity: getShadowOpacity(cardMonthAnim),
                    },
                  ]}
                >
                  <TextInput
                    style={styles.input}
                    value={cardMonth}
                    onChangeText={setCardMonth}
                    onFocus={() => animateFocus(cardMonthAnim, 1)}
                    onBlur={() => animateFocus(cardMonthAnim, 0)}
                    placeholder="MM"
                    keyboardType="numeric"
                    placeholderTextColor={Colors.gray600}
                    maxLength={2}
                  />
                </Animated.View>
              </View>
              {/* Année */}
              <View style={[styles.column, { flex: 2 }]}>
                <Text style={styles.inputLabel}>Année</Text>
                <Animated.View
                  style={[
                    styles.inputContainer,
                    {
                      borderColor: getBorderColor(cardYearAnim),
                      shadowColor: Colors.accent,
                      shadowOpacity: getShadowOpacity(cardYearAnim),
                    },
                  ]}
                >
                  <TextInput
                    style={styles.input}
                    value={cardYear}
                    onChangeText={setCardYear}
                    onFocus={() => animateFocus(cardYearAnim, 1)}
                    onBlur={() => animateFocus(cardYearAnim, 0)}
                    placeholder="AA"
                    keyboardType="numeric"
                    placeholderTextColor={Colors.gray600}
                    maxLength={2}
                  />
                </Animated.View>
              </View>
              {/* CVV */}
              <View style={[styles.column, { flex: 1 }]}>
                <Text style={styles.inputLabel}>CVV</Text>
                <Animated.View
                  style={[
                    styles.inputContainer,
                    {
                      borderColor: getBorderColor(cardCvvAnim),
                      shadowColor: Colors.accent,
                      shadowOpacity: getShadowOpacity(cardCvvAnim),
                    },
                  ]}
                >
                  <TextInput
                    style={styles.input}
                    value={cardCvv}
                    onChangeText={setCardCvv}
                    onFocus={() => {
                      animateFocus(cardCvvAnim, 1);
                      flipCard(true);
                    }}
                    onBlur={() => {
                      animateFocus(cardCvvAnim, 0);
                      flipCard(false);
                    }}
                    placeholder="CVV"
                    keyboardType="numeric"
                    placeholderTextColor={Colors.gray600}
                    maxLength={3}
                  />
                </Animated.View>
              </View>
            </View>

            <TouchableOpacity style={styles.button} onPress={handleValidation}>
              <Text style={styles.buttonText}>Payer</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  cardContainer: {
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    borderRadius: 15,
    backfaceVisibility: 'hidden',
    position: 'absolute',
  },
  cardBack: {
    top: 0,
  },
  cardBg: {
    borderRadius: 15,
    position: 'absolute',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(6, 2, 29, 0.45)',
    borderRadius: 15,
  },
  cardContent: {
    flex: 1,
    padding: 15,
    justifyContent: 'space-between',
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  chip: {
    width: 60,
    height: 40,
    resizeMode: 'contain',
  },
  cardType: {
    width: 80,
    height: 40,
    resizeMode: 'contain',
  },
  cardNumber: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '500',
    letterSpacing: 2,
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    color: '#fff',
    fontSize: 13,
    opacity: 0.7,
  },
  cardHolder: {
    color: '#fff',
    fontSize: 14,
    textTransform: 'uppercase',
  },
  expiry: {
    color: '#fff',
    fontSize: 14,
  },
  cardBackContent: {
    flex: 1,
    padding: 15,
    justifyContent: 'flex-start',
  },
  strip: {
    backgroundColor: '#000',
    height: 50,
    marginTop: 30,
    borderRadius: 5,
  },
  cvvContainer: {
    marginTop: 20,
    alignItems: 'flex-end',
  },
  cvvLabel: {
    color: '#fff',
    fontSize: 15,
    marginBottom: 5,
  },
  cvvBox: {
    backgroundColor: '#fff',
    borderRadius: 4,
    padding: 5,
    minWidth: 100,
    alignItems: 'flex-end',
  },
  cvvText: {
    color: Colors.text,
    fontSize: 18,
  },
  cardTypeBack: {
    width: 80,
    height: 40,
    resizeMode: 'contain',
    marginTop: 10,
  },
  form: {
    width: '100%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    shadowColor: Colors.gray500,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 5,
  },
  inputLabel: {
    fontSize: 14,
    color: Colors.gray500,
    marginBottom: 5,
  },
  inputContainer: {
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 20,
    // Valeurs par défaut pour l'état "non focus"
    borderColor: Colors.gray300,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  input: {
    height: 50,
    paddingHorizontal: 15,
    fontSize: 18,
    color: Colors.text,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  column: {
    marginRight: 10,
  },
  button: {
    backgroundColor: Colors.accent,
    height: 55,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '500',
  },
});
