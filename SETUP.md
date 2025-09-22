# React Native Sync Vibrate App Setup

This scaffold provides a complete React Native app structure for synchronized vibration between two Android phones.

## Project Structure

```
├── App.js                          # Main app entry point
├── components/
│   ├── RoleSelector.js             # Device role selection UI
│   ├── MasterComponent.js          # Master device interface
│   └── ClientComponent.js          # Client device interface
├── services/
│   ├── WebSocketService.js         # WebSocket communication
│   ├── VibrationService.js         # Vibration control
│   └── TimingService.js            # Synchronization timing
├── utils/
│   ├── messageTypes.js             # WebSocket message definitions
│   └── timingCalculations.js       # Timing utility functions
└── android/
    └── app/src/main/AndroidManifest.xml  # Android permissions
```

## Features Implemented

✅ **Master/Client Architecture** - One device controls timing, others follow
✅ **WebSocket Communication** - Real-time message exchange
✅ **Timing Synchronization** - Latency compensation and clock sync
✅ **Vibration Patterns** - Precise vibration scheduling
✅ **Permission Handling** - Android vibration permissions
✅ **Session Management** - Start/stop synchronized sessions

## Next Steps for Development

1. **Set up React Native environment:**
   ```bash
   npx react-native init SyncVibrateApp
   # Copy these files into your new project
   ```

2. **Install dependencies:**
   ```bash
   npm install @react-native-async-storage/async-storage react-native-permissions
   ```

3. **WebSocket Server:**
   You'll need a WebSocket server that both devices can connect to. Options:
   - Use one device as WebSocket server
   - Deploy simple Node.js WebSocket server
   - Use WebRTC for peer-to-peer (future enhancement)

4. **Test on devices:**
   ```bash
   npx react-native run-android
   ```

## Key Components

- **Master Device**: Controls session timing and sends sync signals
- **Client Device**: Receives signals and vibrates in sync
- **Timing Service**: Handles latency measurement and clock synchronization
- **Vibration Service**: Manages precise vibration scheduling

## Usage Flow

1. Launch app on both devices
2. Select "Master" on one device, "Client" on the other
3. Connect both to the same WebSocket server
4. Master configures tempo and duration
5. Master starts session - both devices vibrate alternately

The scaffold is ready for React Native development environment setup!