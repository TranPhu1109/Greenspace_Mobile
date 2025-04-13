import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import axios from 'axios';

const { width } = Dimensions.get('window');

const DesignDetailScreen = ({ navigation, route }) => {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [error, setError] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [loadingMaterials, setLoadingMaterials] = useState(true);
  const scrollViewRef = useRef(null);
  
  const { designData } = route.params;

  useEffect(() => {
    if (designData.productDetails && designData.productDetails.length > 0) {
      fetchMaterials(designData.productDetails);
    } else {
      setLoadingMaterials(false);
    }
  }, [designData]);

  const fetchMaterials = async (productDetails) => {
    try {
      const materialsPromises = productDetails.map(async (detail) => {
        const response = await axios.get(`http://10.0.2.2:8080/api/product/${detail.productId}`, {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          }
        });
        return {
          ...response.data,
          quantity: detail.quantity
        };
      });

      const materialsData = await Promise.all(materialsPromises);
      setMaterials(materialsData);
    } catch (err) {
      console.log('Error fetching materials:', err);
      setError('Failed to load materials');
    } finally {
      setLoadingMaterials(false);
    }
  };

  const handleScroll = (event) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const currentIndex = Math.round(contentOffset / width);
    setActiveImageIndex(currentIndex);
  };

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton} 
          onPress={() => fetchMaterials(designData.productDetails)}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const images = [
    designData.image.imageUrl,
    designData.image.image2,
    designData.image.image3
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon name="chevron-left" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Design Details</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.content} removeClippedSubviews={false}>
        <View style={styles.imageContainer}>
          <ScrollView
            ref={scrollViewRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            removeClippedSubviews={false}
          >
            {images.map((imageUrl, index) => (
              <Image
                key={index}
                source={{ uri: imageUrl }}
                style={styles.mainImage}
              />
            ))}
          </ScrollView>
          <View style={styles.imageIndicators}>
            {images.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.indicator,
                  activeImageIndex === index && styles.activeIndicator
                ]}
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{designData.name}</Text>
          <Text style={styles.description}>{designData.description}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Materials</Text>
          {loadingMaterials ? (
            <ActivityIndicator size="small" color="#007AFF" style={styles.materialsLoading} />
          ) : materials.length > 0 ? (
            <View style={styles.materialsContainer}>
              {materials.map((material) => (
                <View key={material.id} style={styles.materialRow}>
                  <Image 
                    source={{ uri: material.image?.imageUrl }} 
                    style={styles.materialImage}
                  />
                  <View style={styles.materialInfo}>
                    <Text style={styles.materialName}>{material.name}</Text>
                    <Text style={styles.materialQuantity}>Quantity: {material.quantity}</Text>  
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.noMaterialsText}>No materials available</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pricing</Text>
          <View style={styles.pricingContainer}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Design Price</Text>
              <Text style={styles.priceAmount}>{designData.designPrice.toLocaleString('vi-VN')} VND</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Materials Price</Text>
              <Text style={styles.priceAmount}>{designData.materialPrice.toLocaleString('vi-VN')} VND</Text>
            </View>
            <View style={[styles.priceRow, styles.totalRow]}>
              <Text style={[styles.priceLabel, styles.totalLabel]}>Total Price</Text>
              <Text style={[styles.priceAmount, styles.totalAmount]}>
                {designData.totalPrice.toLocaleString('vi-VN')} VND
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.actionContainer}>
            <Text style={styles.actionDescription}>
              To use this design please click the button below{'\n'}
              Note: you cannot change the design and materials
            </Text>
            <TouchableOpacity 
              style={styles.buyButton}
              onPress={() => navigation.navigate('Order', { designData, isCustomize: false })}
            >
              <Text style={styles.buttonText}>Buy Design</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.actionContainer, { marginTop: 20 }]}>
            <Text style={styles.actionDescription}>
              If you want to change the design please click the Customize button below
            </Text>
            <TouchableOpacity 
              style={styles.customizeButton}
              onPress={() => navigation.navigate('Order', { designData, isCustomize: true })}
            >
              <Text style={styles.buttonText}>Customize Design</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
  },
  backButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  imageContainer: {
    position: 'relative',
    height: 300,
  },
  mainImage: {
    width: width,
    height: 300,
    resizeMode: 'cover',
  },
  imageIndicators: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 4,
  },
  activeIndicator: {
    backgroundColor: '#fff',
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  category: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  pricingContainer: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 12,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  totalRow: {
    borderBottomWidth: 0,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  priceLabel: {
    fontSize: 14,
    color: '#666',
  },
  priceAmount: {
    fontSize: 14,
    color: '#333',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  actionContainer: {
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 16,
  },
  actionDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  buyButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    width: '100%',
    alignItems: 'center',
  },
  customizeButton: {
    backgroundColor: '#34C759',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 16,
    color: '#ff3b30',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  materialsContainer: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 12,
    
  },
  materialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  materialImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#E5E5EA',
  },
  materialInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  materialName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 4,
  },
  materialQuantity: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  materialPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  materialsLoading: {
    padding: 20,
  },
  noMaterialsText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    padding: 20,
  },
});

export default DesignDetailScreen;