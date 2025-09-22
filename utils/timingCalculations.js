// Utility functions for timing calculations and synchronization

/**
 * Calculate the next beat timestamp based on tempo and current time
 * @param {number} currentTime - Current timestamp
 * @param {number} tempo - Beats per minute
 * @param {number} startTime - Session start timestamp
 * @returns {number} Next beat timestamp
 */
export const calculateNextBeat = (currentTime, tempo, startTime) => {
  const beatInterval = 60000 / tempo; // milliseconds per beat
  const elapsed = currentTime - startTime;
  const nextBeatIndex = Math.floor(elapsed / beatInterval) + 1;
  return startTime + (nextBeatIndex * beatInterval);
};

/**
 * Generate a schedule of beat timestamps
 * @param {number} startTime - Session start timestamp
 * @param {number} tempo - Beats per minute
 * @param {number} durationSeconds - Session duration in seconds
 * @param {boolean} alternating - Whether devices should alternate beats
 * @returns {Array} Array of beat objects
 */
export const generateBeatSchedule = (startTime, tempo, durationSeconds, alternating = true) => {
  const beatInterval = 60000 / tempo; // milliseconds per beat
  const totalBeats = Math.floor((durationSeconds * 1000) / beatInterval);
  const schedule = [];

  for (let i = 0; i < totalBeats; i++) {
    const beatTime = startTime + (i * beatInterval);
    
    schedule.push({
      beatNumber: i,
      timestamp: beatTime,
      isMasterBeat: alternating ? (i % 2 === 0) : false,
      isClientBeat: alternating ? (i % 2 === 1) : true,
    });
  }

  return schedule;
};

/**
 * Calculate timing accuracy metrics
 * @param {Array} plannedBeats - Array of planned beat timestamps
 * @param {Array} actualBeats - Array of actual execution timestamps
 * @returns {Object} Timing accuracy metrics
 */
export const calculateTimingAccuracy = (plannedBeats, actualBeats) => {
  if (plannedBeats.length !== actualBeats.length) {
    return {
      error: 'Mismatched beat counts',
      plannedCount: plannedBeats.length,
      actualCount: actualBeats.length,
    };
  }

  const differences = plannedBeats.map((planned, index) => {
    const actual = actualBeats[index];
    return actual - planned;
  });

  const absoluteDifferences = differences.map(Math.abs);
  
  return {
    averageOffset: differences.reduce((sum, diff) => sum + diff, 0) / differences.length,
    averageError: absoluteDifferences.reduce((sum, diff) => sum + diff, 0) / absoluteDifferences.length,
    maxError: Math.max(...absoluteDifferences),
    minError: Math.min(...absoluteDifferences),
    standardDeviation: calculateStandardDeviation(differences),
    accuracy: 100 - (Math.min(100, (absoluteDifferences.reduce((sum, diff) => sum + diff, 0) / absoluteDifferences.length) / 10)),
  };
};

/**
 * Calculate standard deviation of an array of numbers
 * @param {Array<number>} values - Array of numbers
 * @returns {number} Standard deviation
 */
export const calculateStandardDeviation = (values) => {
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const squaredDifferences = values.map(val => Math.pow(val - mean, 2));
  const variance = squaredDifferences.reduce((sum, val) => sum + val, 0) / squaredDifferences.length;
  return Math.sqrt(variance);
};

/**
 * Determine if network conditions are suitable for precise timing
 * @param {number} latency - Average network latency in milliseconds
 * @param {number} jitter - Network jitter in milliseconds
 * @param {number} tempo - Target tempo in BPM
 * @returns {Object} Suitability assessment
 */
export const assessNetworkSuitability = (latency, jitter, tempo) => {
  const beatInterval = 60000 / tempo;
  const timingTolerance = beatInterval * 0.1; // 10% of beat interval
  
  const isSuitable = latency < 200 && jitter < 50 && latency < timingTolerance;
  
  return {
    suitable: isSuitable,
    latency,
    jitter,
    beatInterval,
    timingTolerance,
    recommendation: isSuitable ? 
      'Network conditions are suitable for precise synchronization' :
      latency > 200 ? 'High latency detected - consider fallback mode' :
      jitter > 50 ? 'High jitter detected - timing may be inconsistent' :
      'Timing tolerance exceeded for this tempo',
  };
};

/**
 * Convert tempo (BPM) to various time units
 * @param {number} tempo - Beats per minute
 * @returns {Object} Tempo in different units
 */
export const convertTempo = (tempo) => {
  return {
    bpm: tempo,
    beatsPerSecond: tempo / 60,
    millisecondsPerBeat: 60000 / tempo,
    secondsPerBeat: 60 / tempo,
  };
};

/**
 * Calculate optimal buffer time for scheduling
 * @param {number} latency - Network latency in ms
 * @param {number} processingTime - Expected processing time in ms
 * @returns {number} Recommended buffer time in ms
 */
export const calculateOptimalBuffer = (latency, processingTime = 10) => {
  // Buffer should account for:
  // - Network latency
  // - Processing time
  // - Safety margin (50% of latency)
  return latency + processingTime + (latency * 0.5);
};

/**
 * Validate timing parameters
 * @param {Object} params - Timing parameters
 * @returns {Object} Validation result
 */
export const validateTimingParams = (params) => {
  const { tempo, duration, startTime } = params;
  const errors = [];
  
  if (!tempo || tempo < 30 || tempo > 200) {
    errors.push('Tempo must be between 30 and 200 BPM');
  }
  
  if (!duration || duration < 5 || duration > 300) {
    errors.push('Duration must be between 5 and 300 seconds');
  }
  
  if (!startTime || startTime <= Date.now()) {
    errors.push('Start time must be in the future');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
};