import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useWallet } from '../context/WalletContext';

const WalletScreen = ({navigation}) => {
  const { balance, transactions } = useWallet();

  const formatAmount = amount => {
    const absAmount = Math.abs(amount);
    return `${amount < 0 ? '-' : '+'}${absAmount.toLocaleString()}đ`;
  };

  return (
    <View style={styles.container}>
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
        <Text style={styles.balanceAmount}>{balance.toLocaleString()}đ</Text>
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

        <TouchableOpacity
          style={[styles.actionButton, {backgroundColor: '#007AFF'}]}
          onPress={() => {
            /* Handle withdraw */
          }}>
          <Icon name="bank-transfer-out" size={24} color="#fff" />
          <Text style={styles.actionButtonText}>Rút tiền</Text>
        </TouchableOpacity>
      </View>

      {/* Transactions */}
      <View style={styles.transactionsContainer}>
        <Text style={styles.sectionTitle}>Lịch sử giao dịch</Text>
        <ScrollView>
          {transactions.map(transaction => (
            <TouchableOpacity
              key={transaction.id}
              style={styles.transactionItem}
              onPress={() => navigation.navigate('TransactionDetail', { transaction })}>
              <View style={styles.transactionLeft}>
                <Text style={styles.transactionDescription}>
                  {transaction.description}
                </Text>
                <Text style={styles.transactionDate}>
                  {transaction.date} - {transaction.time}
                </Text>
              </View>
              <View style={styles.transactionRight}>
                <Text
                  style={[
                    styles.transactionAmount,
                    {color: transaction.amount < 0 ? '#000' : '#4CAF50'},
                  ]}>
                  {formatAmount(transaction.amount)}
                </Text>
                <Icon name="chevron-right" size={20} color="#8E8E93" />
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
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
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    backgroundColor: '#f5f5f5',
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
});

export default WalletScreen;
