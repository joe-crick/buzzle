# Overview

This is a React Native mobile application designed to synchronize vibration patterns between multiple Android devices in real-time. The app uses a master-client architecture where one device acts as the timing controller (master) and other devices (clients) follow synchronized vibration patterns. This creates a distributed haptic feedback system useful for group activities, music synchronization, or coordinated notifications.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Mobile Application Framework
The app is built on React Native 0.72.6, targeting Android devices exclusively. The architecture follows a component-based design with clear separation of concerns:

- **App.js** serves as the main entry point with role selection logic
- **Components** handle UI presentation and user interaction
- **Services** manage business logic for WebSocket communication, vibration control, and timing synchronization
- **Utils** provide shared message types and timing calculation functions

## Role-Based Architecture
The system implements a master-client pattern where:
- **Master Device**: Controls session timing, manages connected clients, and broadcasts synchronization signals
- **Client Devices**: Connect to master, receive timing signals, and execute synchronized vibrations
- **Role Selection**: Users choose device role at app startup with permission validation

## Real-Time Communication
WebSocket-based communication enables low-latency message exchange between devices:
- **Connection Management**: Automatic reconnection with exponential backoff
- **Message Types**: Structured protocol for registration, timing sync, and session control
- **Event-Driven Architecture**: Observer pattern for handling connection states and incoming messages

## Timing Synchronization System
Precision timing is achieved through multiple mechanisms:
- **Clock Synchronization**: Ping-pong protocol to measure network latency and calculate clock offset between devices
- **Beat Scheduling**: Pre-calculated vibration schedules based on tempo and session duration
- **Latency Compensation**: Automatic adjustment of vibration timing based on measured network delays
- **Timing Accuracy Metrics**: Real-time monitoring of synchronization precision

## Vibration Control
The vibration system provides:
- **Pattern Support**: Single vibrations, custom patterns, and repeating sequences
- **Scheduled Execution**: Precise timing control with millisecond accuracy
- **Fallback Modes**: Immediate vibration triggers when scheduling fails
- **Permission Handling**: Runtime permission management for Android vibration access

## State Management
Local component state manages:
- **Connection States**: WebSocket connection status and client lists
- **Session Data**: Active sessions, timing parameters, and beat tracking
- **Timing Statistics**: Latency measurements and synchronization accuracy
- **UI States**: Permission status, loading states, and error handling

# External Dependencies

## Core React Native Dependencies
- **react-native**: Mobile application framework (v0.72.6)
- **react**: JavaScript UI library (v18.2.0)
- **@react-native-async-storage/async-storage**: Local data persistence
- **react-native-permissions**: Runtime permission management for Android vibration access

## Network Communication
- **WebSocket API**: Built-in browser WebSocket for real-time communication
- **External WebSocket Server**: Requires separate server deployment or peer device acting as server

## Android Platform Integration
- **Android Vibration API**: Native vibration control through React Native bridge
- **Android Permissions**: VIBRATE permission declared in AndroidManifest.xml
- **Network Permissions**: Internet access for WebSocket connections

## Development and Build Tools
- **Metro**: React Native bundler and development server
- **Babel**: JavaScript transpilation with React Native preset
- **ESLint**: Code linting with React Native configuration
- **Jest**: Unit testing framework

## Infrastructure Requirements
- **WebSocket Server**: External server needed for device communication (not included in repository)
- **Network Connectivity**: WiFi or mobile data for real-time synchronization
- **Android Devices**: Target platform with vibration hardware support