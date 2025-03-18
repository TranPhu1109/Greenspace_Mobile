import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const DesignScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Design Screen</Text>
      <Text style={styles.text}>App design and preferences</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  text: {
    fontSize: 16,
    color: '#666',
  },
});

export default DesignScreen; 