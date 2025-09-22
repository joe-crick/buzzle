class TimingService {
  constructor() {
    this.clockOffset = 0; // Difference between local time and server time
    this.latency = 0; // One-way network latency estimate
    this.isCalibrated = false;
    this.lastPingTime = 0;
    this.pingHistory = [];
    this.maxPingHistory = 10;
  }

  // Measure latency and calculate clock offset using ping/pong
  async measureLatency(sendPingCallback) {
    const t0 = Date.now();
    const pingData = {
      type: 'ping',
      clientTime: t0,
    };

    this.lastPingTime = t0;
    
    return new Promise((resolve) => {
      // Send ping and wait for pong response
      sendPingCallback(pingData);
      
      // Set timeout for ping response
      const timeout = setTimeout(() => {
        resolve({
          success: false,
          error: 'Ping timeout',
        });
      }, 5000);

      // This will be called when pong is received
      this.resolvePing = (pongData) => {
        clearTimeout(timeout);
        const t3 = Date.now();
        
        const result = this.processPongResponse(pongData, t0, t3);
        resolve(result);
      };
    });
  }

  // Process pong response and calculate timing metrics
  processPongResponse(pongData, t0, t3) {
    try {
      const t1 = pongData.serverReceiveTime;
      const t2 = pongData.serverSendTime;

      // Calculate round-trip time and one-way latency
      const roundTripTime = t3 - t0;
      const serverProcessingTime = t2 - t1;
      const networkLatency = (roundTripTime - serverProcessingTime) / 2;

      // Calculate clock offset (server time - client time)
      const serverTime = t1 + (networkLatency);
      const clientTime = t0 + networkLatency;
      const offset = serverTime - clientTime;

      // Store in ping history for averaging
      this.pingHistory.push({
        roundTripTime,
        networkLatency,
        offset,
        timestamp: Date.now(),
      });

      // Keep only recent pings
      if (this.pingHistory.length > this.maxPingHistory) {
        this.pingHistory.shift();
      }

      // Calculate averages
      this.updateAverages();

      return {
        success: true,
        roundTripTime,
        networkLatency,
        offset,
        averageLatency: this.latency,
        averageOffset: this.clockOffset,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Update average latency and offset from ping history
  updateAverages() {
    if (this.pingHistory.length === 0) return;

    const validPings = this.pingHistory.filter(ping => 
      ping.networkLatency > 0 && ping.networkLatency < 1000 // Filter out unrealistic values
    );

    if (validPings.length === 0) return;

    // Calculate weighted average (more recent pings have higher weight)
    let totalWeight = 0;
    let weightedLatency = 0;
    let weightedOffset = 0;

    validPings.forEach((ping, index) => {
      const weight = index + 1; // More recent = higher weight
      totalWeight += weight;
      weightedLatency += ping.networkLatency * weight;
      weightedOffset += ping.offset * weight;
    });

    this.latency = weightedLatency / totalWeight;
    this.clockOffset = weightedOffset / totalWeight;
    this.isCalibrated = true;
  }

  // Get synchronized server time
  getServerTime() {
    return Date.now() + this.clockOffset;
  }

  // Convert server timestamp to local timestamp
  serverToLocal(serverTimestamp) {
    return serverTimestamp - this.clockOffset;
  }

  // Convert local timestamp to server timestamp
  localToServer(localTimestamp) {
    return localTimestamp + this.clockOffset;
  }

  // Calculate when to schedule local action for server timestamp
  calculateLocalScheduleTime(serverTargetTime) {
    const localTargetTime = this.serverToLocal(serverTargetTime);
    const compensatedTime = localTargetTime - this.latency;
    return Math.max(compensatedTime, Date.now()); // Don't schedule in past
  }

  // Check if timing is suitable for precise synchronization
  isTimingSuitable() {
    return this.isCalibrated && this.latency < 200; // Less than 200ms latency
  }

  // Get timing statistics
  getStats() {
    return {
      isCalibrated: this.isCalibrated,
      latency: this.latency,
      clockOffset: this.clockOffset,
      pingCount: this.pingHistory.length,
      recentPings: this.pingHistory.slice(-3),
      isTimingSuitable: this.isTimingSuitable(),
    };
  }

  // Reset timing calibration
  reset() {
    this.clockOffset = 0;
    this.latency = 0;
    this.isCalibrated = false;
    this.pingHistory = [];
  }

  // Generate beat timestamps for a given tempo and duration
  generateBeatSchedule(startTime, tempo, durationSeconds, isAlternating = true) {
    const beatInterval = 60000 / tempo; // milliseconds per beat
    const totalBeats = Math.floor((durationSeconds * 1000) / beatInterval);
    const schedule = [];

    for (let i = 0; i < totalBeats; i++) {
      const beatTime = startTime + (i * beatInterval);
      const isThisBeat = isAlternating ? (i % 2 === 0) : true;
      
      schedule.push({
        beatNumber: i,
        serverTime: beatTime,
        localTime: this.serverToLocal(beatTime),
        shouldVibrate: isThisBeat,
      });
    }

    return schedule;
  }
}

export default new TimingService();