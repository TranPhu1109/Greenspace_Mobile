import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const TransactionDetailScreen = ({ navigation, route }) => {
    const transaction = route.params?.transaction;

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity 
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}
                >
                    <Icon name="chevron-left" size={28} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Chi tiết giao dịch</Text>
                <View style={{ width: 28 }} />
            </View>

            {/* Transaction Summary Card */}
            <View style={styles.summaryCard}>
                <Text style={styles.transactionDescription}>
                    {transaction?.description}
                </Text>
                <Text style={[
                    styles.transactionAmount,
                    { color: transaction?.amount < 0 ? '#000' : '#4CAF50' }
                ]}>
                    {transaction?.amount?.toLocaleString()}đ
                </Text>
                <Text style={styles.transactionStatus}>Thành công</Text>
            </View>

            {/* Transaction Details */}
            <View style={styles.detailsCard}>
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Mã giao dịch</Text>
                    <Text style={styles.detailValue}>{transaction?.id}</Text>
                </View>
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Thời gian giao dịch</Text>
                    <Text style={styles.detailValue}>{transaction?.date} {transaction?.time}</Text>
                </View>
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Mã đơn hàng</Text>
                    <Text style={styles.detailValue}>DH{transaction?.id}</Text>
                </View>
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Phương thức thanh toán</Text>
                    <Text style={styles.detailValue}>Ví</Text>
                </View>
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
    summaryCard: {
        margin: 16,
        padding: 20,
        backgroundColor: '#E5E5EA',
        borderRadius: 12,
        alignItems: 'center',
    },
    transactionDescription: {
        fontSize: 16,
        color: '#000',
        marginBottom: 8,
    },
    transactionAmount: {
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    transactionStatus: {
        fontSize: 14,
        color: '#4CAF50',
    },
    detailsCard: {
        margin: 16,
        padding: 16,
        backgroundColor: '#fff',
        borderRadius: 12,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5EA',
    },
    detailLabel: {
        fontSize: 14,
        color: '#666',
    },
    detailValue: {
        fontSize: 14,
        color: '#000',
        fontWeight: '500',
    },
});

export default TransactionDetailScreen; 