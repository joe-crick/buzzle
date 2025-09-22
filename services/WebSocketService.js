class WebSocketService {
  constructor() {
    this.ws = null;
    this.url = '';
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.listeners = {
      open: [],
      message: [],
      close: [],
      error: [],
    };
  }

  connect(url) {
    this.url = url;
    this.reconnectAttempts = 0;
    this._connect();
  }

  _connect() {
    try {
      this.ws = new WebSocket(this.url);
      
      this.ws.onopen = (event) => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        this._notifyListeners('open', event);
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this._notifyListeners('message', data);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.ws.onclose = (event) => {
        console.log('WebSocket disconnected');
        this._notifyListeners('close', event);
        this._handleReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this._notifyListeners('error', error);
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this._handleReconnect();
    }
  }

  _handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      
      setTimeout(() => {
        this._connect();
      }, this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)); // Exponential backoff
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
      return true;
    } else {
      console.warn('WebSocket not connected, cannot send message');
      return false;
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  on(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event].push(callback);
    }
  }

  off(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
  }

  _notifyListeners(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${event} listener:`, error);
        }
      });
    }
  }

  isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN;
  }
}

export default new WebSocketService();