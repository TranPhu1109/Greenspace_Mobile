import React from 'react';
import {
  View,
  StyleSheet,
  Modal as RNModal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

const Modal = ({
  visible,
  onClose,
  children,
  animationType = 'fade',
  width = SCREEN_WIDTH * 0.85,
  height = 'auto',
  showCloseButton = true,
}) => {
  const handleBackdropPress = () => {
    onClose();
  };

  return (
    <RNModal
      transparent
      visible={visible}
      animationType={animationType}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={handleBackdropPress}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View style={[
              styles.content,
              { 
                width,
                ...(height !== 'auto' && { height })
              }
            ]}>
              {showCloseButton && (
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={onClose}
                >
                  <Icon name="close" size={24} color="#333" />
                </TouchableOpacity>
              )}
              <View style={styles.childrenContainer}>
                {children}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </RNModal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    position: 'relative',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  closeButton: {
    position: 'absolute',
    right: 15,
    top: 15,
    zIndex: 1,
    padding: 5,
  },
  childrenContainer: {
    marginTop: 20,
  },
});

export default Modal;
