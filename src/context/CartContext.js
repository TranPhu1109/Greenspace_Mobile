import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useAuth } from './AuthContext';

const API_URL = 'http://10.0.2.2:8080/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include token
api.interceptors.request.use(
  async (config) => {
    try {
      const userJson = await AsyncStorage.getItem('user');
      if (userJson) {
        const user = JSON.parse(userJson);
        if (user.backendToken) {
          config.headers.Authorization = `Bearer ${user.backendToken}`;
          console.log('Using token:', user.backendToken);
        } else {
          console.log('No backend token found in user data');
        }
      } else {
        console.log('No user data found in AsyncStorage');
      }
    } catch (error) {
      console.error('Error getting token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [serverCartId, setServerCartId] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const { user } = useAuth(); // Get user from AuthContext

  // Debug user and token on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userJson = await AsyncStorage.getItem('user');
        console.log('Current user in storage:', userJson ? JSON.parse(userJson) : 'No user');
        console.log('Current user in context:', user);
      } catch (error) {
        console.error('Error checking auth:', error);
      }
    };
    checkAuth();
  }, [user]);

  // Load cart items when app starts or user changes
  useEffect(() => {
    if (user?.backendToken) {
      console.log('User authenticated, initializing cart');
      initializeCart();
    } else {
      console.log('No authenticated user, loading local cart');
      loadLocalCart();
    }
  }, [user]);

  // Calculate total price whenever cart items change
  useEffect(() => {
    calculateTotalPrice();
  }, [cartItems]);

  const initializeCart = async () => {
    try {
      const userJson = await AsyncStorage.getItem('user');
      if (!userJson) {
        console.log('No user data found, loading local cart');
        await loadLocalCart();
        return;
      }

      const userData = JSON.parse(userJson);
      if (!userData.backendToken) {
        console.log('No backend token found, loading local cart');
        await loadLocalCart();
        return;
      }

      // Only fetch server cart if we have items locally
      const savedCart = await AsyncStorage.getItem('cartItems');
      if (savedCart) {
        const localItems = JSON.parse(savedCart);
        if (localItems.length > 0) {
          console.log('Fetching cart from server...');
          const response = await api.get('/carts');
          console.log('Server cart response:', response.data);
          
          if (response.data) {
            setServerCartId(response.data.id);
            // Convert server cart items to local format
            const serverItems = await Promise.all(
              response.data.items.map(async (item) => {
                try {
                  const productResponse = await api.get(`/product/${item.productId}`);
                  return {
                    ...productResponse.data,
                    quantity: item.quantity
                  };
                } catch (error) {
                  console.error('Error fetching product details:', error);
                  return null;
                }
              })
            );
            
            const validItems = serverItems.filter(item => item !== null);
            setCartItems(validItems);
            await saveCartItems(validItems);
          }
        }
      }
    } catch (error) {
      console.error('Error initializing cart:', error);
      await loadLocalCart();
    }
  };

  const loadLocalCart = async () => {
    try {
      const savedCart = await AsyncStorage.getItem('cartItems');
      const savedCartDate = await AsyncStorage.getItem('cartSaveDate');
      
      if (savedCart && savedCartDate) {
        const currentDate = new Date();
        const saveDate = new Date(savedCartDate);
        const daysDifference = (currentDate - saveDate) / (1000 * 60 * 60 * 24);

        if (daysDifference > 7) {
          await clearCart();
        } else {
          setCartItems(JSON.parse(savedCart));
        }
      }
    } catch (error) {
      console.error('Error loading local cart:', error);
    }
  };

  const saveCartItems = async (items) => {
    try {
      await AsyncStorage.setItem('cartItems', JSON.stringify(items));
      await AsyncStorage.setItem('cartSaveDate', new Date().toISOString());
    } catch (error) {
      console.error('Error saving cart:', error);
    }
  };

  const syncToServer = async (items) => {
    if (!user?.backendToken) return;
    
    try {
      setIsSyncing(true);
      const cartData = {
        items: items.map(item => ({
          productId: item.id,
          quantity: item.quantity
        }))
      };

      if (serverCartId) {
        // Update existing cart
        await api.put('/carts', {
          model: {
            id: serverCartId,
            items: cartData.items
          }
        });
      } else {
        // Create new cart only if we have items
        if (items.length > 0) {
          const response = await api.post('/carts', cartData);
          setServerCartId(response.data.id);
        }
      }
    } catch (error) {
      console.error('Error syncing with server:', error);
      if (error.response) {
        console.log('Error response:', error.response.data);
        console.log('Error status:', error.response.status);
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const addToCartItem = async (item) => {
    try {
      const existingItem = cartItems.find(cartItem => cartItem.id === item.id);
      let updatedCart;

      if (existingItem) {
        updatedCart = cartItems.map(cartItem =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      } else {
        updatedCart = [...cartItems, { ...item, quantity: 1 }];
      }

      setCartItems(updatedCart);
      await saveCartItems(updatedCart);
      
      // Only sync with server if we have a cart ID
      if (serverCartId) {
        await syncToServer(updatedCart);
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      throw error;
    }
  };

  const updateQuantity = async (itemId, change) => {
    try {
      const updatedCart = cartItems.map(item => {
        if (item.id === itemId) {
          const newQuantity = item.quantity + change;
          return newQuantity > 0 ? { ...item, quantity: newQuantity } : null;
        }
        return item;
      }).filter(Boolean);

      setCartItems(updatedCart);
      await saveCartItems(updatedCart);
      await syncToServer(updatedCart);
    } catch (error) {
      console.error('Error updating quantity:', error);
    }
  };

  const deleteCartItem = async (itemId) => {
    try {
      const updatedCart = cartItems.filter(item => item.id !== itemId);
      setCartItems(updatedCart);
      await saveCartItems(updatedCart);
      
      if (serverCartId) {
        // Update cart with remaining items (or empty array if no items left)
        await api.put('/carts', {
          model: {
            id: serverCartId,
            items: updatedCart.map(item => ({
              productId: item.id,
              quantity: item.quantity
            }))
          }
        });
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      // Revert local changes if server sync fails
      setCartItems(cartItems);
      throw error;
    }
  };

  const clearCart = async () => {
    try {
      setCartItems([]);
      await AsyncStorage.removeItem('cartItems');
      await AsyncStorage.removeItem('cartSaveDate');
      
      // Only delete server cart if it exists
      if (serverCartId) {
        try {
          await api.delete('/carts');
        } catch (error) {
          console.error('Error deleting server cart:', error);
        }
      }
      setServerCartId(null);
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  };

  const calculateTotalPrice = () => {
    const total = cartItems.reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);
    setTotalPrice(total);
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        totalPrice,
        addToCartItem,
        updateQuantity,
        deleteCartItem,
        clearCart,
        isSyncing,
        initializeCart
      }}
    >
      {children}
    </CartContext.Provider>
  );
};