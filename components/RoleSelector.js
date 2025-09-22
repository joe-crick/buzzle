import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from 'react-native';

const RoleSelector = ({onRoleSelect, hasPermission}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sync Vibrate</Text>
      <Text style={styles.subtitle}>Choose your device role</Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.roleButton, styles.masterButton]}
          onPress={() => onRoleSelect('master')}
          disabled={!hasPermission}>
          <Text style={styles.buttonText}>Master Device</Text>
          <Text style={styles.buttonDescription}>
            Controls timing and sends sync signals
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.roleButton, styles.clientButton]}
          onPress={() => onRoleSelect('client')}
          disabled={!hasPermission}>
          <Text style={styles.buttonText}>Client Device</Text>
          <Text style={styles.buttonDescription}>
            Receives signals and syncs vibration
          </Text>
        </TouchableOpacity>
      </View>

      {!hasPermission && (
        <View style={styles.permissionWarning}>
          <Text style={styles.warningText}>
            ⚠️ Vibration permission required
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 40,
  },
  buttonContainer: {
    width: '100%',
    gap: 20,
  },
  roleButton: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  masterButton: {
    backgroundColor: '#007AFF',
  },
  clientButton: {
    backgroundColor: '#34C759',
  },
  buttonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  buttonDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  permissionWarning: {
    marginTop: 30,
    padding: 15,
    backgroundColor: '#FFF3CD',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFEAA7',
  },
  warningText: {
    color: '#856404',
    textAlign: 'center',
    fontSize: 16,
  },
});

export default RoleSelector;