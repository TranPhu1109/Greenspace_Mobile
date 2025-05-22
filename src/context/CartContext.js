import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useAuth } from './AuthContext';

const API_URL = 'http://192.168.1.2:8080/api';

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
        } else {
        }
      } else {
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

// Create context, but don't export it directly
const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [selectedItemIds, setSelectedItemIds] = useState([]);
  const [serverCartId, setServerCartId] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const { user } = useAuth(); // Get user from AuthContext

  // Debug user and token on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userJson = await AsyncStorage.getItem('user');
        console.log('userJson', userJson);
      } catch (error) {
        console.error('Error checking auth:', error);
      }
    };
    checkAuth();
  }, [user]);

  // Load cart items when app starts or user changes
  useEffect(() => {
    if (user?.backendToken) {
      initializeCart();
    } else {
      loadLocalCart();
    }
  }, [user]);

  // Calculate total price whenever cart items OR selection changes
  useEffect(() => {
    calculateTotalPrice();
  }, [cartItems, selectedItemIds]);

  const initializeCart = async () => {
    try {
      const userJson = await AsyncStorage.getItem('user');
      if (!userJson) {
        await loadLocalCart();
        return;
      }

      const userData = JSON.parse(userJson);
      if (!userData.backendToken) {
        await loadLocalCart();
        return;
      }

      // Only fetch server cart if we have items locally
      const savedCart = await AsyncStorage.getItem('cartItems');
      if (savedCart) {
        const localItems = JSON.parse(savedCart);
        if (localItems.length > 0) {
          // Initially, select all items when loading the cart
          setSelectedItemIds(localItems.map(item => item.id)); 
          
          const response = await api.get('/carts');
          
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
            // Also select all newly loaded server items
            setSelectedItemIds(validItems.map(item => item.id)); 
            await saveCartItems(validItems);
          }
        } else {
          // Clear selection if local cart is empty
          setSelectedItemIds([]);
        }
      } else {
        // Clear selection if no saved cart
        setSelectedItemIds([]);
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
          const localItems = JSON.parse(savedCart);
          setCartItems(localItems);
          // Select all items loaded from local storage initially
          setSelectedItemIds(localItems.map(item => item.id)); 
        }
      } else {
         // Clear selection if no saved cart
        setSelectedItemIds([]);
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
      }
      throw error; // Re-throw to allow caller to handle
    } finally {
      setIsSyncing(false);
    }
  };

  // Function to ensure server cart exists before checkout
  const ensureServerCart = async () => {
    if (!user?.backendToken) {
      throw new Error('User not authenticated');
    }
    
    if (cartItems.length === 0) {
      throw new Error('Cart is empty');
    }
    
    try {
      setIsSyncing(true);
      
      // If we already have a server cart ID, just verify it exists
      if (serverCartId) {
        try {
          // Verify the cart still exists
          const response = await api.get('/carts');
          return serverCartId;
        } catch (error) {
          // If cart doesn't exist, we'll create a new one below
          setServerCartId(null);
        }
      }
      
      // Create a new cart on the server
      const cartData = {
        items: cartItems.map(item => ({
          productId: item.id,
          quantity: item.quantity
        }))
      };
      
      const response = await api.post('/carts', cartData);
      
      const newCartId = response.data.id;
      setServerCartId(newCartId);
      return newCartId;
    } catch (error) {
      console.error('Error ensuring server cart:', error);
      if (error.response) {
        console.error('Server error:', error.response.data);
        throw new Error(`Server error: ${error.response.status}`);
      }
      throw error;
    } finally {
      setIsSyncing(false);
    }
  };

  const addToCartItem = async (item) => {
    try {
      const existingItem = cartItems.find(cartItem => cartItem.id === item.id);
      let updatedCart;
      let newItemAdded = false;

      if (existingItem) {
        updatedCart = cartItems.map(cartItem =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      } else {
        updatedCart = [...cartItems, { ...item, quantity: 1 }];
        newItemAdded = true; // Flag that a new item was added
      }

      setCartItems(updatedCart);
      // Automatically select the newly added item
      if (newItemAdded) {
        setSelectedItemIds(prev => [...prev, item.id]);
      }
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
    let updatedCartItems = [...cartItems];
    const itemIndex = updatedCartItems.findIndex(item => item.id === itemId);

    if (itemIndex !== -1) {
      const currentItem = updatedCartItems[itemIndex];
      const newQuantity = currentItem.quantity + change;

      // Check stock limit ONLY when INCREASING quantity
      if (change > 0 && newQuantity > currentItem.stock) {
        // Optionally show an alert or feedback to the user here if desired
        // Alert.alert("Thông báo", "Số lượng đã đạt tối đa trong kho.");
        return; // Do not update if exceeding stock
      }

      // Ensure quantity doesn't go below 1
      if (newQuantity >= 1) {
        updatedCartItems[itemIndex] = {
          ...currentItem,
          quantity: newQuantity
        };
      } else {
        // Optionally remove item if quantity goes below 1, or keep it at 1
        // For now, let's prevent going below 1
        updatedCartItems[itemIndex] = {
          ...currentItem,
          quantity: 1
        };
      }

      setCartItems(updatedCartItems);
      await saveCartItems(updatedCartItems);
      await syncToServer(updatedCartItems);
    }
  };

  const deleteCartItem = async (itemId) => {
    try {
      const updatedCart = cartItems.filter(item => item.id !== itemId);
      setCartItems(updatedCart);
      // Also remove from selected items if it was selected
      setSelectedItemIds(prev => prev.filter(id => id !== itemId)); 
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
      setSelectedItemIds([]); // Clear selection as well
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
      // Only add to sum if the item is selected
      if (selectedItemIds.includes(item.id)) {
        return sum + (item.price * item.quantity);
      }
      return sum;
    }, 0);
    setTotalPrice(total);
  };

  // --- New Selection Functions ---
  const toggleItemSelection = (itemId) => {
    setSelectedItemIds(prevSelectedIds => {
      if (prevSelectedIds.includes(itemId)) {
        // If already selected, remove it
        return prevSelectedIds.filter(id => id !== itemId);
      } else {
        // If not selected, add it
        return [...prevSelectedIds, itemId];
      }
    });
    // No need to save selection to AsyncStorage unless required for persistence across app restarts
  };

  const selectAllItems = () => {
    setSelectedItemIds(cartItems.map(item => item.id));
  };

  const deselectAllItems = () => {
    setSelectedItemIds([]);
  };
  // --- End New Selection Functions ---

  return (
    <CartContext.Provider
      value={{
        cartItems,
        totalPrice,
        selectedItemIds,
        toggleItemSelection,
        selectAllItems,
        deselectAllItems,
        addToCartItem,
        updateQuantity,
        deleteCartItem,
        clearCart,
        isSyncing,
        initializeCart,
        ensureServerCart,
        serverCartId
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

// Export the custom hook instead of the context itself
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};