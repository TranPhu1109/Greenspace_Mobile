// src/screens/HomeScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Dimensions, Animated } from 'react-native';
import SearchHeader from '../components/SearchHeader';

const HomeScreen = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const slideAnimation = new Animated.Value(0);

  const images = [
    require('../assets/images/image1.jpg'),
    require('../assets/images/image2.jpg'),
    require('../assets/images/image3.jpg'), 
    require('../assets/images/image4.jpg'),
    require('../assets/images/image5.jpg')

  ];

  useEffect(() => {
    const slideTimer = setInterval(() => {
      slideAnimation.setValue(0);
      
      Animated.timing(slideAnimation, {
        toValue: -Dimensions.get('window').width,
        duration: 300,
        useNativeDriver: true
      }).start(() => {
        setCurrentIndex((prevIndex) => 
          prevIndex === images.length - 1 ? 0 : prevIndex + 1
        );
      });
    }, 3000);

    return () => clearInterval(slideTimer);
  }, []);

  return (
    <View style={styles.container}>
      <SearchHeader title="Home" />
      <ScrollView style={styles.content} removeClippedSubviews={false}>
        <View style={styles.slideContainer}>
          <Animated.Image
            source={images[currentIndex]}
            style={[
              styles.slideImage,
              {
                transform: [{translateX: slideAnimation}]
              }
            ]}
            resizeMode="cover"
          />
        </View>
        <Text style={styles.text}>Welcome to the Home Screen!</Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
  },
  slideContainer: {
    height: 200,
    overflow: 'hidden',
    marginBottom: 20,
  },
  slideImage: {
    width: Dimensions.get('window').width,
    height: 200,
  },
  text: {
    fontSize: 16,
    color: '#666',
    padding: 20,
  },
});

export default HomeScreen;
