import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Modal from './Modal';

export const PaymentConfirmationModal = ({ visible, onClose, amount, onConfirm }) => {
  return (
    <Modal visible={visible} onClose={onClose}>
      <View style={styles.modalContent}>
        <Icon name="cash-check" size={50} color="#4CAF50" style={styles.icon} />
        <Text style={styles.title}>Xác nhận thanh toán</Text>
        <Text style={styles.amount}>{amount.toLocaleString()}đ</Text>
        <Text style={styles.description}>
          Bạn có chắc chắn muốn thanh toán số tiền này không?
        </Text>
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Hủy bỏ</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.confirmButton} onPress={onConfirm}>
            <Text style={styles.confirmButtonText}>Xác nhận</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export const InsufficientBalanceModal = ({ visible, onClose, required, balance, onTopUp }) => {
  const missing = required - balance;
  
  return (
    <Modal visible={visible} onClose={onClose}>
      <View style={styles.modalContent}>
        <Icon name="alert-circle" size={50} color="#FF3B30" style={styles.icon} />
        <Text style={styles.title}>Số dư không đủ</Text>
        <Text style={styles.description}>
          Số dư hiện tại của bạn không đủ để thực hiện giao dịch này
        </Text>
        <View style={styles.balanceInfo}>
          <View style={styles.balanceRow}>
            <Text style={styles.balanceLabel}>Số dư hiện tại:</Text>
            <Text style={styles.balanceValue}>{balance.toLocaleString()}đ</Text>
          </View>
          <View style={styles.balanceRow}>
            <Text style={styles.balanceLabel}>Số tiền cần thanh toán:</Text>
            <Text style={styles.balanceValue}>{required.toLocaleString()}đ</Text>
          </View>
          <View style={styles.balanceRow}>
            <Text style={styles.balanceLabel}>Số tiền còn thiếu:</Text>
            <Text style={[styles.balanceValue, { color: '#FF3B30' }]}>{missing.toLocaleString()}đ</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.topUpButton} onPress={onTopUp}>
          <Text style={styles.topUpButtonText}>Nạp tiền ngay</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContent: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  icon: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  amount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 16,
  },
  description: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
    marginRight: 8,
  },
  confirmButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#4CAF50',
    marginLeft: 8,
  },
  cancelButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  balanceInfo: {
    width: '100%',
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#666',
  },
  balanceValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  topUpButton: {
    width: '100%',
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#4CAF50',
    marginTop: 8,
  },
  topUpButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
}); 