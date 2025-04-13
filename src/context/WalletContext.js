import React, { createContext, useState, useContext, useEffect } from 'react';

export const WalletContext = createContext();

export const WalletProvider = ({ children }) => {
  const [balance, setBalance] = useState(100000000);
  const [transactions, setTransactions] = useState([]);

  // Initialize transactions in useEffect
  useEffect(() => {
    // Initial transactions data
    setTransactions([
      {
        id: 1,
        type: 'payment',
        amount: -500000,
        date: '15/03/2024',
        time: '09:30',
        description: 'Thanh toán đơn hàng',
      },
      {
        id: 2,
        type: 'deposit',
        amount: 1000000,
        date: '14/03/2024',
        time: '15:45',
        description: 'Nạp tiền vào ví',
      },
      {
        id: 3,
        type: 'payment',
        amount: -750000,
        date: '13/03/2024',
        time: '11:20',
        description: 'Thanh toán đơn hàng',
      },
      {
        id: 4,
        type: 'withdraw',
        amount: -300000,
        date: '12/03/2024',
        time: '16:15',
        description: 'Rút tiền',
      },
    ]);
  }, []); // Empty dependency array means this runs once on mount

  const updateBalance = (amount) => {
    setBalance(prevBalance => prevBalance + amount);
  };

  const addTransaction = (transaction) => {
    const newTransaction = {
      id: Date.now(), // Use timestamp as ID to ensure uniqueness
      date: new Date().toLocaleDateString('vi-VN'),
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      ...transaction
    };
    setTransactions(prevTransactions => [newTransaction, ...prevTransactions]);
  };

  return (
    <WalletContext.Provider value={{
      balance,
      transactions,
      updateBalance,
      addTransaction
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