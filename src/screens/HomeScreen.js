// src/screens/HomeScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
  Animated,
  TouchableOpacity,
  ImageBackground,
  FlatList,
} from 'react-native';
import SearchHeader from '../components/SearchHeader';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/api';
import Icon from 'react-native-vector-icons/Ionicons';
import logo from '../assets/logo/logo.png';
import { setupFCMListeners } from '../utils/firebaseNotification';

const { width } = Dimensions.get('window');

const HomeScreen = () => {
  const { user, isAuthenticated } = useAuth();
  const navigation = useNavigation();

  const [designIdeas, setDesignIdeas] = useState([]);
  const [loadingDesignIdeas, setLoadingDesignIdeas] = useState(true);
  const [errorDesignIdeas, setErrorDesignIdeas] = useState(null);

  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [errorProducts, setErrorProducts] = useState(null);



  useEffect(() => {
    const fetchData = async () => {
      setLoadingDesignIdeas(true);
      setErrorDesignIdeas(null);
      try {
        const response = await api.get('/designidea', {
          params: {
            pageNumber: 0,
            pageSize: 4,
          },
        });
        if (response && response && Array.isArray(response)) {
          setDesignIdeas(response);
        } else {
          setDesignIdeas([]);
          console.error('API response for design ideas is not an array or is empty:', response);
          setErrorDesignIdeas('Failed to load design ideas due to unexpected data format or empty response.');
        }
      } catch (error) {
        console.error('Error fetching design ideas:', error);
        setErrorDesignIdeas(`Failed to load design ideas: ${error.message || error}. Please check your connection.`);
      } finally {
        setLoadingDesignIdeas(false);
      }

      setLoadingProducts(true);
      setErrorProducts(null);
      try {
        const response = await api.get('/product', {
          params: {
            pageNumber: 0,
            pageSize: 4,
          },
        });
        if (response && response && Array.isArray(response)) {
          setProducts(response);
        } else {
          setProducts([]);
          console.error('API response for products is not an array or is empty:', response);
          setErrorProducts('Failed to load products due to unexpected data format or empty response.');
        }
      } catch (error) {
        console.error('Error fetching products:', error);
        setErrorProducts(`Failed to load products: ${error.message || error}. Please check your connection.`);
      } finally {
        setLoadingProducts(false);
      }
    };

    // Fetch data regardless of authentication status
    fetchData();
  }, []);

  const renderDesignIdeaItem = ({ item }) => (
    <TouchableOpacity
      style={styles.designIdeaCard}
      onPress={() => {
        if (isAuthenticated) {
          navigation.navigate('DesignDetail', { designId: item.id });
        } else {
          navigation.navigate('Login', { returnTo: true });
        }
      }}
    >
      {item.image && item.image.imageUrl ? (
        <Image
          source={{ uri: item.image.imageUrl }}
          style={styles.designIdeaImage}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.placeholderImage}><Text style={styles.placeholderText}>No Image</Text></View>
      )}

      <View style={styles.designIdeaInfo}>
        <Text style={styles.designIdeaName} numberOfLines={1}>
          {item.name || 'No Title'}
        </Text>
        {item.categoryName ? (
          <Text style={styles.designIdeaCategory}>{item.categoryName}</Text>
        ) : null}

        {item.totalPrice != null ? (
           <Text style={styles.designIdeaPrice}>
             {item.totalPrice.toLocaleString('vi-VN')}
             <Text style={styles.currencyText}> VNĐ</Text>
           </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );

  const renderProductItem = ({ item }) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => {
        if (isAuthenticated) {
          navigation.navigate('ProductDetails', { productId: item.id });
        } else {
          navigation.navigate('Login', { returnTo: true });
        }
      }}
    >
      {item.image && item.image.imageUrl ? (
        <Image
          source={{ uri: item.image.imageUrl }}
          style={styles.productImage}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.placeholderImage}><Text style={styles.placeholderText}>No Image</Text></View>
      )}

      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={1}>
          {item.name || 'No Name'}
        </Text>
        {item.price != null ? (
           <Text style={styles.productPrice}>
             {item.price.toLocaleString('vi-VN')}
             <Text style={styles.currencyText}> VNĐ</Text>
           </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Add a header view for the logo */}
      <View style={styles.header}>
        <Image
          source={logo}
          style={styles.headerLogo}
          resizeMode="contain"
        />
      </View>

      <ScrollView style={styles.content} removeClippedSubviews={false}>
        <ImageBackground
          source={require('../assets/images/greenspace_banner.jpg')}
          style={styles.bannerBackground}
          resizeMode="cover"
        >
          <View style={styles.bannerOverlay} />
          <View style={styles.bannerContent}>
            <Text style={styles.bannerPill}>KHÔNG GIAN MƠ ƯỚC</Text>
            <Text style={styles.bannerTitle}>Không Gian Xanh Cho Cuộc Sống Hiện Đại</Text>
            <Text style={styles.bannerSubtitle}>Chúng tôi mang đến giải pháp thiết kế và thi công không gian xanh chuyên nghiệp, giúp bạn tạo nên môi trường sống trong lành và thẩm mỹ.</Text>
            <View style={styles.bannerButtons}>
              <TouchableOpacity 
                style={[styles.button, styles.exploreButton]}
                onPress={() => {
                  if (isAuthenticated) {
                    navigation.navigate('DesignIdeaLibrary');
                  } else {
                    navigation.navigate('Login', { returnTo: true });
                  }
                }}
              >
                <Text style={styles.buttonText}>Khám Phá Ngay</Text>
                <Icon name="arrow-forward" size={16} color="#fff" style={{ marginLeft: 5 }} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.button, styles.contactButton]}
                onPress={() => {
                  if (isAuthenticated) {
                    // Navigate to contact screen
                  } else {
                    navigation.navigate('Login', { returnTo: true });
                  }
                }}
              >
                <Text style={styles.buttonText}>Liên Hệ Tư Vấn</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ImageBackground>

        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Ý Tưởng Thiết Kế</Text>
            <View style={styles.sectionTitleUnderline} />
            <Text style={styles.sectionSubtitle}>Khám phá những ý tưởng thiết kế độc đáo cho không gian của bạn</Text>
          </View>
          {loadingDesignIdeas ? (
            <Text style={styles.loadingText}>Đang tải ý tưởng thiết kế...</Text>
          ) : errorDesignIdeas ? (
            <Text style={styles.errorText}>{errorDesignIdeas}</Text>
          ) : designIdeas.length > 0 ? (
            <FlatList
              data={designIdeas}
              renderItem={renderDesignIdeaItem}
              keyExtractor={(item, index) => item.id ? item.id.toString() : index.toString()}
              numColumns={2}
              columnWrapperStyle={styles.row}
              contentContainerStyle={styles.designIdeasList}
              scrollEnabled={false}
            />
          ) : (
            <Text style={styles.noDataText}>Không có ý tưởng thiết kế nào.</Text>
          )}

          {designIdeas.length > 0 && (
            <TouchableOpacity
              style={styles.seeMoreButton}
              onPress={() => {
                if (isAuthenticated) {
                  navigation.navigate('DesignIdeaLibrary');
                } else {
                  navigation.navigate('Login', { returnTo: true });
                }
              }}
            >
              <Icon name="arrow-forward" size={20} color="#fff" style={styles.seeMoreButtonIcon} />
              <Text style={styles.seeMoreButtonText}>Khám Phá Thêm Thiết Kế</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Sản phẩm</Text>
            <View style={styles.sectionTitleUnderline} />
            <Text style={styles.sectionSubtitle}>Tìm kiếm các sản phẩm phù hợp cho không gian của bạn</Text>
          </View>
          {loadingProducts ? (
            <Text style={styles.loadingText}>Đang tải sản phẩm...</Text>
          ) : errorProducts ? (
            <Text style={styles.errorText}>{errorProducts}</Text>
          ) : products.length > 0 ? (
            <FlatList
              data={products}
              renderItem={renderProductItem}
              keyExtractor={(item, index) => item.id ? item.id.toString() : index.toString()}
              numColumns={2}
              columnWrapperStyle={styles.row}
              contentContainerStyle={styles.productsList}
              scrollEnabled={false}
            />
          ) : (
            <Text style={styles.noDataText}>Không có sản phẩm nào.</Text>
          )}

          {products.length > 0 && (
            <TouchableOpacity
              style={styles.seeMoreButton}
              onPress={() => {
                if (isAuthenticated) {
                  navigation.navigate('Shop');
                } else {
                  navigation.navigate('Login', { returnTo: true });
                }
              }}
            >
              <Icon name="arrow-forward" size={20} color="#fff" style={styles.seeMoreButtonIcon} />
              <Text style={styles.seeMoreButtonText}>Khám Phá Thêm Sản Phẩm</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  content: {
    flexGrow: 1,
  },

  bannerBackground: {
    width: width,
    height: 400,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  bannerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  bannerContent: {
    zIndex: 1,
  },
  bannerPill: {
    backgroundColor: '#8BC34A',
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 15,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  bannerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  bannerSubtitle: {
    fontSize: 16,
    color: '#eee',
    marginBottom: 20,
  },
  bannerButtons: {
    flexDirection: 'row',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginRight: 10,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  exploreButton: {
    backgroundColor: '#4CAF50',
  },
  contactButton: {
    backgroundColor: 'transparent',
    borderColor: '#fff',
    borderWidth: 1,
  },

  sectionContainer: {
    padding: 20,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 5,
  },
  sectionHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitleUnderline: {
    width: 50,
    height: 3,
    backgroundColor: '#8BC34A',
    marginBottom: 10,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  designIdeasList: {
  },
  row: {
    justifyContent: 'space-between',
  },
  designIdeaCard: {
    width: (width - 40 - 16) / 2,
    marginBottom: 15,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  designIdeaImage: {
    width: '100%',
    height: 120,
  },
  placeholderImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#666',
  },
  designIdeaInfo: {
    padding: 10,
  },
  designIdeaName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2c3e50',
    marginBottom: 5,
  },
  designIdeaCategory: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  designIdeaPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#e74c3c',
  },
  currencyText: {
    fontSize: 12,
    fontWeight: 'normal',
    color: '#7f8c8d',
  },
  loadingText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginTop: 20,
  },
  errorText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#FF3B30',
    marginTop: 20,
  },
  noDataText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginTop: 20,
  },

  seeMoreButton: {
    marginTop: 10,
    paddingVertical: 12,
    backgroundColor: '#66BB6A',
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    paddingHorizontal: 20,
    alignSelf: 'center',
  },
  seeMoreButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  seeMoreButtonIcon: {
    marginRight: 8,
  },

  productsList: {
  },

  productCard: {
    width: (width - 40 - 16) / 2,
    marginBottom: 15,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  productImage: {
    width: '100%',
    height: 120,
  },
  productInfo: {
    padding: 10,
  },
  productName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2c3e50',
    marginBottom: 5,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#e74c3c',
  },

  // New styles for the header with logo
  header: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerLogo: {
    width: 150,
    height: 40,
    resizeMode: 'contain',
  },
});

export default HomeScreen;
