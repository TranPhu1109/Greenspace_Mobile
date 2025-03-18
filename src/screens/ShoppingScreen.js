import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, FlatList, TouchableOpacity, Dimensions } from 'react-native';
import SearchHeader from '../components/SearchHeader';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import data from '../data/data.json';



const ShoppingScreen = () => {
  const [selectedCategory, setSelectedCategory] = useState(data.categories[0]);
  const [bestSellingProducts, setBestSellingProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const navigation = useNavigation();

  useEffect(() => {
    const topProducts = [...data.products]
      .sort((a, b) => b.numberOfPurchased - a.numberOfPurchased)
      .slice(0, 5);
    setBestSellingProducts(topProducts);
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      const filtered = data.products.filter(
        product => product.categoryId === selectedCategory.id
      );
      setFilteredProducts(filtered);
    }
  }, [selectedCategory]);

  const renderCategoryItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.categoryItem,
        selectedCategory?.id === item.id && styles.selectedCategory
      ]}
      onPress={() => setSelectedCategory(item)}
    >
      <Image
        source={require('../assets/images/furniture.jpg')}
        style={styles.categoryImage}
        resizeMode="cover"
      />
      <Text style={[
        styles.categoryName,
        selectedCategory?.id === item.id && styles.selectedCategoryText
      ]}>{item.name}</Text>
    </TouchableOpacity>
  );

  const renderProductItem = ({ item }) => (
    <TouchableOpacity
      style={styles.productItem}
      onPress={() => navigation.navigate('ProductDetails', { product: item })}
    >
      <Image
        source={require('../assets/images/furniture.jpg')}
        style={styles.productImage}
        resizeMode="cover"
      />
      <Text style={styles.productName}>{item.name}</Text>
      <Text style={styles.productPrice}>{item.price}</Text>
    </TouchableOpacity>
  );

  const renderBestSellingItem = ({ item }) => (
    <TouchableOpacity
      style={styles.bestSellingItem}
      onPress={() => navigation.navigate('ProductDetails', { product: item })}
    >
      <Image
        source={require('../assets/images/furniture.jpg')}
        style={styles.bestSellingImage}
        resizeMode="cover"
      />
      <View style={styles.bestSellingDetails}>
        <Text style={styles.bestSellingName}>{item.name}</Text>
        <Text style={styles.bestSellingPrice}>{item.price}</Text>
        <Text style={styles.purchaseCount}>{item.numberOfPurchased} purchases</Text>
      </View>
    </TouchableOpacity>
  );

  const ListHeaderComponent = () => (
    <>
      <View style={styles.bannerContainer}>
        <Image
          source={require('../assets/images/furniture.jpg')}
          style={styles.bannerImage}
          resizeMode="cover"
        />
        <View style={styles.bannerOverlay}>
          <Text style={styles.bannerTitle}>Summer Sale</Text>
          <Text style={styles.bannerSubtitle}>Sale up to 50% off</Text>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Best Selling Products</Text>
        <TouchableOpacity
          style={styles.viewAllButton}
        >
          <Icon name="arrow-forward" size={20} color="#007AFF" />
          <Text style={styles.viewAllText}>View All</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={bestSellingProducts}
        renderItem={renderBestSellingItem}
        keyExtractor={item => item.id}
        horizontal={true}
        scrollEnabled={true}
        contentContainerStyle={styles.bestSellingList}
        removeClippedSubviews={false} 
      />

      <Text style={styles.sectionTitle}>Categories</Text>
      <FlatList
        data={data.categories}
        renderItem={renderCategoryItem}
        keyExtractor={item => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesList}
        removeClippedSubviews={false} 
      />

      {selectedCategory && (
        <>
          <Text style={styles.sectionTitle}>{selectedCategory.name} Products</Text>
        </>
      )}
    </>
  );

  return (
    <View style={styles.container}>
      <SearchHeader title="Shop" />
      <FlatList
        ListHeaderComponent={ListHeaderComponent}
        data={filteredProducts}
        renderItem={renderProductItem}
        keyExtractor={item => item.id}
        numColumns={2}
        contentContainerStyle={styles.productsList}
        removeClippedSubviews={false}
      />
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
  bannerContainer: {
    height: 200,
    marginBottom: 20,
    position: 'relative',
  },
  bannerImage: {
    width: Dimensions.get('window').width,
    height: 200,
  },
  bannerOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  bannerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  bannerSubtitle: {
    fontSize: 16,
    color: '#fff',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  bestSellingList: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  bestSellingItem: {
    flexDirection: 'row',
    marginBottom: 15,
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    padding: 10,
  },
  bestSellingImage: {
    width: 100,
    height: 100,
    borderRadius: 10,
  },
  bestSellingDetails: {
    flex: 1,
    marginLeft: 15,
    justifyContent: 'center',
  },
  bestSellingName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  bestSellingPrice: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  categoriesList: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  categoryItem: {
    marginRight: 15,
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
  },
  selectedCategory: {
    backgroundColor: '#e6f2ff',
  },
  categoryImage: {
    width: 20,
    height: 20,
    borderRadius: 40,
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
  selectedCategoryText: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  productsList: {
    paddingVertical: 10,
  },
  productItem: {
    flex: 1,
    margin: 8,
    padding: 10,
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    alignItems: 'center',
  },
  productImage: {
    width: 120,
    height: 120,
    borderRadius: 10,
    marginBottom: 8,
  },
  productName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    marginLeft: 5,
    color: '#007AFF',
    fontSize: 14,
  },
  purchaseCount: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  }
});

export default ShoppingScreen;