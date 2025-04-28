import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useWallet } from '../context/WalletContext';

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
  const [activeTab, setActiveTab] = useState('purchases');

  //console.log("Purchase Transactions:", purchaseTransactions);
  //console.log("Deposit Transactions:", depositTransactions);
  

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refreshWallet();
    setRefreshing(false);
  }, [refreshWallet]);

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
      console.error('Error formatting date:', error);
      return 'Lỗi định dạng ngày';
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>Lỗi: {error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={refreshWallet}>
          <Text style={styles.retryButtonText}>Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

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
        <Text style={styles.balanceAmount}>{balance.toLocaleString('vi-VN')}đ</Text>
      </View>

      {/* Actions */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[styles.actionButton, {backgroundColor: '#4CAF50'}]}
          onPress={() => {
            navigation.navigate('TopUp');
          }}>
          <Icon name="bank-transfer-in" size={24} color="#fff" />
          <Text style={styles.actionButtonText}>Nạp tiền</Text>
        </TouchableOpacity>


      </View>

      {/* Transactions Section */}
      <View style={styles.transactionsContainer}>
        {/* Tab Switcher */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'purchases' && styles.tabButtonActive]}
            onPress={() => setActiveTab('purchases')}
          >
            <Text style={[styles.tabButtonText, activeTab === 'purchases' && styles.tabButtonTextActive]}>
              Lịch sử Mua hàng
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'deposits' && styles.tabButtonActive]}
            onPress={() => setActiveTab('deposits')}
          >
            <Text style={[styles.tabButtonText, activeTab === 'deposits' && styles.tabButtonTextActive]}>
              Lịch sử Nạp tiền
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'refunds' && styles.tabButtonActive]}
            onPress={() => setActiveTab('refunds')}
          >
            <Text style={[styles.tabButtonText, activeTab === 'refunds' && styles.tabButtonTextActive]}>
              Lịch sử Hoàn tiền
            </Text>
          </TouchableOpacity>
        </View>

        {/* Conditional Transaction List */}
        {activeTab === 'purchases' && (
          <>
            {purchaseTransactions.length === 0 ? (
              <View style={styles.emptyTransactions}>
                <Icon name="cart-off" size={50} color="#CCCCCC" />
                <Text style={styles.emptyTransactionsText}>
                  Không có lịch sử mua hàng
                </Text>
              </View>
            ) : (
              purchaseTransactions.map((transaction, index) => (
                <TouchableOpacity
                  key={`${transaction.id}-${index}-purchase`}
                  style={styles.transactionItem}
                  onPress={() => navigation.navigate('TransactionDetail', { transaction })}>
                  <View style={styles.transactionLeft}>
                    <Text style={styles.transactionDescription} numberOfLines={2}>
                      {transaction.description}
                    </Text>
                    <Text style={styles.transactionDate}>
                      {formatDate(transaction.date)}
                    </Text>
                  </View>
                  <View style={styles.transactionRight}>
                    <Text
                      style={[
                        styles.transactionAmount,
                        {color: '#FF3B30'},
                      ]}>
                      {formatAmount(-transaction.amount)}
                    </Text>
                    <Icon name="chevron-right" size={20} color="#8E8E93" />
                  </View>
                </TouchableOpacity>
              ))
            )}
          </>
        )}

        {activeTab === 'deposits' && (
          <>
            {depositTransactions.length === 0 ? (
              <View style={styles.emptyTransactions}>
                <Icon name="cash-refund" size={50} color="#CCCCCC" />
                <Text style={styles.emptyTransactionsText}>
                  Không có lịch sử nạp tiền
                </Text>
              </View>
            ) : (
              depositTransactions.map((transaction, index) => (
                <TouchableOpacity
                  key={`${transaction.id}-${index}-deposit`}
                  style={styles.transactionItem}
                  onPress={() => navigation.navigate('TransactionDetail', { transaction })}>
                  <View style={styles.transactionLeft}>
                    <Text style={styles.transactionDescription} numberOfLines={2}>
                      {transaction.description}
                    </Text>
                    <Text style={styles.transactionDate}>
                      {formatDate(transaction.date)}
                    </Text>
                  </View>
                  <View style={styles.transactionRight}>
                    <Text
                      style={[
                        styles.transactionAmount,
                        {color: '#4CAF50'},
                      ]}>
                       {formatAmount(transaction.amount)}
                    </Text>
                    <Icon name="chevron-right" size={20} color="#8E8E93" />
                  </View>
                </TouchableOpacity>
              ))
            )}
          </>
        )}

        {activeTab === 'refunds' && (
          <>
            {refundTransactions.length === 0 ? (
              <View style={styles.emptyTransactions}>
                <Icon name="cash-refund" size={50} color="#CCCCCC" />
                <Text style={styles.emptyTransactionsText}>
                  Không có lịch sử hoàn tiền
                </Text>
              </View>
            ) : (
              refundTransactions.map((transaction, index) => (
                <TouchableOpacity
                  key={`${transaction.id}-${index}-refund`}
                  style={styles.transactionItem}
                  onPress={() => navigation.navigate('TransactionDetail', { transaction })}>
                  <View style={styles.transactionLeft}>
                    <Text style={styles.transactionDescription} numberOfLines={2}>
                      {transaction.description}
                    </Text>
                    <Text style={styles.transactionDate}>
                      {formatDate(transaction.date)}
                    </Text>
                  </View>
                  <View style={styles.transactionRight}>
                    <Text
                      style={[
                        styles.transactionAmount,
                        { color: '#4CAF50' },
                      ]}>
                      {formatAmount(transaction.amount)}
                    </Text>
                    <Icon name="chevron-right" size={20} color="#8E8E93" />
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
    backgroundColor: '#f5f5f5',
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
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  transactionsContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    minHeight: 300,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    backgroundColor: '#f9f9f9',
    marginBottom: 8,
    borderRadius: 8,
  },
  transactionLeft: {
    flex: 1,
    marginRight: 8,
  },
  transactionDescription: {
    fontSize: 16,
    color: '#000',
    marginBottom: 4,
    fontWeight: '500',
  },
  transactionDate: {
    fontSize: 14,
    color: '#666',
  },
  transactionRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
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
  emptyTransactions: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyTransactionsText: {
    marginTop: 16,
    fontSize: 16,
    color: '#999',
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  tabButton: {
    flex: 1,
    paddingBottom: 12,
    paddingTop: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: '#007AFF',
  },
  tabButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#666',
  },
  tabButtonTextActive: {
    color: '#007AFF',
    fontWeight: '700',
  },
});

export default WalletScreen;
