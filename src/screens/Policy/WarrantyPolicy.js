import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const WarrantyPolicyScreen = () => {
  return (
    <View style={styles.container}>
      <Text>Warranty Policy</Text>
    </View>
  );
};

export default WarrantyPolicyScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
