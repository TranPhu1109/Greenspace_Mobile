import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';

const DesignIdeaLibraryScreen = ({ navigation }) => {
  const designIdeas = [
    {
      id: '1',
      title: 'Modern Living Room',
      image: require('../assets/images/default_image.jpg'),
      category: 'Living Room'
    },
    {
      id: '2', 
      title: 'Minimalist Kitchen',
      image: require('../assets/images/default_image.jpg'),
      category: 'Kitchen'
    },
    {
      id: '3',
      title: 'Cozy Bedroom',
      image: require('../assets/images/default_image.jpg'),
      category: 'Bedroom'
    },
    {
      id: '4',
      title: 'Elegant Dining Room',
      image: require('../assets/images/default_image.jpg'),
      category: 'Dining Room'
    }
  ];

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.itemContainer}
      onPress={() => navigation.navigate('DesignDetail', { designId: item.id })}
    >
      <Image
        source={item.image}
        style={styles.image}
      />
      <View style={styles.textContainer}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.category}>{item.category}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={designIdeas}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        numColumns={2}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  listContainer: {
    padding: 8,
  },
  itemContainer: {
    flex: 1,
    margin: 8,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  image: {
    width: '100%',
    height: 150,
    resizeMode: 'cover',
  },
  textContainer: {
    padding: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  category: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
});

export default DesignIdeaLibraryScreen;
