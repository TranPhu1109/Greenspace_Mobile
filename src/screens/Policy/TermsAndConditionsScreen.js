import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const TermsAndConditionsScreen = () => {
  return (
    <View style={styles.container}>
      <Text>Terms and Conditions</Text>
    </View>
  );
};

export default TermsAndConditionsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
