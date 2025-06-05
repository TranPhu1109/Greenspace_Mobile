import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/api';

const SettingsScreen = ({ navigation }) => {
  const { logout } = useAuth();
  const appVersion = '1.0.0'; 

  const [policies, setPolicies] = useState([]);
  const [loadingPolicies, setLoadingPolicies] = useState(true);
  const [errorPolicies, setErrorPolicies] = useState(null);

  useEffect(() => {
    const fetchPolicies = async () => {
      try {
        setLoadingPolicies(true);
        const response = await api.get('/policy');
        if (Array.isArray(response)) {
          setPolicies(response);
          setErrorPolicies(null);
        } else {
          setPolicies([]);
          setErrorPolicies('Unexpected API response format.');
          console.error('Unexpected API response for policies:', response);
        }
      } catch (error) {
        setErrorPolicies('Failed to load policies.');
        console.error('Error fetching policies:', error);
      } finally {
        setLoadingPolicies(false);
      }
    };

    fetchPolicies();
  }, []);

  const handleLogout = () => {
    Alert.alert(
      'Đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất?',
      [
        {
          text: 'Hủy',
          style: 'cancel'
        },
        {
          text: 'Đăng xuất',
          style: 'destructive',
          onPress: () => {
            logout();
            navigation.reset({
              index: 0,
              routes: [{ name: 'MainTabs' }],
            });
          }
        }
      ]
    );
  };

  return (
    <View style={styles.mainContainer}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon name="chevron-left" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cài đặt</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.container} removeClippedSubviews={false}>
        <View style={styles.section}>
          {loadingPolicies ? (
            <ActivityIndicator size="small" color="#007AFF" />
          ) : errorPolicies ? (
            <Text style={styles.errorText}>{errorPolicies}</Text>
          ) : policies.length > 0 ? (
            policies.map((policy) => (
              <TouchableOpacity
                key={policy.id}
                style={styles.option}
                onPress={() => navigation.navigate('PolicyDetail', { policyId: policy.id, policyName: policy.documentName })}
              >
                <Icon name="shield-check-outline" size={24} color="#007AFF" />
                <Text style={styles.optionText}>{policy.documentName}</Text>
                <Icon name="chevron-right" size={24} color="#8E8E93" />
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.noPoliciesText}>No policies found.</Text>
          )}

          <TouchableOpacity style={styles.option}>
            <Icon name="help-circle-outline" size={24} color="#007AFF" />
            <Text style={styles.optionText}>Trung tâm trợ giúp</Text>
            <Icon name="chevron-right" size={24} color="#8E8E93" />
          </TouchableOpacity>

          <View style={styles.versionContainer}>
            <Text style={styles.versionText}>Version {appVersion}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
  },
  backButton: {
    padding: 4,
  },
  container: {
    flex: 1,
  },
  section: {
    padding: 15,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 15,
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
    marginTop: 20,
  },
  noPoliciesText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 20,
  },
  versionContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  versionText: {
    fontSize: 14,
    color: '#8E8E93',
  },
  logoutButton: {
    margin: 20,
    padding: 15,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    alignItems: 'center',
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SettingsScreen; 