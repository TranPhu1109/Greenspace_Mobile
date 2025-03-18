import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const SettingsScreen = ({ navigation }) => {
  const appVersion = '1.0.0'; 

  return (
    <View style={styles.mainContainer}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon name="chevron-left" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.container} removeClippedSubviews={false}>
        <View style={styles.section}>
          <TouchableOpacity style={styles.option}>
            <Icon name="shield-check-outline" size={24} color="#007AFF" />
            <Text style={styles.optionText}>Privacy Policy</Text>
            <Icon name="chevron-right" size={24} color="#8E8E93" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.option}>
            <Icon name="file-document-outline" size={24} color="#007AFF" />
            <Text style={styles.optionText}>Terms of Service</Text>
            <Icon name="chevron-right" size={24} color="#8E8E93" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.option}>
            <Icon name="help-circle-outline" size={24} color="#007AFF" />
            <Text style={styles.optionText}>Help Center</Text>
            <Icon name="chevron-right" size={24} color="#8E8E93" />
          </TouchableOpacity>

          <View style={styles.versionContainer}>
            <Text style={styles.versionText}>Version {appVersion}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutButton}>
          <Text style={styles.logoutText}>Log Out</Text>
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