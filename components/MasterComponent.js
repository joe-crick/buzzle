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

const MasterComponent = ({onBack}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectedClients, setConnectedClients] = useState([]);
  const [sessionActive, setSessionActive] = useState(false);
  const [serverUrl, setServerUrl] = useState('ws://192.168.1.100:8080');
  const [tempo, setTempo] = useState('60');
  const [duration, setDuration] = useState('30');
  const [currentBeat, setCurrentBeat] = useState(0);
  const [timingStats, setTimingStats] = useState(null);
  
  const beatScheduleRef = useRef([]);
  const beatTimeoutRef = useRef(null);

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
    console.log('Master connected to server');
    
    // Register as master
    WebSocketService.send({
      type: MESSAGE_TYPES.REGISTER,
      role: 'master',
      deviceId: 'master-' + Date.now(),
    });

    // Start latency calibration
    performLatencyCalibration();
  };

  const handleConnectionClose = () => {
    setIsConnected(false);
    setConnectedClients([]);
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
      
      case MESSAGE_TYPES.CLIENT_LIST:
        setConnectedClients(data.clients || []);
        break;
      
      case MESSAGE_TYPES.CLIENT_CONNECTED:
        setConnectedClients(prev => [...prev, data.client]);
        break;
      
      case MESSAGE_TYPES.CLIENT_DISCONNECTED:
        setConnectedClients(prev => prev.filter(c => c.id !== data.clientId));
        break;
      
      default:
        console.log('Received unknown message:', data);
    }
  };

  const performLatencyCalibration = async () => {
    console.log('Starting latency calibration...');
    
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

  const startSession = () => {
    if (connectedClients.length === 0) {
      Alert.alert('No Clients', 'No client devices are connected');
      return;
    }

    if (!TimingService.isTimingSuitable()) {
      Alert.alert(
        'Poor Connection',
        'Network latency is too high for accurate synchronization. Continue anyway?',
        [
          {text: 'Cancel', style: 'cancel'},
          {text: 'Continue', onPress: () => startSessionForced()},
        ]
      );
      return;
    }

    startSessionForced();
  };

  const startSessionForced = () => {
    const tempoNum = parseInt(tempo) || 60;
    const durationNum = parseInt(duration) || 30;
    const startTime = TimingService.getServerTime() + 3000; // Start in 3 seconds

    // Generate beat schedule
    const schedule = TimingService.generateBeatSchedule(
      startTime,
      tempoNum,
      durationNum,
      true // alternating beats
    );

    beatScheduleRef.current = schedule;

    // Send start command to all clients
    WebSocketService.send({
      type: MESSAGE_TYPES.START_SESSION,
      tempo: tempoNum,
      duration: durationNum,
      startTime: startTime,
      schedule: schedule.filter(beat => !beat.shouldVibrate), // Send client beats only
    });

    // Schedule master vibrations
    scheduleVibrations(schedule.filter(beat => beat.shouldVibrate));
    setSessionActive(true);
    setCurrentBeat(0);
  };

  const scheduleVibrations = (masterBeats) => {
    masterBeats.forEach((beat, index) => {
      const localTime = TimingService.calculateLocalScheduleTime(beat.serverTime);
      
      setTimeout(() => {
        VibrationService.vibrate(100);
        setCurrentBeat(beat.beatNumber);
      }, localTime - Date.now());
    });

    // Schedule session end
    if (masterBeats.length > 0) {
      const lastBeat = masterBeats[masterBeats.length - 1];
      const sessionEndTime = TimingService.calculateLocalScheduleTime(lastBeat.serverTime + 1000);
      
      beatTimeoutRef.current = setTimeout(() => {
        endSession();
      }, sessionEndTime - Date.now());
    }
  };

  const endSession = () => {
    WebSocketService.send({
      type: MESSAGE_TYPES.END_SESSION,
    });
    
    cleanupSession();
  };

  const cleanupSession = () => {
    setSessionActive(false);
    setCurrentBeat(0);
    VibrationService.cancelAllScheduled();
    VibrationService.stop();
    
    if (beatTimeoutRef.current) {
      clearTimeout(beatTimeoutRef.current);
      beatTimeoutRef.current = null;
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Master Device</Text>
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
          {isConnected ? 'Connected' : 'Disconnected'}
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
            <Text style={styles.sectionTitle}>Connected Clients ({connectedClients.length})</Text>
            {connectedClients.map((client, index) => (
              <View key={client.id} style={styles.clientItem}>
                <Text style={styles.clientText}>Client {index + 1}</Text>
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Session Settings</Text>
            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>Tempo (BPM):</Text>
              <TextInput
                style={styles.numberInput}
                value={tempo}
                onChangeText={setTempo}
                keyboardType="numeric"
                editable={!sessionActive}
              />
            </View>
            
            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>Duration (sec):</Text>
              <TextInput
                style={styles.numberInput}
                value={duration}
                onChangeText={setDuration}
                keyboardType="numeric"
                editable={!sessionActive}
              />
            </View>
          </View>

          <View style={styles.section}>
            {!sessionActive ? (
              <TouchableOpacity 
                style={[styles.startButton, {opacity: connectedClients.length > 0 ? 1 : 0.5}]} 
                onPress={startSession}
                disabled={connectedClients.length === 0}>
                <Text style={styles.buttonText}>Start Session</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.sessionActive}>
                <Text style={styles.activeBeatText}>Beat: {currentBeat}</Text>
                <TouchableOpacity style={styles.stopButton} onPress={endSession}>
                  <Text style={styles.buttonText}>Stop Session</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
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
  clientItem: {
    padding: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 5,
    marginBottom: 5,
  },
  clientText: {
    fontSize: 16,
    color: '#333',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  inputLabel: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  numberInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 8,
    textAlign: 'center',
  },
  startButton: {
    backgroundColor: '#34C759',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  sessionActive: {
    alignItems: 'center',
  },
  activeBeatText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 15,
  },
  stopButton: {
    backgroundColor: '#FF3B30',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 120,
  },
});

export default MasterComponent;