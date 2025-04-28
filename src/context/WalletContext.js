import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useAuth } from './AuthContext';

// Base URL for the API
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
        }
      }
    } catch (error) {
      console.error('Error attaching token to Wallet API request:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

const WalletContext = createContext();

// Helper function to process wallet logs into formatted transactions
const processWalletLogs = (logs) => {
  if (!logs) return [];
  return logs
    .filter(log => log.type === "Deposit") // Only show deposits
    // Add sorting by transactionNo (ascending) before mapping
    .sort((a, b) => {
      const txnNoA = parseInt(a.transactionNo || '0', 10); // Parse as integer, default to 0 if missing
      const txnNoB = parseInt(b.transactionNo || '0', 10);
      return txnNoB - txnNoA;
    })
    .map(log => ({
      id: log.txnRef || `${log.creationDate}-${Math.random()}`, // Use txnRef or fallback
      amount: Math.abs(log.amount), // Ensure amount is positive for display
      description: `Nạp tiền từ ${log.source || 'không rõ'}`, // Description for deposit
      date: log.creationDate || new Date().toISOString(), // Use creationDate
      type: 'deposit',
      transactionNo: log.transactionNo // Keep transactionNo for potential use
    }));
};

// Helper function to process refund logs into formatted transactions
const processRefundLogs = (logs) => {
  if (!logs) return [];
  return logs.map(log => ({
    id: log.txnRef || `${log.creationDate}-${Math.random()}`, // Use txnRef or fallback
    amount: Math.abs(log.amount), // Ensure amount is positive for display
    description: `Hoàn tiền từ ${log.source || 'đơn hàng'}`, // Description for refund
    date: log.creationDate || new Date().toISOString(), // Use creationDate
    type: 'refund'
  }));
};

// Helper function to process bills into formatted purchase transactions
const processWalletBills = (bills) => {
  if (!bills) return [];
  return bills.map(bill => {
    const orderId = bill.orderId ? bill.orderId.substring(0, 9) : 'unknown';
    
    let description = bill.description;
    // If description is "Thanh toán đơn hàng" or "string", add order ID
    if (description === "Thanh toán đơn hàng" || description === "string") {
      description = `Thanh toán đơn hàng #${orderId}`;
    }
    
    return {
      id: `${bill.orderId || bill.serviceOrderId || Math.random().toString(36).substring(2, 9)}`,
      amount: Math.abs(bill.amount), // Return positive amount
      description: description,
      date: bill.creationDate || new Date().toISOString(), // Use creationDate if available
      type: 'purchase' // Add type for purchases
    };
  });
};

export const WalletProvider = ({ children }) => {
  const [balance, setBalance] = useState(0);
  const [purchaseTransactions, setPurchaseTransactions] = useState([]);
  const [depositTransactions, setDepositTransactions] = useState([]);
  const [refundTransactions, setRefundTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth(); // Get user from AuthContext

  const fetchWalletData = async () => {
    try {
      setIsLoading(true);
      const userJson = await AsyncStorage.getItem('user');
      console.log("userJson", userJson);
      
      if (!userJson) {
        throw new Error('No user data found');
      }

      const userData = JSON.parse(userJson);
      const userId = userData.id;
      
      // --- Get Wallet ID --- 
      // Try to get walletId from cached user data first
      let walletId = userData.wallet?.id;

      // If walletId not cached, fetch from /wallets/user{userId} first (optional, might indicate first load)
      // For simplicity now, we'll assume walletId is usually cached after login/initial load.
      // A more robust solution might fetch user wallet if not found.
      if (!walletId) {
         console.warn('Wallet ID not found in cached user data. Fetching might fail.');
         // Optional: Fetch /wallets/user{userId} here to get walletId if critical
         // const userWalletResponse = await api.get(`/wallets/user${userId}`);
         // walletId = userWalletResponse.data.id;
         // if (!walletId) throw new Error('Failed to retrieve Wallet ID');
         // userData.wallet = userWalletResponse.data; // Cache it
         // await AsyncStorage.setItem('user', JSON.stringify(userData));
         throw new Error('Wallet ID not found. Please log in again.'); // Simpler error for now
      }
      console.log("Using Wallet ID:", walletId);
      // --- End Get Wallet ID ---
      
      // --- Fetch Data from Both Endpoints --- 
      // Call 1: Get Wallet Details (Balance, Logs)
      const walletDetailsResponse = await api.get(`/wallets/${walletId}`);
      
      // Call 2: Get User Wallet Info (Bills for purchase history)
      const userWalletResponse = await api.get(`/wallets/user${userId}`);
      // --- End Fetch Data ---

      // Set Balance
      setBalance(walletDetailsResponse.data.amount);
      
      // Process Wallet Logs for Deposits and Refunds
      const walletLogs = walletDetailsResponse.data.walletLogs || [];

      const depositLogs = walletLogs.filter(log => log.type === 'Deposit');
      const formattedDeposits = processWalletLogs(depositLogs);
      setDepositTransactions(formattedDeposits);

      const refundLogs = walletLogs.filter(log => log.type === 'Refund');
      const formattedRefunds = processRefundLogs(refundLogs);
      setRefundTransactions(formattedRefunds);

      // Process and Set Purchase Transactions
      const formattedPurchases = processWalletBills(userWalletResponse.data.bills || []);
      setPurchaseTransactions(formattedPurchases);
      
      // Update userData cache with the main wallet details 
      userData.wallet = walletDetailsResponse.data; 
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      
      setError(null);
    } catch (err) {
      console.error('Error fetching wallet data:', err);
      setError(err.message || 'Failed to fetch wallet data');
      // Clear sensitive data if unauthorized or error
      if (err.response && err.response.status === 401) {
        // Maybe trigger logout or clear specific data
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    if (user?.id) { // Fetch data only if user ID is available
      fetchWalletData();
    } else {
      setIsLoading(false); // Stop loading if no user
      setBalance(0);
      setPurchaseTransactions([]); // Clear purchases
      setDepositTransactions([]); // Clear deposits
      setRefundTransactions([]); // Clear refunds
    }
  }, [user]); // Re-fetch when user changes

  const createVnpayPayment = async (amount) => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }
    // Ensure amount is treated as a number
    const numericAmount = parseFloat(amount); 
    if (isNaN(numericAmount) || numericAmount <= 0) {
      throw new Error('Invalid top-up amount');
    }
    try {
      console.log(`Creating VNPay payment for amount: ${numericAmount} for mobile`);

      // Prepare the request body including only the amount
      const requestBody = {
          amount: numericAmount, 
          // isMobile is now sent as a URL parameter
      };

      // Send the request body as JSON, with isMobile as a query parameter
      const response = await api.post('/wallets/vn-pay?isMobile=true', amount, { 
        headers: {
          'Authorization': `Bearer ${user.backendToken}`,
          'Content-Type': 'application/json'
        }
      }); 
      console.log('VNPay API Response:', response.data);
      
      if (response.data && typeof response.data === 'string') {
        return response.data; // Expecting the URL string directly
      } else {
        throw new Error('Invalid response format from VNPay API');
      }
    } catch (err) {
      console.error('Error creating VNPay payment:', err.response ? err.response.data : err);
      throw new Error(err.response?.data?.message || 'Failed to create VNPay payment link');
    }
  };

  const handleVnpayResponse = async (returnUrl) => {
    if (!returnUrl) {
      throw new Error('Invalid VNPay return URL provided.');
    }
    console.log('Handling VNPay response URL:', returnUrl);
    try {
      // Encode the returnUrl to be safely included in a query parameter
      const encodedReturnUrl = encodeURIComponent(returnUrl);
      // Construct the full URL with the query parameter
      const apiUrl = `/wallets/vn-pay/response?returnUrl=${encodedReturnUrl}`;

      console.log('Sending GET request to backend:', apiUrl);

      // Change to api.get and remove body/content-type header
      const response = await api.get(apiUrl, {
          headers: {
            // Authorization header is still added by the interceptor
            // No Content-Type needed for GET
          }
      });
      console.log('VNPay Response API success:', response.data);
      
      // Assuming success means the balance is updated backend-side
      await fetchWalletData(); // Refresh wallet balance

      // Return the success message from the backend
      return response.data; 

    } catch (err) {
      // Log more detailed error information
      console.error('--- Error Handling VNPay Response ---');
      console.error('Status Code:', err.response?.status);
      console.error('Response Data:', JSON.stringify(err.response?.data, null, 2)); // Stringify for better object logging
      console.error('Error Message:', err.message);
      console.error('Request URL:', err.config?.url);
      console.error('Full Error Object:', err);
      console.error('--- End Error Details ---');

      // Try to extract a meaningful error message from backend response
      const backendError = err.response?.data;
      let errorMessage = 'Failed to process VNPay response.';
      if (typeof backendError === 'string') {
        errorMessage = backendError;
      } else if (backendError?.title) { // Handle ASP.NET Core validation error format
        errorMessage = backendError.title;
      }
      throw new Error(errorMessage);
    }
  };

  const updateBalance = (amount) => {
    setBalance(prevBalance => prevBalance + amount);
    // Optionally: refetch wallet data after balance update for consistency
    // fetchWalletData(); 
  };

  const addTransaction = (transaction) => {
    // Ensure we store the absolute amount locally, like fetchWalletData does
    const newTransaction = {
      ...transaction,
      amount: Math.abs(transaction.amount), 
      date: transaction.date || new Date().toISOString(), // Ensure date exists
      id: transaction.id || `${Date.now()}-${Math.random()}` // Ensure ID exists
    };

    // Add to the correct list based on type
    if (newTransaction.type === 'purchase' || newTransaction.type === 'payment') { // Handle both types
      setPurchaseTransactions(prev => [newTransaction, ...prev]);
    } else if (newTransaction.type === 'deposit') {
      setDepositTransactions(prev => [newTransaction, ...prev]);
    } else if (newTransaction.type === 'refund') {
      setRefundTransactions(prev => [newTransaction, ...prev]);
    }
    // Note: Balance update is handled separately by updateBalance
  };

  return (
    <WalletContext.Provider
      value={{
        balance,
        purchaseTransactions,
        depositTransactions,
        refundTransactions,
        isLoading,
        error,
        updateBalance,
        addTransaction,
        refreshWallet: fetchWalletData,
        createVnpayPayment,
        handleVnpayResponse
      }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}; 