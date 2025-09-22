import {Vibration} from 'react-native';

class VibrationService {
  constructor() {
    this.isVibrating = false;
    this.scheduledVibrations = new Map();
    this.vibrationId = 0;
  }

  // Simple vibration with duration
  vibrate(duration = 100) {
    try {
      if (Array.isArray(duration)) {
        Vibration.vibrate(duration);
      } else {
        Vibration.vibrate(duration);
      }
      this.isVibrating = true;
      
      // Reset vibrating flag after vibration completes
      const totalDuration = Array.isArray(duration) 
        ? duration.reduce((sum, val) => sum + val, 0)
        : duration;
      
      setTimeout(() => {
        this.isVibrating = false;
      }, totalDuration);
      
      return true;
    } catch (error) {
      console.error('Vibration failed:', error);
      return false;
    }
  }

  // Vibrate with pattern [vibrate, pause, vibrate, pause, ...]
  vibratePattern(pattern, repeat = false) {
    try {
      Vibration.vibrate(pattern, repeat);
      this.isVibrating = true;
      
      if (!repeat) {
        const totalDuration = pattern.reduce((sum, val) => sum + val, 0);
        setTimeout(() => {
          this.isVibrating = false;
        }, totalDuration);
      }
      
      return true;
    } catch (error) {
      console.error('Pattern vibration failed:', error);
      return false;
    }
  }

  // Schedule vibration at specific timestamp
  scheduleVibration(timestamp, duration = 100, pattern = null) {
    const now = Date.now();
    const delay = timestamp - now;
    
    if (delay < 0) {
      console.warn('Cannot schedule vibration in the past');
      return null;
    }

    const vibrationId = ++this.vibrationId;
    
    const timeoutId = setTimeout(() => {
      if (pattern) {
        this.vibratePattern(pattern);
      } else {
        this.vibrate(duration);
      }
      this.scheduledVibrations.delete(vibrationId);
    }, delay);

    this.scheduledVibrations.set(vibrationId, {
      timeoutId,
      timestamp,
      duration,
      pattern,
    });

    return vibrationId;
  }

  // Cancel scheduled vibration
  cancelScheduledVibration(vibrationId) {
    const scheduled = this.scheduledVibrations.get(vibrationId);
    if (scheduled) {
      clearTimeout(scheduled.timeoutId);
      this.scheduledVibrations.delete(vibrationId);
      return true;
    }
    return false;
  }

  // Cancel all scheduled vibrations
  cancelAllScheduled() {
    this.scheduledVibrations.forEach((scheduled) => {
      clearTimeout(scheduled.timeoutId);
    });
    this.scheduledVibrations.clear();
  }

  // Stop current vibration
  stop() {
    try {
      Vibration.cancel();
      this.isVibrating = false;
      return true;
    } catch (error) {
      console.error('Failed to stop vibration:', error);
      return false;
    }
  }

  // Get current vibration status
  getStatus() {
    return {
      isVibrating: this.isVibrating,
      scheduledCount: this.scheduledVibrations.size,
      scheduled: Array.from(this.scheduledVibrations.entries()).map(([id, data]) => ({
        id,
        timestamp: data.timestamp,
        duration: data.duration,
        pattern: data.pattern,
      })),
    };
  }

  // Create preset vibration patterns
  presets = {
    short: 50,
    medium: 100,
    long: 200,
    pulse: [100, 50, 100],
    heartbeat: [100, 30, 100, 30, 200],
    sos: [100, 30, 100, 30, 100, 200, 200, 30, 200, 30, 200, 200, 100, 30, 100, 30, 100],
  };

  // Use preset vibration pattern
  usePreset(presetName) {
    const preset = this.presets[presetName];
    if (!preset) {
      console.warn(`Vibration preset '${presetName}' not found`);
      return false;
    }

    if (Array.isArray(preset)) {
      return this.vibratePattern(preset);
    } else {
      return this.vibrate(preset);
    }
  }
}

export default new VibrationService();