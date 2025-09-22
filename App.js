import React, {useState, useEffect} from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  StatusBar,
} from 'react-native';
import {check, request, PERMISSIONS, RESULTS} from 'react-native-permissions';

import RoleSelector from './components/RoleSelector';
import MasterComponent from './components/MasterComponent';
import ClientComponent from './components/ClientComponent';

const App = () => {
  const [deviceRole, setDeviceRole] = useState(null); // 'master', 'client', or null
  const [hasVibrationPermission, setHasVibrationPermission] = useState(false);

  useEffect(() => {
    checkVibrationPermission();
  }, []);

  const checkVibrationPermission = async () => {
    try {
      const result = await check(PERMISSIONS.ANDROID.VIBRATE);
      if (result === RESULTS.GRANTED) {
        setHasVibrationPermission(true);
      } else {
        requestVibrationPermission();
      }
    } catch (error) {
      console.log('Permission check error:', error);
    }
  };

  const requestVibrationPermission = async () => {
    try {
      const result = await request(PERMISSIONS.ANDROID.VIBRATE);
      setHasVibrationPermission(result === RESULTS.GRANTED);
    } catch (error) {
      console.log('Permission request error:', error);
      Alert.alert('Permission Error', 'Unable to request vibration permission');
    }
  };

  const handleRoleSelection = (role) => {
    if (!hasVibrationPermission) {
      Alert.alert(
        'Permission Required',
        'Vibration permission is required for this app to work.',
        [
          {text: 'OK', onPress: requestVibrationPermission},
        ]
      );
      return;
    }
    setDeviceRole(role);
  };

  const handleBackToRoleSelection = () => {
    setDeviceRole(null);
  };

  const renderContent = () => {
    if (!deviceRole) {
      return (
        <RoleSelector 
          onRoleSelect={handleRoleSelection}
          hasPermission={hasVibrationPermission}
        />
      );
    }

    if (deviceRole === 'master') {
      return (
        <MasterComponent 
          onBack={handleBackToRoleSelection}
        />
      );
    }

    if (deviceRole === 'client') {
      return (
        <ClientComponent 
          onBack={handleBackToRoleSelection}
        />
      );
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      {renderContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
});

export default App;