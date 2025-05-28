import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import { api } from '../api/api';

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
  return logs.map(log => {
    // Translate description if needed
    let description = log.source || '';
    
    // Check if description contains English text and translate it
    if (description.toLowerCase().includes('refund')) {
      // Extract the percentage and order ID if present
      const percentMatch = description.match(/(\d+)%/);
      const percentage = percentMatch ? percentMatch[1] : '';
      
      const orderIdMatch = description.match(/order\s+([a-zA-Z0-9-]+)/i);
      const orderId = orderIdMatch ? orderIdMatch[1] : '';
      
      if (percentage && orderId) {
        description = `Hoàn tiền ${percentage}% cho đơn dịch vụ #${orderId}`;
      } else if (orderId) {
        description = `Hoàn tiền cho đơn dịch vụ #${orderId}`;
      } else {
        description = `Hoàn tiền cho #${description}`;
      }
    } else if (!description) {
      description = 'Hoàn tiền';
    }
    
    return {
    id: log.txnRef || `${log.creationDate}-${Math.random()}`, // Use txnRef or fallback
    amount: Math.abs(log.amount), // Ensure amount is positive for display
      description: description,
    date: log.creationDate || new Date().toISOString(), // Use creationDate
    type: 'refund'
    };
  });
};

// Helper function to process bills into formatted purchase transactions
const processWalletBills = (bills) => {
  if (!bills) return [];
  return bills.map(bill => {
    const orderId = bill.orderId ? bill.orderId.substring(0, 9) : 'unknown';
    
    let description = bill.description || '';
    
    // Translate English descriptions to Vietnamese
    if (description.toLowerCase() === "string") {
      description = `Thanh toán đơn hàng #${orderId}`;
    } else if (description.toLowerCase().includes("payment")) {
      description = `Thanh toán đơn hàng #${orderId}`;
    } else if (description.toLowerCase().includes("pay") && description.toLowerCase().includes("design fee")) {
      // Example: "Pay 50% design fee for order bd4ad6d2..."
      const percentMatch = description.match(/(\d+)%/);
      const percentage = percentMatch ? percentMatch[1] : '';
      
      const orderIdMatch = description.match(/order\s+([a-zA-Z0-9-]+)/i);
      const orderId = orderIdMatch ? orderIdMatch[1] : '';
      
      if (percentage && orderId) {
        description = `Thanh toán phí thiết kế ${percentage}% cho đơn hàng ${orderId}`;
      } else {
        description = `Thanh toán phí thiết kế cho đơn hàng ${bill.orderId || ''}`;
      }
    } else if (description === "Thanh toán đơn hàng") {
      description = `Thanh toán đơn hàng #${bill.orderId}`;
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

const WalletContext = createContext();

export const WalletProvider = ({ children }) => {
  const [balance, setBalance] = useState(0);
  const [purchaseTransactions, setPurchaseTransactions] = useState([]);
  const [depositTransactions, setDepositTransactions] = useState([]);
  const [refundTransactions, setRefundTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetchTime, setLastFetchTime] = useState(0);
  const { user } = useAuth(); // Get user from AuthContext

  const fetchWalletData = async (forceRefresh = false) => {
    try {
      // Set loading state but not if we're just doing a background refresh
      if (!forceRefresh) {
        setIsLoading(true);
      }
      
      // Check if we need to fetch again or can use cached data
      const currentTime = Date.now();
      const CACHE_TIMEOUT = 30000; // 30 seconds
      
      if (!forceRefresh && currentTime - lastFetchTime < CACHE_TIMEOUT) {
        // If it's been less than 30 seconds since last fetch and not forcing refresh,
        // use cached data instead of fetching again
        setIsLoading(false);
        return;
      }
      
      const userJson = await AsyncStorage.getItem('user');
      
      if (!userJson) {
        throw new Error('Không tìm thấy dữ liệu người dùng');
      }

      const userData = JSON.parse(userJson);
      const userId = userData.id;
      
      // --- Get Wallet ID --- 
      // Try to get walletId from cached user data first
      let walletId = userData.wallet?.id;

      if (!walletId) {
        console.warn('Không tìm thấy ID ví trong dữ liệu người dùng đã lưu. Việc tải có thể thất bại.');
        throw new Error('Không tìm thấy ID ví. Vui lòng đăng nhập lại.');
      }
      
      // --- Fetch Data from Both Endpoints in Parallel --- 
      const [walletDetailsResponse, userWalletResponse] = await Promise.all([
        api.get(`/wallets/${walletId}`),
        api.get(`/wallets/user${userId}`)
      ]);

      // Set Balance
      setBalance(walletDetailsResponse.amount);
      
      // Process Wallet Logs for Deposits and Refunds
      const walletLogs = walletDetailsResponse.walletLogs || [];

      const depositLogs = walletLogs.filter(log => log.type === 'Deposit');
      const formattedDeposits = processWalletLogs(depositLogs);
      setDepositTransactions(formattedDeposits);

      const refundLogs = walletLogs.filter(log => log.type === 'Refund');
      const formattedRefunds = processRefundLogs(refundLogs);
      setRefundTransactions(formattedRefunds);

      // Process and Set Purchase Transactions
      const formattedPurchases = processWalletBills(userWalletResponse.bills || []);
      setPurchaseTransactions(formattedPurchases);
      
      // Update userData cache with the main wallet details 
      userData.wallet = walletDetailsResponse; 
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      
      // Update last fetch time
      setLastFetchTime(Date.now());
      
      setError(null);
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu ví:', err);
      setError(err.message || 'Không thể tải dữ liệu ví');
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    if (user?.id) { // Fetch data only if user ID is available
      // Load initial data with a minimum display time to ensure UI consistency
      setIsLoading(true);
      const loadData = async () => {
        const startTime = Date.now();
        await fetchWalletData();
        
        // Ensure loading state shows for at least 300ms to avoid flicker
        const elapsed = Date.now() - startTime;
        const MIN_LOADING_TIME = 300;
        if (elapsed < MIN_LOADING_TIME) {
          setTimeout(() => {
            setIsLoading(false);
          }, MIN_LOADING_TIME - elapsed);
        } else {
          setIsLoading(false);
        }
      };
      
      loadData();
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
      throw new Error('Người dùng chưa đăng nhập');
    }
    // Ensure amount is treated as a number
    const numericAmount = parseFloat(amount); 
    if (isNaN(numericAmount) || numericAmount <= 0) {
      throw new Error('Số tiền nạp không hợp lệ');
    }
    try {
      console.log(`Tạo giao dịch VNPay với số tiền: ${numericAmount} cho thiết bị di động`);

      // Prepare the request body including only the amount
      const requestBody = {
          amount: numericAmount, 
      };

      // Send the request body as JSON, with isMobile as a query parameter
      const response = await api.post('/wallets/vn-pay?isMobile=true', amount);
      console.log('Phản hồi API VNPay:', response);
      
      if (response && typeof response === 'string') {
        return response; // Expecting the URL string directly
      } else {
        throw new Error('Định dạng phản hồi từ API VNPay không hợp lệ');
      }
    } catch (err) {
      console.error('Lỗi khi tạo giao dịch VNPay:', err);
      throw new Error(err.message || 'Không thể tạo liên kết thanh toán VNPay');
    }
  };

  const handleVnpayResponse = async (returnUrl) => {
    if (!returnUrl) {
      throw new Error('URL phản hồi VNPay không hợp lệ.');
    }
    console.log('Xử lý URL phản hồi VNPay:', returnUrl);
    try {
      // Encode the returnUrl to be safely included in a query parameter
      const encodedReturnUrl = encodeURIComponent(returnUrl);
      // Construct the full URL with the query parameter
      const apiUrl = `/wallets/vn-pay/response?returnUrl=${encodedReturnUrl}`;

      console.log('Gửi yêu cầu GET đến backend:', apiUrl);

      const response = await api.get(apiUrl);
      console.log('Phản hồi API VNPay thành công:', response);
      
      // Assuming success means the balance is updated backend-side
      await fetchWalletData(true); // Force refresh wallet balance

      // Return the success message from the backend
      return response; 

    } catch (err) {
      console.error('--- Lỗi xử lý phản hồi VNPay ---');
      console.error('Thông báo lỗi:', err.message);
      console.error('Đối tượng lỗi đầy đủ:', err);
      console.error('--- Kết thúc chi tiết lỗi ---');

      throw new Error(err.message || 'Không thể xử lý phản hồi VNPay.');
    }
  };

  const updateBalance = (amount) => {
    setBalance(prevBalance => prevBalance + amount);
    // Optionally: refetch wallet data after balance update for consistency
    fetchWalletData(true); 
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
    throw new Error('useWallet phải được sử dụng trong WalletProvider');
  }
  return context;
}; 