import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList, TextInput, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Individual status definitions - combined duplicates with arrays of values
const ALL_STATUSES = [
  { id: 'all', name: 'Tất cả', value: null },
  { id: 'pending', name: 'Chờ xử lý', value: 'pending' },
  { 
    id: 'consulting', 
    name: 'Đang tư vấn & phác thảo', 
    value: ['consultingandsketching', 'determiningdesignprice'] 
  },
  { id: 'depositsuccessful', name: 'Đặt cọc thành công', value: 'depositsuccessful' },
  { 
    id: 'designing', 
    name: 'Đang trong quá trình thiết kế', 
    value: ['assigntodesigner', 'determiningmaterialprice'] 
  },
  { id: 'donedesign', name: 'Hoàn thành thiết kế', value: 'donedesign' },
  { id: 'paymentsuccess', name: 'Thanh toán thành công', value: 'paymentsuccess' },
  { id: 'processing', name: 'Đang xử lý', value: 'processing' },
  { id: 'pickedpackageanddelivery', name: 'Đã lấy hàng & đang giao', value: 'pickedpackageanddelivery' },
  { id: 'deliveryfail', name: 'Giao hàng thất bại', value: 'deliveryfail' },
  { id: 'redelivery', name: 'Giao lại', value: 'redelivery' },
  { id: 'deliveredsuccessfully', name: 'Đã giao hàng thành công', value: 'deliveredsuccessfully' },
  { id: 'completeorder', name: 'Hoàn thành đơn hàng', value: 'completeorder' },
  { id: 'ordercancelled', name: 'Đơn hàng đã bị hủy', value: 'ordercancelled' },
  { id: 'warning', name: 'Cảnh báo vượt 30%', value: 'warning' },
  { id: 'refund', name: 'Hoàn tiền', value: 'refund' },
  { id: 'donerefund', name: 'Đã hoàn tiền', value: 'donerefund' },
  { id: 'stopservice', name: 'Dừng dịch vụ', value: 'stopservice' },
  { id: 'reconsultingandsketching', name: 'Phác thảo lại', value: 'reconsultingandsketching' },
  { id: 'redesign', name: 'Thiết kế lại', value: 'redesign' },
  { id: 'waitdeposit', name: 'Chờ đặt cọc', value: 'waitdeposit' },
  { id: 'donedeterminingdesignprice', name: 'Hoàn thành tư vấn & phác thảo', value: 'donedeterminingdesignprice' },
  { id: 'donedeterminingmaterialprice', name: 'Hoàn thành xác định giá vật liệu', value: 'donedeterminingmaterialprice' },
  { id: 'redeterminingdesignprice', name: 'Xác định lại giá thiết kế', value: 'redeterminingdesignprice' },
  { id: 'exchangeprodcut', name: 'Đổi sản phẩm', value: 'exchangeprodcut' },
  { id: 'waitforscheduling', name: 'Chờ lên lịch', value: 'waitforscheduling' },
  { id: 'installing', name: 'Đang lắp đặt', value: 'installing' },
  { id: 'doneinstalling', name: 'Đã lắp đặt xong', value: 'doneinstalling' },
  { id: 'reinstall', name: 'Lắp đặt lại', value: 'reinstall' },
  { id: 'customerconfirm', name: 'Khách hàng xác nhận', value: 'customerconfirm' },
  { id: 'successfully', name: 'Thành công', value: 'successfully' }
];

// Group headers for organization
const STATUS_CATEGORIES = [
  { id: 'design', name: 'Thiết kế', isHeader: true },
  { id: 'payment', name: 'Thanh toán', isHeader: true },
  { id: 'delivery', name: 'Giao hàng & Lắp đặt', isHeader: true },
  { id: 'completion', name: 'Hoàn thành & Hủy', isHeader: true }
];

// Organize statuses by category for display - updated to use combined statuses
const ORGANIZED_STATUSES = [
  ALL_STATUSES[0], // All
  STATUS_CATEGORIES[0], // Design header
  ...ALL_STATUSES.filter(s => {
    if (!s.value) return false;
    const values = Array.isArray(s.value) ? s.value : [s.value];
    return values.some(v => [
      'consultingandsketching', 'determiningdesignprice', 'assigntodesigner', 
      'determiningmaterialprice', 'donedesign', 'donedeterminingdesignprice',
      'reconsultingandsketching', 'redesign'
    ].includes(v));
  }),
  STATUS_CATEGORIES[1], // Payment header
  ...ALL_STATUSES.filter(s => {
    if (!s.value) return false;
    const values = Array.isArray(s.value) ? s.value : [s.value];
    return values.some(v => [
      'waitdeposit', 'depositsuccessful', 'paymentsuccess', 'refund', 
      'donerefund'
    ].includes(v));
  }),
  STATUS_CATEGORIES[2], // Delivery header
  ...ALL_STATUSES.filter(s => {
    if (!s.value) return false;
    const values = Array.isArray(s.value) ? s.value : [s.value];
    return values.some(v => [
      'processing', 'pickedpackageanddelivery', 'deliveryfail', 'redelivery',
      'deliveredsuccessfully', 'installing', 'doneinstalling', 'reinstall',
      'waitforscheduling', 'exchangeprodcut'
    ].includes(v));
  }),
  STATUS_CATEGORIES[3], // Completion header
  ...ALL_STATUSES.filter(s => {
    if (!s.value) return false;
    const values = Array.isArray(s.value) ? s.value : [s.value];
    return values.some(v => [
      'completeorder', 'ordercancelled', 'stopservice', 'customerconfirm', 
      'successfully', 'warning'
    ].includes(v));
  }),
];

// Date filter options
const DATE_FILTERS = [
  { id: 'all', name: 'Tất cả' },
  { id: 'today', name: 'Hôm nay' },
  { id: 'week', name: 'Tuần này' },
  { id: 'month', name: 'Tháng này' },
  { id: '3months', name: '3 tháng qua' }
];

const OrderFilterBar = ({ onFilterChange }) => {
  const [searchText, setSearchText] = useState('');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(ALL_STATUSES[0]);
  const [selectedDateFilter, setSelectedDateFilter] = useState(DATE_FILTERS[0]);

  // Update parent component when filters change
  useEffect(() => {
    onFilterChange({
      searchText,
      status: selectedStatus,
      dateFilter: selectedDateFilter
    });
  }, [searchText, selectedStatus, selectedDateFilter]);

  const renderStatusItem = ({ item }) => {
    if (item.isHeader) {
      return (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeaderText}>{item.name}</Text>
        </View>
      );
    }
    
    return (
      <TouchableOpacity
        style={[
          styles.modalItem,
          selectedStatus.id === item.id && styles.selectedModalItem
        ]}
        onPress={() => {
          setSelectedStatus(item);
          setShowStatusModal(false);
        }}
      >
        <Text style={[
          styles.modalItemText,
          selectedStatus.id === item.id && styles.selectedModalItemText
        ]}>
          {item.name}
        </Text>
        {selectedStatus.id === item.id && (
          <Icon name="check" size={18} color="#007AFF" />
        )}
      </TouchableOpacity>
    );
  };

  const renderDateItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.modalItem,
        selectedDateFilter.id === item.id && styles.selectedModalItem
      ]}
      onPress={() => {
        setSelectedDateFilter(item);
        setShowDateModal(false);
      }}
    >
      <Text style={[
        styles.modalItemText,
        selectedDateFilter.id === item.id && styles.selectedModalItemText
      ]}>
        {item.name}
      </Text>
      {selectedDateFilter.id === item.id && (
        <Icon name="check" size={18} color="#007AFF" />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Icon name="magnify" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm theo tên, số điện thoại..."
          placeholderTextColor="#999"
          value={searchText}
          onChangeText={setSearchText}
        />
        {searchText !== '' && (
          <TouchableOpacity onPress={() => setSearchText('')}>
            <Icon name="close-circle" size={16} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.filterButtons}>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowStatusModal(true)}
        >
          <Text style={styles.filterButtonText} numberOfLines={1}>
            {selectedStatus.name}
          </Text>
          <Icon name="chevron-down" size={16} color="#666" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowDateModal(true)}
        >
          <Text style={styles.filterButtonText} numberOfLines={1}>
            {selectedDateFilter.name}
          </Text>
          <Icon name="chevron-down" size={16} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Status Filter Modal */}
      <Modal
        visible={showStatusModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowStatusModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowStatusModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn trạng thái</Text>
              <TouchableOpacity onPress={() => setShowStatusModal(false)}>
                <Icon name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={ORGANIZED_STATUSES}
              renderItem={renderStatusItem}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.modalList}
              stickyHeaderIndices={[]}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Date Filter Modal */}
      <Modal
        visible={showDateModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDateModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowDateModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn thời gian</Text>
              <TouchableOpacity onPress={() => setShowDateModal(false)}>
                <Icon name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={DATE_FILTERS}
              renderItem={renderDateItem}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.modalList}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
    marginBottom: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  filterButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flex: 0.48,
  },
  filterButtonText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '80%',
    maxHeight: '80%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  modalList: {
    paddingVertical: 5,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  selectedModalItem: {
    backgroundColor: '#f0f8ff',
  },
  modalItemText: {
    fontSize: 16,
    color: '#333',
  },
  selectedModalItemText: {
    color: '#007AFF',
    fontWeight: '500',
  },
  sectionHeader: {
    backgroundColor: '#f8f8f8',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sectionHeaderText: {
    fontWeight: '600',
    color: '#666',
    fontSize: 14,
  }
});

export default OrderFilterBar; 