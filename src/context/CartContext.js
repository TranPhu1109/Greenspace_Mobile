import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);

  // Load cart items when app starts
  useEffect(() => {
    loadCartItems();
  }, []);

  // Calculate total price whenever cart items change
  useEffect(() => {
    calculateTotalPrice();
  }, [cartItems]);

  const loadCartItems = async () => {
    try {
      const savedCart = await AsyncStorage.getItem('cartItems');
      const savedCartDate = await AsyncStorage.getItem('cartSaveDate');
      
      if (savedCart && savedCartDate) {
        const currentDate = new Date();
        const saveDate = new Date(savedCartDate);
        const daysDifference = (currentDate - saveDate) / (1000 * 60 * 60 * 24);

        // Clear cart if it's older than 7 days
        if (daysDifference > 7) {
          await clearCart();
        } else {
          setCartItems(JSON.parse(savedCart));
        }
      }
    } catch (error) {
      console.error('Error loading cart:', error);
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
    } catch (error) {
      console.error('Error adding to cart:', error);
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
    } catch (error) {
      console.error('Error updating quantity:', error);
    }
  };

  const deleteCartItem = async (itemId) => {
    try {
      const updatedCart = cartItems.filter(item => item.id !== itemId);
      setCartItems(updatedCart);
      await saveCartItems(updatedCart);
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const clearCart = async () => {
    try {
      setCartItems([]);
      await AsyncStorage.removeItem('cartItems');
      await AsyncStorage.removeItem('cartSaveDate');
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  };

  const calculateTotalPrice = () => {
    const total = cartItems.reduce((sum, item) => {
      return sum + (parseFloat(item.price.replace('$', '')) * item.quantity);
    }, 0);
    setTotalPrice(total.toFixed(2));
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        totalPrice,
        addToCartItem,
        updateQuantity,
        deleteCartItem,
        clearCart
      }}
    >
      {children}
    </CartContext.Provider>
  );
};