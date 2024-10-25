import React from 'react';
import { View, Text, StyleSheet, Pressable, Modal, Platform } from 'react-native';

interface ModalRefinarProps {
  isVisible: boolean;
  onClose: () => void;
  onStart: () => void;
  gender: string;
  setGender: (gender: string) => void;
  items: string;
  setItems: (items: string) => void;
}

const ModalRefinar: React.FC<ModalRefinarProps> = ({ 
  isVisible, 
  onClose, 
  onStart, 
  gender, 
  setGender, 
  items, 
  setItems 
}) => {

  const itemsMap = new Map<string, number>([
    ['Rápida', 50],
    ['Básica', 100],
    ['Completa', 200],
  ]);

  const handleSetItems = (option: string) => {
    const value = itemsMap.get(option);
    if (value !== undefined) {
      setItems(value.toString());
    }
  }

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.modalView}>
          <Text style={styles.modalTitle}>Cuéntanos más para recomendarte mejor</Text>
          <Text style={styles.modalText}>¿Qué tipo de ropa quieres que te recomiende?</Text>
          <View style={styles.optionsContainer}>
            <Pressable
              style={[styles.optionButton, gender === 'woman' && styles.optionButtonSelected]}
              onPress={() => setGender('woman')}
            >
              <Text style={styles.optionText}>Mujer</Text>
            </Pressable>
            <Pressable
              style={[styles.optionButton, gender === 'men' && styles.optionButtonSelected]}
              onPress={() => setGender('men')}
            >
              <Text style={styles.optionText}>Hombre</Text>
            </Pressable>
          </View>

          <Text style={styles.modalText}>Elige el tipo de recomendación</Text>
          <View style={styles.optionsContainer}>
          {[...itemsMap.keys()].map((option) => (
              <Pressable
                key={option}
                style={[styles.optionButton, items === itemsMap.get(option)?.toString() && styles.optionButtonSelected]}
                onPress={() => handleSetItems(option)} // Guarda el número de ítems
              >
                <Text style={styles.optionText}>{option}</Text>
              </Pressable>
            ))}
          </View>

          <Pressable style={styles.startButton} onPress={onStart}>
            <Text style={styles.startButtonText}>Empezar</Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    width: Platform.OS == 'web' ? '50%' : '90%',
    //maxWidth: 400,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    //alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalText: {
    fontSize: 18,
    marginBottom: 10,
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    width: '100%',
  },
  optionButton: {
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    margin: 5,
  },
  optionButtonSelected: {
    backgroundColor: '#d3d3d3',
  },
  optionText: {
    fontSize: 16,
  },
  startButton: {
    backgroundColor: 'black',
    borderRadius: 20,
    padding: 10,
    alignItems: 'center',
    alignSelf: 'center', 
    //width: '100%',
  },
  startButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
    textAlign: 'center', 
    lineHeight: 30,
  },
});

export default ModalRefinar;
