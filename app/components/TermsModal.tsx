import React, { useState } from 'react';
import {
  Modal,
  Animated,
  Dimensions,
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import Colors from '../constants/Colors';

const { height } = Dimensions.get('window');

export interface TermsModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function TermsModal({ visible, onClose }: TermsModalProps) {
  const [slideAnim] = useState(new Animated.Value(height));

  React.useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: height * 0.2,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: height,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      statusBarTranslucent
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <Animated.View
          style={[
            styles.modalContent,
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          <ScrollView contentContainerStyle={styles.modalScroll}>
            <Text style={styles.modalTitle}>Conditions d'utilisation</Text>

            <Text style={styles.sectionTitle}>
              1. Acceptation des conditions
            </Text>
            <Text style={styles.paragraph}>
              En utilisant Afilia, vous acceptez ces conditions générales
              d'utilisation.
            </Text>

            <Text style={styles.sectionTitle}>2. Contenu inapproprié</Text>
            <Text style={styles.paragraph}>
              Politique de tolérance zéro pour les contenus offensants, haineux,
              violents ou illégaux.
            </Text>

            <Text style={styles.sectionTitle}>3. Comportement abusif</Text>
            <Text style={styles.paragraph}>
              Harcèlement, menaces ou tout comportement abusif sont interdits.
              Vous pouvez signaler ou bloquer les utilisateurs abusifs.
            </Text>

            <Text style={styles.sectionTitle}>4. Modifications</Text>
            <Text style={styles.paragraph}>
              Nous pouvons modifier ces conditions à tout moment. Les mises à
              jour seront affichées ici.
            </Text>

            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>Fermer</Text>
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalContent: {
    height: height * 0.8,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
  },
  modalScroll: {
    padding: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    color: Colors.text,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 6,
    color: Colors.text,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'justify',
    color: Colors.gray700,
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: Colors.primary,
    borderRadius: 28,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
