import React, {useState, useEffect, useRef} from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';

import WebSocketService from '../services/WebSocketService';
import VibrationService from '../services/VibrationService';
import TimingService from '../services/TimingService';
import {MESSAGE_TYPES} from '../utils/messageTypes';

const ClientComponent = ({onBack}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [serverUrl, setServerUrl] = useState('ws://192.168.1.100:8080');
  const [sessionActive, setSessionActive] = useState(false);
  const [sessionInfo, setSessionInfo] = useState(null);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [timingStats, setTimingStats] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('Disconnected');
  
  const beatScheduleRef = useRef([]);
  const deviceIdRef = useRef('client-' + Date.now());

  useEffect(() => {
    setupWebSocketListeners();
    return () => {
      cleanupSession();
      WebSocketService.disconnect();
    };
  }, []);

  const setupWebSocketListeners = () => {
    WebSocketService.on('open', handleConnectionOpen);
    WebSocketService.on('message', handleMessage);
    WebSocketService.on('close', handleConnectionClose);
    WebSocketService.on('error', handleConnectionError);
  };

  const handleConnectionOpen = () => {
    setIsConnected(true);
    setConnectionStatus('Connected');
    console.log('Client connected to server');
    
    // Register as client
    WebSocketService.send({
      type: MESSAGE_TYPES.REGISTER,
      role: 'client',
      deviceId: deviceIdRef.current,
    });

    // Start latency calibration
    performLatencyCalibration();
  };

  const handleConnectionClose = () => {
    setIsConnected(false);
    setConnectionStatus('Disconnected');
    cleanupSession();
  };

  const handleConnectionError = (error) => {
    Alert.alert('Connection Error', 'Failed to connect to server');
    console.error('WebSocket error:', error);
  };

  const handleMessage = (data) => {
    switch (data.type) {
      case MESSAGE_TYPES.PONG:
        TimingService.resolvePing && TimingService.resolvePing(data);
        break;
      
      case MESSAGE_TYPES.START_SESSION:
        handleSessionStart(data);
        break;
      
      case MESSAGE_TYPES.END_SESSION:
        handleSessionEnd();
        break;
      
      case MESSAGE_TYPES.HEARTBEAT:
        handleHeartbeat(data);
        break;
      
      default:
        console.log('Received unknown message:', data);
    }
  };

  const performLatencyCalibration = async () => {
    console.log('Starting latency calibration...');
    setConnectionStatus('Calibrating...');
    
    for (let i = 0; i < 5; i++) {
      const result = await TimingService.measureLatency((pingData) => {
        WebSocketService.send(pingData);
      });
      
      if (result.success) {
        console.log(`Ping ${i + 1}: ${result.networkLatency}ms latency`);
      }
      
      // Wait a bit between pings
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    setTimingStats(TimingService.getStats());
    setConnectionStatus('Ready');
  };

  const handleSessionStart = (data) => {
    console.log('Session starting:', data);
    
    setSessionInfo({
      tempo: data.tempo,
      duration: data.duration,
      startTime: data.startTime,
    });

    // Schedule client vibrations
    const clientBeats = data.schedule || [];
    beatScheduleRef.current = clientBeats;
    
    scheduleVibrations(clientBeats);
    setSessionActive(true);
    setCurrentBeat(0);
  };

  const handleSessionEnd = () => {
    console.log('Session ended');
    cleanupSession();
  };

  const handleHeartbeat = (data) => {
    // Respond to heartbeat to maintain connection
    WebSocketService.send({
      type: MESSAGE_TYPES.HEARTBEAT_RESPONSE,
      clientId: deviceIdRef.current,
      timestamp: Date.now(),
    });
  };

  const scheduleVibrations = (clientBeats) => {
    clientBeats.forEach((beat) => {
      const localTime = TimingService.calculateLocalScheduleTime(beat.serverTime);
      
      setTimeout(() => {
        VibrationService.vibrate(100);
        setCurrentBeat(beat.beatNumber);
      }, Math.max(0, localTime - Date.now()));
    });
  };

  const connectToServer = () => {
    if (!serverUrl.trim()) {
      Alert.alert('Error', 'Please enter a valid server URL');
      return;
    }
    
    WebSocketService.connect(serverUrl);
  };

  const disconnect = () => {
    cleanupSession();
    WebSocketService.disconnect();
  };

  const cleanupSession = () => {
    setSessionActive(false);
    setSessionInfo(null);
    setCurrentBeat(0);
    VibrationService.cancelAllScheduled();
    VibrationService.stop();
    beatScheduleRef.current = [];
  };

  const testVibration = () => {
    VibrationService.vibrate(200);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Client Device</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Server Connection</Text>
        <TextInput
          style={styles.input}
          value={serverUrl}
          onChangeText={setServerUrl}
          placeholder="ws://server-ip:port"
          editable={!isConnected}
        />
        
        {!isConnected ? (
          <TouchableOpacity style={styles.connectButton} onPress={connectToServer}>
            <Text style={styles.buttonText}>Connect</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.disconnectButton} onPress={disconnect}>
            <Text style={styles.buttonText}>Disconnect</Text>
          </TouchableOpacity>
        )}
        
        <Text style={[styles.status, {color: isConnected ? '#34C759' : '#FF3B30'}]}>
          {connectionStatus}
        </Text>
      </View>

      {isConnected && (
        <>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Timing Stats</Text>
            {timingStats && (
              <View style={styles.statsContainer}>
                <Text style={styles.statText}>
                  Latency: {Math.round(timingStats.latency)}ms
                </Text>
                <Text style={styles.statText}>
                  Calibrated: {timingStats.isCalibrated ? 'Yes' : 'No'}
                </Text>
                <Text style={styles.statText}>
                  Suitable: {timingStats.isTimingSuitable ? 'Yes' : 'No'}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Test</Text>
            <TouchableOpacity style={styles.testButton} onPress={testVibration}>
              <Text style={styles.buttonText}>Test Vibration</Text>
            </TouchableOpacity>
          </View>

          {sessionInfo && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Current Session</Text>
              <View style={styles.sessionInfoContainer}>
                <Text style={styles.sessionInfoText}>
                  Tempo: {sessionInfo.tempo} BPM
                </Text>
                <Text style={styles.sessionInfoText}>
                  Duration: {sessionInfo.duration} seconds
                </Text>
              </View>
            </View>
          )}

          {sessionActive && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Session Active</Text>
              <Text style={styles.activeBeatText}>Beat: {currentBeat}</Text>
              <Text style={styles.statusText}>
                Waiting for master signals...
              </Text>
            </View>
          )}

          {!sessionActive && isConnected && connectionStatus === 'Ready' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Status</Text>
              <Text style={styles.readyText}>
                🟢 Ready for session
              </Text>
              <Text style={styles.waitingText}>
                Waiting for master to start session
              </Text>
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  backButton: {
    marginRight: 15,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  section: {
    margin: 15,
    padding: 15,
    backgroundColor: 'white',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 10,
  },
  connectButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  disconnectButton: {
    backgroundColor: '#FF3B30',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  testButton: {
    backgroundColor: '#FF9500',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  status: {
    textAlign: 'center',
    marginTop: 10,
    fontSize: 16,
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statText: {
    fontSize: 14,
    color: '#666',
  },
  sessionInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sessionInfoText: {
    fontSize: 16,
    color: '#333',
  },
  activeBeatText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    textAlign: 'center',
    marginBottom: 10,
  },
  statusText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  readyText: {
    fontSize: 18,
    color: '#34C759',
    textAlign: 'center',
    marginBottom: 5,
  },
  waitingText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

export default ClientComponent;