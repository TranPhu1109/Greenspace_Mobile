import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useWallet } from '../context/WalletContext';

const { width } = Dimensions.get('window');

const WalletScreen = ({navigation}) => {
  const { 
    balance, 
    purchaseTransactions,
    depositTransactions,
    refundTransactions,
    isLoading, 
    error, 
    refreshWallet 
  } = useWallet();

  const [refreshing, setRefreshing] = React.useState(false);
  const [activeTab, setActiveTab] = useState('deposits');
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refreshWallet();
    setRefreshing(false);
  }, [refreshWallet]);

  // Modified useEffect to prevent blocking initial render
  useEffect(() => {
    // Start loading data asynchronously without blocking render
    const loadData = async () => {
      try {
        await refreshWallet();
      } finally {
        setInitialLoadComplete(true);
      }
    };
    
    // Call loadData without awaiting it
    loadData();
    
    // Add a listener for when this screen gains focus
    const unsubscribe = navigation.addListener('focus', () => {
      // Refresh wallet data when screen comes into focus, but don't block UI
      refreshWallet();
    });

    // Clean up the listener
    return unsubscribe;
  }, []);

  const formatAmount = amount => {
    const absAmount = Math.abs(amount);
    return `${amount < 0 ? '-' : '+'}${absAmount.toLocaleString('vi-VN')}đ`;
  };
  
  const formatDate = dateString => {
    if (!dateString) return 'Không có ngày';
    
    try {
      const date = new Date(dateString);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Ngày không hợp lệ';
      }
      
      const formattedDate = date.toLocaleDateString('vi-VN');
      const formattedTime = date.toLocaleTimeString('vi-VN', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      
      return `${formattedDate} - ${formattedTime}`;
    } catch (error) {
      console.error('Lỗi định dạng ngày:', error);
      return 'Lỗi định dạng ngày';
    }
  };

  // Render the screen immediately with loading UI in appropriate sections
  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}>
          <Icon name="chevron-left" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ví cá nhân</Text>
        <View style={{width: 28}} />
      </View>

      {/* Balance Card */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Số dư khả dụng</Text>
        {isLoading && !initialLoadComplete ? (
          <ActivityIndicator size="small" color="#007AFF" style={{marginVertical: 8}} />
        ) : (
          <Text style={styles.balanceAmount}>{balance.toLocaleString('vi-VN')}đ</Text>
        )}
      </View>

      {/* Actions */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => {
            navigation.navigate('TopUp');
          }}>
          <Icon name="bank-transfer-in" size={20} color="#fff" />
          <Text style={styles.actionButtonText}>Nạp tiền</Text>
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <View style={styles.secondaryTabContainer}>
        <TouchableOpacity 
          style={[
            styles.secondaryTabButton, 
            activeTab === 'purchases' && styles.secondaryTabButtonActive
          ]}
          onPress={() => setActiveTab('purchases')}
        >
          <Icon 
            name="shopping" 
            size={18} 
            color={activeTab === 'purchases' ? '#007AFF' : '#8E8E93'} 
          />
          <Text style={[
            styles.secondaryTabText,
            activeTab === 'purchases' && styles.secondaryTabTextActive
          ]}>Mua hàng</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.secondaryTabButton, 
            activeTab === 'deposits' && styles.secondaryTabButtonActive
          ]}
          onPress={() => setActiveTab('deposits')}
        >
          <Icon 
            name="bank-transfer-in" 
            size={18} 
            color={activeTab === 'deposits' ? '#007AFF' : '#8E8E93'} 
          />
          <Text style={[
            styles.secondaryTabText,
            activeTab === 'deposits' && styles.secondaryTabTextActive
          ]}>Nạp tiền</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.secondaryTabButton, 
            activeTab === 'refunds' && styles.secondaryTabButtonActive
          ]}
          onPress={() => setActiveTab('refunds')}
        >
          <Icon 
            name="cash-refund" 
            size={18} 
            color={activeTab === 'refunds' ? '#007AFF' : '#8E8E93'} 
          />
          <Text style={[
            styles.secondaryTabText,
            activeTab === 'refunds' && styles.secondaryTabTextActive
          ]}>Hoàn tiền</Text>
        </TouchableOpacity>
      </View>

      {/* Transactions Container */}
      <View style={styles.transactionsContainer}>
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={refreshWallet}>
              <Text style={styles.retryButtonText}>Thử lại</Text>
            </TouchableOpacity>
          </View>
        )}

        {activeTab === 'purchases' && (
          <>
            <Text style={styles.historyTitle}>Lịch sử mua hàng</Text>
            {isLoading && !initialLoadComplete ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
              </View>
            ) : purchaseTransactions.length === 0 ? (
              <View style={styles.emptyState}>
                <Icon name="cart-off" size={50} color="#DADADA" />
                <Text style={styles.emptyStateText}>Không có lịch sử mua hàng</Text>
                <Text style={styles.emptyStateSubText}>
                  Giao dịch mua hàng của bạn sẽ hiển thị ở đây
                </Text>
              </View>
            ) : (
              purchaseTransactions.map((transaction, index) => (
                <TouchableOpacity
                  key={`${transaction.id}-${index}`}
                  style={styles.transactionItem}
                  onPress={() => navigation.navigate('TransactionDetail', { transaction })}>
                  <View style={styles.transactionIconContainer}>
                    <Icon name="shopping" size={20} color="#868686" />
                  </View>
                  <View style={styles.transactionContent}>
                    <View style={styles.transactionInfo}>
                      <Text style={styles.transactionTitle} numberOfLines={2}>
                        {transaction.description}
                      </Text>
                      <Text style={styles.transactionDate}>
                        {formatDate(transaction.date)}
                      </Text>
                    </View>
                    <View style={styles.transactionAmountContainer}>
                      <Text style={styles.transactionAmountNegative}>
                        {formatAmount(-transaction.amount)}
                      </Text>
                      <Icon name="chevron-right" size={18} color="#C7C7CC" />
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </>
        )}

        {activeTab === 'deposits' && (
          <>
            <Text style={styles.historyTitle}>Lịch sử nạp tiền</Text>
            {isLoading && !initialLoadComplete ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
              </View>
            ) : depositTransactions.length === 0 ? (
              <View style={styles.emptyState}>
                <Icon name="bank-off" size={50} color="#DADADA" />
                <Text style={styles.emptyStateText}>Không có lịch sử nạp tiền</Text>
                <Text style={styles.emptyStateSubText}>
                  Giao dịch nạp tiền của bạn sẽ hiển thị ở đây
                </Text>
              </View>
            ) : (
              depositTransactions.map((transaction, index) => (
                <TouchableOpacity
                  key={`${transaction.id}-${index}`}
                  style={styles.transactionItem}
                  onPress={() => navigation.navigate('TransactionDetail', { transaction })}>
                  <View style={[styles.transactionIconContainer, styles.depositIconContainer]}>
                    <Icon name="bank-transfer-in" size={20} color="#4CAF50" />
                  </View>
                  <View style={styles.transactionContent}>
                    <View style={styles.transactionInfo}>
                      <Text style={styles.transactionTitle} numberOfLines={2}>
                        {transaction.description}
                      </Text>
                      <Text style={styles.transactionDate}>
                        {formatDate(transaction.date)}
                      </Text>
                    </View>
                    <View style={styles.transactionAmountContainer}>
                      <Text style={styles.transactionAmountPositive}>
                        {formatAmount(transaction.amount)}
                      </Text>
                      <Icon name="chevron-right" size={18} color="#C7C7CC" />
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </>
        )}

        {activeTab === 'refunds' && (
          <>
            <Text style={styles.historyTitle}>Lịch sử hoàn tiền</Text>
            {isLoading && !initialLoadComplete ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
              </View>
            ) : refundTransactions.length === 0 ? (
              <View style={styles.emptyState}>
                <Icon name="cash-refund" size={50} color="#DADADA" />
                <Text style={styles.emptyStateText}>Không có lịch sử hoàn tiền</Text>
                <Text style={styles.emptyStateSubText}>
                  Giao dịch hoàn tiền của bạn sẽ hiển thị ở đây
                </Text>
              </View>
            ) : (
              refundTransactions.map((transaction, index) => (
                <TouchableOpacity
                  key={`${transaction.id}-${index}`}
                  style={styles.transactionItem}
                  onPress={() => navigation.navigate('TransactionDetail', { transaction })}>
                  <View style={[styles.transactionIconContainer, styles.refundIconContainer]}>
                    <Icon name="cash-refund" size={20} color="#007AFF" />
                  </View>
                  <View style={styles.transactionContent}>
                    <View style={styles.transactionInfo}>
                      <Text style={styles.transactionTitle} numberOfLines={2}>
                        {transaction.description}
                      </Text>
                      <Text style={styles.transactionDate}>
                        {formatDate(transaction.date)}
                      </Text>
                    </View>
                    <View style={styles.transactionAmountContainer}>
                      <Text style={styles.transactionAmountPositive}>
                        {formatAmount(transaction.amount)}
                      </Text>
                      <Icon name="chevron-right" size={18} color="#C7C7CC" />
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
  },
  backButton: {
    padding: 4,
  },
  balanceCard: {
    margin: 16,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  balanceLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#000',
  },
  actionsContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#4CAF50',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  secondaryTabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    padding: 4,
  },
  secondaryTabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },
  secondaryTabButtonActive: {
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  secondaryTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
    marginLeft: 4,
  },
  secondaryTabTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  transactionsContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  historyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: '#F8F8FA',
    borderRadius: 12,
  },
  emptyStateText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
    color: '#3C3C43',
  },
  emptyStateSubText: {
    marginTop: 8,
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
  },
  transactionItem: {
    flexDirection: 'row',
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 1,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  transactionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 12,
  },
  depositIconContainer: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  refundIconContainer: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  transactionContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingRight: 12,
    borderBottomWidth: Platform.OS === 'ios' ? 0 : 1,
    borderBottomColor: '#F2F2F7',
  },
  transactionInfo: {
    flex: 1,
    marginRight: 8,
  },
  transactionTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 13,
    color: '#8E8E93',
  },
  transactionAmountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  transactionAmountPositive: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4CAF50',
    marginRight: 4,
  },
  transactionAmountNegative: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FF3B30',
    marginRight: 4,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
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
    fontWeight: '600',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#8E8E93',
  },
});

export default WalletScreen;
