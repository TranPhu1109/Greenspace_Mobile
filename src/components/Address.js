import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Modal,
  FlatList,
  SafeAreaView,
  TextInput,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { api } from '../api/api';

const Address = ({ onAddressChange, initialAddress = {} }) => {
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);

  const [selectedProvinceId, setSelectedProvinceId] = useState(null);
  const [selectedDistrictId, setSelectedDistrictId] = useState(null);
  const [selectedWardId, setSelectedWardId] = useState(null);

  const [selectedProvinceName, setSelectedProvinceName] = useState(initialAddress.provinceName || '');
  const [selectedDistrictName, setSelectedDistrictName] = useState(initialAddress.districtName || '');
  const [selectedWardName, setSelectedWardName] = useState(initialAddress.wardName || '');

  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);

  const [isProvinceModalVisible, setIsProvinceModalVisible] = useState(false);
  const [isDistrictModalVisible, setIsDistrictModalVisible] = useState(false);
  const [isWardModalVisible, setIsWardModalVisible] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProvinces, setFilteredProvinces] = useState([]);
  const [filteredDistricts, setFilteredDistricts] = useState([]);
  const [filteredWards, setFilteredWards] = useState([]);

  // Fetch Provinces
  const fetchProvinces = useCallback(async () => {
    setLoadingProvinces(true);
    try {
      const response = await api.get('/shipping/provinces');
      const fetchedProvinces = response?.data || [];
      setProvinces(fetchedProvinces);
      setFilteredProvinces(fetchedProvinces);

      // Auto-select province based on initialAddress name
      if (initialAddress.provinceName && fetchedProvinces.length > 0 && !selectedProvinceId) {
        const initialProv = fetchedProvinces.find(p => p.provinceName === initialAddress.provinceName);
        if (initialProv) {
          console.log('Auto-selecting province:', initialProv);
          handleProvinceSelect(initialProv);
        } else {
          console.warn(`Initial province name "${initialAddress.provinceName}" not found.`);
        }
      }
    } catch (error) {
      console.error('Error fetching provinces:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách tỉnh/thành.');
      setProvinces([]);
    } finally {
      setLoadingProvinces(false);
    }
  }, [initialAddress.provinceName, selectedProvinceId]);

  // Handle Province Change
  const handleProvinceSelect = useCallback((province) => {
    if (!province) return;
    console.log("Province Selected:", province);

    // Update province
    setSelectedProvinceId(province.provinceId);
    setSelectedProvinceName(province.provinceName);
    
    // Clear district and ward
    setSelectedDistrictId('');
    setSelectedDistrictName('');
    setSelectedWardId('');
    setSelectedWardName('');
    setDistricts([]);
    setWards([]);
    setFilteredDistricts([]);
    setFilteredWards([]);
    
    // Immediately update the parent with partial data
    onAddressChange({
      provinceId: province.provinceId,
      provinceName: province.provinceName,
      districtId: '', districtName: '',
      wardId: '', wardName: ''
    });

    setIsProvinceModalVisible(false);
  }, [onAddressChange]);

  // Handle District Change
  const handleDistrictSelect = useCallback((district) => {
    if (!district) return;
    console.log("District Selected:", district);

    // Update district
    setSelectedDistrictId(district.districtId);
    setSelectedDistrictName(district.districtName);
    
    // Clear ward
    setSelectedWardId('');
    setSelectedWardName('');
    setWards([]);
    setFilteredWards([]);
    
    // Immediately update the parent with partial data
    onAddressChange({
        provinceId: selectedProvinceId,
        provinceName: selectedProvinceName,
        districtId: district.districtId,
        districtName: district.districtName,
        wardId: '', wardName: ''
    });

    setIsDistrictModalVisible(false);
  }, [selectedProvinceId, selectedProvinceName, onAddressChange]);

  // Handle Ward Change
  const handleWardSelect = useCallback((ward) => {
    if (!ward) return;
    console.log("Ward Selected:", ward);
    const currentWardId = ward.wardCode || ward.wardId;

    // Update ward
    setSelectedWardId(currentWardId);
    setSelectedWardName(ward.wardName);
    
    // Immediately update the parent with complete data
    onAddressChange({
      provinceId: selectedProvinceId,
      provinceName: selectedProvinceName,
      districtId: selectedDistrictId,
      districtName: selectedDistrictName,
      wardId: currentWardId,
      wardName: ward.wardName
    });

    setIsWardModalVisible(false);
  }, [selectedProvinceId, selectedProvinceName, selectedDistrictId, selectedDistrictName, onAddressChange]);

  // Fetch Districts when Province changes
  const fetchDistricts = useCallback(async (provinceId) => {
    if (!provinceId) return;
    setLoadingDistricts(true);
    
    try {
      const response = await api.get(`/shipping/districts?provinceId=${provinceId}`);
      const fetchedDistricts = response?.data || [];
      console.log("Fetched Districts:", fetchedDistricts)
      setDistricts(fetchedDistricts);
      setFilteredDistricts(fetchedDistricts);

      // Auto-select district based on initialAddress name if it's a first load
      if (initialAddress.districtName && fetchedDistricts.length > 0) {
        console.log(`Comparing initial district "${initialAddress.districtName}" with fetched districts...`);
        const initialDist = fetchedDistricts.find(d => d.districtName === initialAddress.districtName);
        if (initialDist) {
          console.log('Auto-selecting district:', initialDist);
          handleDistrictSelect(initialDist);
        } else {
          console.log('No exact match found for initial district name.');
        }
      }
    } catch (error) {
      console.error('Error fetching districts:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách quận/huyện.');
      setDistricts([]);
    } finally {
      setLoadingDistricts(false);
    }
  }, [initialAddress.districtName, handleDistrictSelect]);

  // Fetch Wards when District changes
  const fetchWards = useCallback(async (districtId) => {
    if (!districtId) return;
    setLoadingWards(true);
    
    try {
      const response = await api.get(`/shipping/wards?districtId=${districtId}`);
      const fetchedWards = response?.data || [];
      console.log("Fetched Wards:", fetchedWards);
      setWards(fetchedWards);
      setFilteredWards(fetchedWards);

      // Auto-select ward based on initialAddress name if it's a first load
      if (initialAddress.wardName && fetchedWards.length > 0) {
        console.log(`Comparing initial ward "${initialAddress.wardName}" with fetched wards...`);
        const initialWard = fetchedWards.find(w => w.wardName === initialAddress.wardName);
        if (initialWard) {
          console.log('Auto-selecting ward:', initialWard);
          handleWardSelect(initialWard);
        } else {
          console.log('No exact match found for initial ward name.');
        }
      }
    } catch (error) {
      console.error('Error fetching wards:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách phường/xã.');
      setWards([]);
    } finally {
      setLoadingWards(false);
    }
  }, [initialAddress.wardName, handleWardSelect]);

  // Search/Filter Logic
  useEffect(() => {
    setFilteredProvinces(
      provinces.filter(p => p.provinceName.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [searchTerm, provinces]);

  useEffect(() => {
    setFilteredDistricts(
      districts.filter(d => d.districtName.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [searchTerm, districts]);

  useEffect(() => {
    setFilteredWards(
      wards.filter(w => w.wardName.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [searchTerm, wards]);

  // Initial fetch for provinces
  useEffect(() => {
    fetchProvinces();
  }, [fetchProvinces]);

  // Effect to fetch districts when province changes
  useEffect(() => {
    if (selectedProvinceId) {
      console.log('Fetching districts for provinceId:', selectedProvinceId);
      fetchDistricts(selectedProvinceId);
    }
  }, [selectedProvinceId, fetchDistricts]);

  // Effect to fetch wards when district changes
  useEffect(() => {
    if (selectedDistrictId) {
      console.log('Fetching wards for districtId:', selectedDistrictId);
      fetchWards(selectedDistrictId);
    }
  }, [selectedDistrictId, fetchWards]);

  // Reusable Modal Component
  const renderSelectionModal = ({ visible, title, data, onSelect, onClose, loading, keyExtractor, renderLabel }) => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Icon name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm..."
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
          {loading ? (
            <ActivityIndicator size="large" color="#007AFF" style={styles.loadingIndicatorModal} />
          ) : (
            <FlatList
              data={data}
              keyExtractor={keyExtractor}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.modalItem} onPress={() => onSelect(item)}>
                  <Text style={styles.modalItemText}>{renderLabel(item)}</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={<Text style={styles.emptyListText}>Không tìm thấy kết quả</Text>}
            />
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );

  const renderSelectorButton = (label, value, onPress, disabled = false) => (
    <TouchableOpacity
        style={[styles.selectorButton, disabled && styles.disabledButton]}
        onPress={onPress}
        disabled={disabled}
      >
        <View>
          <Text style={styles.selectorLabel}>{label}</Text>
          <Text style={[styles.selectorValue, !value && styles.placeholderText]}>
            {value || `-- Chọn ${label} --`}
          </Text>
        </View>
        <Icon name="chevron-down" size={24} color="#666" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Province Selector */}
      {renderSelectorButton("Tỉnh/Thành phố", selectedProvinceName, () => { setSearchTerm(''); setIsProvinceModalVisible(true); }, loadingProvinces)}
      {renderSelectionModal({
        visible: isProvinceModalVisible,
        title: "Chọn Tỉnh/Thành phố",
        data: filteredProvinces,
        onSelect: handleProvinceSelect,
        onClose: () => setIsProvinceModalVisible(false),
        loading: loadingProvinces,
        keyExtractor: (item) => item.provinceId.toString(),
        renderLabel: (item) => item.provinceName,
      })}

      {/* District Selector */}
      {renderSelectorButton("Quận/Huyện", selectedDistrictName, () => { setSearchTerm(''); setIsDistrictModalVisible(true); }, !selectedProvinceId || loadingDistricts)}
      {renderSelectionModal({
        visible: isDistrictModalVisible,
        title: "Chọn Quận/Huyện",
        data: filteredDistricts,
        onSelect: handleDistrictSelect,
        onClose: () => setIsDistrictModalVisible(false),
        loading: loadingDistricts,
        keyExtractor: (item) => item.districtId.toString(),
        renderLabel: (item) => item.districtName,
      })}

      {/* Ward Selector */}
      {renderSelectorButton("Phường/Xã", selectedWardName, () => { setSearchTerm(''); setIsWardModalVisible(true); }, !selectedDistrictId || loadingWards)}
      {renderSelectionModal({
        visible: isWardModalVisible,
        title: "Chọn Phường/Xã",
        data: filteredWards,
        onSelect: handleWardSelect,
        onClose: () => setIsWardModalVisible(false),
        loading: loadingWards,
        keyExtractor: (item) => (item.wardCode || item.wardId).toString(),
        renderLabel: (item) => item.wardName,
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 10,
  },
  pickerContainer: {
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    backgroundColor: '#fff',
    position: 'relative',
  },
  label: {
    fontSize: 14,
    color: '#666',
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 4,
  },
  pickerWrapper: {
    paddingHorizontal: 5,
  },
  picker: {
    height: 50,
  },
  loadingIndicator: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  selectorButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
    marginBottom: 15,
  },
  selectorLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  selectorValue: {
    fontSize: 16,
    color: '#333',
  },
  placeholderText: {
    color: '#999',
    fontStyle: 'italic',
  },
  disabledButton: {
    backgroundColor: '#f0f0f0',
    borderColor: '#e0e0e0',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    padding: 15,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  searchInput: {
    height: 45,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  modalItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalItemText: {
    fontSize: 16,
    color: '#333',
  },
  loadingIndicatorModal: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyListText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
});

export default Address;
