// Message types for WebSocket communication between Master and Client devices

export const MESSAGE_TYPES = {
  // Connection and registration
  REGISTER: 'register',
  
  // Timing synchronization
  PING: 'ping',
  PONG: 'pong',
  
  // Session management
  START_SESSION: 'start_session',
  END_SESSION: 'end_session',
  
  // Client management
  CLIENT_LIST: 'client_list',
  CLIENT_CONNECTED: 'client_connected',
  CLIENT_DISCONNECTED: 'client_disconnected',
  
  // Heartbeat for connection maintenance
  HEARTBEAT: 'heartbeat',
  HEARTBEAT_RESPONSE: 'heartbeat_response',
  
  // Immediate vibration triggers (fallback mode)
  VIBRATE_NOW: 'vibrate_now',
  
  // Status updates
  STATUS_UPDATE: 'status_update',
  ERROR: 'error',
};

// Message structure examples:

// REGISTER message
// {
//   type: 'register',
//   role: 'master' | 'client',
//   deviceId: string,
//   timestamp: number
// }

// PING message
// {
//   type: 'ping',
//   clientTime: number
// }

// PONG message  
// {
//   type: 'pong',
//   clientTime: number,
//   serverReceiveTime: number,
//   serverSendTime: number
// }

// START_SESSION message
// {
//   type: 'start_session',
//   tempo: number,
//   duration: number,
//   startTime: number,
//   schedule: Array<{
//     beatNumber: number,
//     serverTime: number,
//     shouldVibrate: boolean
//   }>
// }

// END_SESSION message
// {
//   type: 'end_session',
//   timestamp: number
// }

// VIBRATE_NOW message (fallback for high latency)
// {
//   type: 'vibrate_now',
//   duration: number,
//   pattern?: Array<number>
// }

export default MESSAGE_TYPES;