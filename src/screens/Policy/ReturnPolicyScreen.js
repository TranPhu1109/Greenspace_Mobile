import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const ReturnPolicyScreen = () => {
  return (
    <View style={styles.container}>
      <Text>Return Policy</Text>
    </View>
  );
};

export default ReturnPolicyScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
