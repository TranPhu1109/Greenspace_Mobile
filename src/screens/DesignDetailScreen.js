import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, FlatList } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const { width } = Dimensions.get('window');

const DesignDetailScreen = ({ navigation, route }) => {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const scrollViewRef = useRef(null);

  const designDetails = {
    id: '1',
    name: 'Modern Living Room',
    description: 'A contemporary living room design featuring clean lines, neutral colors, and comfortable seating arrangements. Perfect for modern homes seeking a balance between style and functionality.',
    area: {
      length: '5.5m',
      width: '4.2m',
      total: '23.1m²'
    },
    images: [
      require('../assets/images/default_image.jpg'),
      require('../assets/images/furniture.jpg'),
      require('../assets/images/default_image.jpg'),
    ],
    materials: [
      {
        id: '1',
        name: 'Modern Sofa',
        quantity: '1 piece',
        price: 1299.99,
        image: require('../assets/images/furniture.jpg')
      },
      {
        id: '2',
        name: 'Coffee Table',
        quantity: '1 piece',
        price: 399.99,
        image: require('../assets/images/furniture.jpg')
      },
      {
        id: '3',
        name: 'Floor Lamp',
        quantity: '2 pieces',
        price: 199.99,
        image: require('../assets/images/furniture.jpg')
      },
      {
        id: '4',
        name: 'Wall Art',
        quantity: '3 pieces',
        price: 149.99,
        image: require('../assets/images/furniture.jpg')
      }
    ],
    pricing: {
      materials: 2449.95,
      design: 500.00,
      total: 2949.95
    }
  };

  const handleScroll = (event) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const currentIndex = Math.round(contentOffset / width);
    setActiveImageIndex(currentIndex);
  };

  const feedbacks = [
    {
      id: 1,
      userName: 'User 1',
      rating: 5,
      comment: 'Sản phẩm ok lắm',
    },
    {
      id: 2,
      userName: 'User 2',
      rating: 5,
      comment: 'Chất lượng sản phẩm tốt nhưng giá mắc quá',
    },
  ];

  const renderStars = (rating) => {
    return [...Array(5)].map((_, index) => (
      <Icon
        key={index}
        name="star"
        size={16}
        color={index < rating ? '#FFD700' : '#E5E5EA'}
        style={{ marginRight: 2 }}
      />
    ));
  };

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
            {designDetails.images.map((image, index) => (
              <Image
                key={index}
                source={image}
                style={styles.mainImage}
              />
            ))}
          </ScrollView>
          <View style={styles.imageIndicators}>
            {designDetails.images.map((_, index) => (
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
          <Text style={styles.sectionTitle}>{designDetails.name}</Text>
          <Text style={styles.description}>{designDetails.description}</Text>
          <View style={styles.areaContainer}>
            <View style={styles.areaItem}>
              <Icon name="ruler-square" size={20} color="#666" />
              <Text style={styles.areaText}>Length: {designDetails.area.length}</Text>
            </View>
            <View style={styles.areaItem}>
              <Icon name="ruler-square" size={20} color="#666" />
              <Text style={styles.areaText}>Width: {designDetails.area.width}</Text>
            </View>
            <View style={styles.areaItem}>
              <Icon name="ruler-square" size={20} color="#666" />
              <Text style={styles.areaText}>Total Area: {designDetails.area.total}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Materials</Text>
          <View style={styles.materialsContainer}>
            {designDetails.materials.map((material) => (
              <View key={material.id} style={styles.materialRow}>
                <Image 
                  source={material.image}
                  style={styles.materialImage}
                />
                <View style={styles.materialInfo}>
                  <Text style={styles.materialName}>{material.name}</Text>
                  <Text style={styles.materialQuantity}>{material.quantity}</Text>
                </View>
                <Text style={styles.materialPrice}>${material.price.toFixed(2)}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pricing</Text>
          <View style={styles.pricingContainer}>
            <View style={styles.pricingRow}>
              <Text style={styles.pricingLabel}>Materials Cost</Text>
              <Text style={styles.pricingAmount}>${designDetails.pricing.materials.toFixed(2)}</Text>
            </View>
            <View style={styles.pricingRow}>
              <Text style={styles.pricingLabel}>Design Cost</Text>
              <Text style={styles.pricingAmount}>${designDetails.pricing.design.toFixed(2)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Cost</Text>
              <Text style={styles.totalAmount}>${designDetails.pricing.total.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.feedbackContainer}>
            <View style={styles.feedbackHeader}>
              <Text style={styles.sectionTitle}>Feedback</Text>
              <TouchableOpacity onPress={() => navigation.navigate('AllFeedback')}>
                <Text style={styles.viewAllText}>Xem tất cả</Text>
              </TouchableOpacity>
            </View>
            
            {feedbacks.map((feedback) => (
              <View key={feedback.id} style={styles.feedbackItem}>
                <View style={styles.userInfo}>
                  <Icon name="account-circle" size={24} color="#666" />
                  <Text style={styles.userName}>{feedback.userName}</Text>
                </View>
                <View style={styles.ratingContainer}>
                  {renderStars(feedback.rating)}
                </View>
                <Text style={styles.feedbackComment}>{feedback.comment}</Text>
              </View>
            ))}
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
              onPress={() => navigation.navigate('Order', { designId: designDetails.id, isCustomize: false })}
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
              onPress={() => navigation.navigate('Order', { designId: designDetails.id, isCustomize: true })}
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
    marginBottom: 16,
  },
  areaContainer: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 12,
  },
  areaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  areaText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
  },
  materialsContainer: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 12,
  },
  materialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  materialImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  materialInfo: {
    flex: 1,
  },
  materialName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  materialQuantity: {
    fontSize: 12,
    color: '#666',
  },
  materialPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  pricingContainer: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 12,
  },
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  pricingLabel: {
    fontSize: 14,
    color: '#666',
  },
  pricingAmount: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
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
  feedbackContainer: {
    marginTop: 8,
  },
  feedbackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  viewAllText: {
    fontSize: 14,
    color: '#007AFF',
  },
  feedbackItem: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  userName: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  ratingContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  feedbackComment: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});

export default DesignDetailScreen;
