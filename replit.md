# Overview

Buzzle is a React Native mobile application that enables synchronized vibration between multiple Android devices. The app uses a master-client architecture where one device controls timing and sends synchronization signals to client devices over WebSocket connections. This enables coordinated haptic feedback experiences across multiple phones, useful for gaming, notifications, or accessibility applications.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The app uses React Native with a component-based architecture organized around three main UI components:
- **RoleSelector**: Initial screen for choosing device role (master or client)
- **MasterComponent**: Interface for the controlling device with session management
- **ClientComponent**: Interface for receiving devices that connect to master

State management is handled through React hooks (useState, useEffect) with component-level state. The app follows a simple navigation pattern switching between role selection and operational interfaces.

## Real-time Communication
WebSocket-based communication enables real-time message exchange between devices:
- **WebSocketService**: Handles connection management, automatic reconnection, and event listeners
- **Message Types**: Structured message protocol for registration, timing sync, session control, and heartbeat
- **Bidirectional Flow**: Master sends commands and timing signals, clients respond with status updates

## Timing Synchronization System
Precise timing coordination is achieved through:
- **TimingService**: Measures network latency using ping/pong protocol and calculates clock offset between devices
- **Beat Scheduling**: Pre-calculated vibration timestamps compensated for network delay
- **Timing Calculations**: Utilities for generating beat schedules based on tempo and duration

## Vibration Control
Native vibration control through React Native's Vibration API:
- **VibrationService**: Wraps native vibration with scheduling and pattern support
- **Scheduled Execution**: Queued vibrations with precise timing
- **Pattern Support**: Single pulses and complex vibration patterns

## Permission Management
Android permission handling for vibration access:
- Uses react-native-permissions for runtime permission requests
- Blocks functionality until vibration permission is granted
- Graceful permission error handling with user feedback

# External Dependencies

## Core Framework
- **React Native 0.72.6**: Cross-platform mobile framework
- **React 18.2.0**: UI library with hooks for state management

## Device Capabilities
- **react-native-permissions**: Runtime permission management for Android vibration access
- **React Native Vibration API**: Native vibration control through built-in modules

## Data Storage
- **@react-native-async-storage/async-storage**: Local storage for device settings and session data (installed but not yet implemented in current codebase)

## Development Tools
- **Metro**: React Native bundler and development server
- **Babel**: JavaScript transpiler with React Native preset
- **ESLint**: Code linting with React Native configuration
- **Jest**: Testing framework for unit tests
- **PNPM**: Package manager with version locking (>=9.0.0)

## Network Communication
The app expects a WebSocket server for device communication (server implementation not included in this repository). Default configuration points to `ws://192.168.1.100:8080` but this is configurable through the UI.

## Platform Requirements
- **Android**: Primary target platform with vibration permissions in AndroidManifest.xml
- **Node.js**: >=18.0.0 for development environment
- **PNPM**: >=9.0.0 for package management