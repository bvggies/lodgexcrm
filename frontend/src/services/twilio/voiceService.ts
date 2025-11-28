// @ts-ignore - Twilio Voice SDK types
import { Device, Connection } from '@twilio/voice-sdk';
import { twilioApi } from '../api/twilioApi';

export interface CallState {
  status: 'idle' | 'connecting' | 'ringing' | 'connected' | 'disconnected';
  call?: Connection;
  device?: Device;
  error?: string;
}

class VoiceService {
  private device: Device | null = null;
  private call: Connection | null = null;
  private token: string | null = null;
  private identity: string | null = null;
  private statusCallbacks: ((status: CallState) => void)[] = [];
  private isDeviceReady: boolean = false;
  private readyPromise: Promise<void> | null = null;

  async initialize(): Promise<void> {
    try {
      // Request microphone permission first (required for WebRTC)
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log('Microphone permission granted');
      } catch (mediaError: any) {
        console.warn('Microphone permission denied or not available:', mediaError);
        throw new Error(
          'Microphone access is required for calling. Please grant microphone permissions.'
        );
      }

      const response = await twilioApi.getToken();

      if (!response.data?.data?.token) {
        throw new Error('Invalid token response from server');
      }

      this.token = response.data.data.token;
      this.identity = response.data.data.identity;

      if (!this.token) {
        throw new Error('Token is empty or invalid');
      }

      console.log('Token received, creating device...');

      // Initialize Twilio Device
      this.device = new Device(this.token, {
        logLevel: 1,
        codecPreferences: ['opus', 'pcmu'],
      });

      // Explicitly register the device
      if (this.device && typeof (this.device as any).register === 'function') {
        (this.device as any).register();
        console.log('Device registration initiated');
      }

      // Create promise to wait for device ready BEFORE setting up listeners
      // This prevents race condition where ready event fires before we set up the promise
      const callbacks: {
        resolve: (() => void) | null;
        reject: ((error: any) => void) | null;
      } = {
        resolve: null,
        reject: null,
      };

      this.readyPromise = new Promise<void>((resolve, reject) => {
        callbacks.resolve = () => resolve();
        callbacks.reject = (error: any) => reject(error);
      });

      // Wait for device to be ready/registered with a longer timeout
      let timeoutCleared = false;
      const timeout = setTimeout(() => {
        if (timeoutCleared) return;
        const currentState = (this.device as any)?.state;
        console.error('Device initialization timeout - device state:', currentState);

        let errorMessage = 'Device initialization timeout. ';
        if (currentState === 'unregistered') {
          errorMessage +=
            'Device failed to register with Twilio. Please check your network connection and Twilio configuration.';
        } else if (currentState === 'registering') {
          errorMessage +=
            'Device is still registering. This may indicate network issues or firewall blocking WebRTC connections.';
        } else if (currentState === 'registered') {
          // Device is registered but we didn't get the event - accept it as ready
          console.log('Device is registered, accepting as ready despite timeout');
          this.isDeviceReady = true;
          this.notifyStatus({ status: 'idle' });
          if (callbacks.resolve) {
            callbacks.resolve();
          }
          return;
        } else {
          errorMessage += 'Please check your internet connection and try again.';
        }

        if (callbacks.reject) {
          callbacks.reject(new Error(errorMessage));
        }
      }, 20000); // 20 seconds should be enough

      // Store timeout reference for cleanup
      const clearTimeoutSafe = () => {
        if (!timeoutCleared) {
          clearTimeout(timeout);
          timeoutCleared = true;
        }
      };

      // Wrap resolve to clear timeout
      const wrappedResolve = () => {
        clearTimeoutSafe();
        if (callbacks.resolve) {
          callbacks.resolve();
        }
      };

      // Set up permanent listeners (they will also trigger the promise)
      this.setupDeviceListeners(wrappedResolve, callbacks.reject);

      // Check device state
      const deviceState = (this.device as any)?.state;
      console.log('Initial device state:', deviceState);

      // Check if device is already ready or registered (it might be ready immediately)
      const initialState = (this.device as any)?.state;
      const isReady = (this.device as any)?.isReady === true;

      if (isReady || initialState === 'registered') {
        console.log('Twilio device is already ready/registered');
        this.isDeviceReady = true;
        this.notifyStatus({ status: 'idle' });
        if (callbacks.resolve) {
          callbacks.resolve();
        }
        return;
      }

      // Check periodically if device becomes ready or registered (in case event was missed)
      let lastLoggedState = deviceState;
      const checkInterval = setInterval(() => {
        const currentState = (this.device as any)?.state;
        const isReadyNow = (this.device as any)?.isReady === true;

        // Log state changes for debugging (but not repeatedly for the same state)
        if (currentState !== lastLoggedState && currentState !== 'registered') {
          console.log('Device state changed:', currentState);
          lastLoggedState = currentState;
        }

        // Accept "registered" or "ready" state as sufficient
        if ((isReadyNow || currentState === 'registered') && !this.isDeviceReady) {
          console.log('Twilio device became ready/registered (polled)');
          this.isDeviceReady = true;
          this.notifyStatus({ status: 'idle' });
          clearTimeoutSafe();
          clearInterval(checkInterval);
          if (callbacks.resolve) {
            callbacks.resolve();
          }
        }
      }, 500);

      // Clean up interval on timeout
      setTimeout(() => {
        clearInterval(checkInterval);
      }, 20000);

      await this.readyPromise;
    } catch (error: any) {
      console.error('Failed to initialize Twilio device:', error);
      this.isDeviceReady = false;
      // Don't throw - just log the error to prevent redirect loops
      // The calling features will gracefully degrade if initialization fails
      if (error.response?.status === 401) {
        console.warn('Twilio token request failed: User not authenticated');
      }
    }
  }

  private setupDeviceListeners(
    readyResolve?: (() => void) | null,
    readyReject?: ((error: any) => void) | null
  ): void {
    if (!this.device) return;

    // Listen for registered event (device must register before becoming ready)
    // Store resolve/reject in a way that can be accessed by the registered handler
    const registeredHandler = () => {
      console.log('Twilio device registered event received');
      // Device is registered - this is sufficient to make calls
      // The "ready" event may not always fire, so we accept "registered" as ready
      if (!this.isDeviceReady) {
        this.isDeviceReady = true;
        this.notifyStatus({ status: 'idle' });
        if (readyResolve) {
          readyResolve();
        }
      }
    };
    this.device.on('registered', registeredHandler);

    this.device.on('unregistered', () => {
      console.warn('Twilio device unregistered');
      this.isDeviceReady = false;
      this.notifyStatus({ status: 'disconnected', error: 'Device unregistered' });
    });

    this.device.on('tokenWillExpire', () => {
      console.warn('Twilio token will expire soon');
      // Token refresh should be handled automatically, but we can log it
    });

    this.device.on('ready', () => {
      console.log('Twilio device ready event received');
      // Device is ready - this is the final state
      if (!this.isDeviceReady) {
        this.isDeviceReady = true;
        this.notifyStatus({ status: 'idle' });
        if (readyResolve) {
          readyResolve();
        }
      }
    });

    this.device.on('error', (error: any) => {
      console.error('Twilio Device Error:', error);
      console.error('Device state:', (this.device as any)?.state);
      this.isDeviceReady = false;

      // Handle specific Twilio errors
      let errorMessage = error.message || 'Device error occurred';
      const errorCode = error.code || error.twilioErrorCode;

      // Check for demo account or account limitation errors
      if (
        errorMessage.toLowerCase().includes('demo account') ||
        errorMessage.toLowerCase().includes('upgrade') ||
        errorCode === 20003 || // Account suspended
        errorCode === 20008 || // Account not active
        errorCode === 21211 || // Invalid 'To' Phone Number
        errorCode === 21215 || // Account not provisioned
        errorCode === 21216 // Account suspended
      ) {
        errorMessage =
          'Twilio account limitation: Please upgrade your Twilio account to use calling features. Contact your administrator.';
      }

      this.notifyStatus({
        status: 'disconnected',
        error: errorMessage,
      });
      if (readyReject) {
        readyReject(new Error(errorMessage));
      }
    });

    this.device.on('incoming', (connection: Connection) => {
      this.call = connection;
      this.setupCallListeners();
      this.notifyStatus({ status: 'ringing', call: connection });
    });

    this.device.on('offline', () => {
      console.warn('Twilio device offline');
      this.isDeviceReady = false;
      this.notifyStatus({ status: 'disconnected', error: 'Device offline' });
    });
  }

  async makeCall(phoneNumber: string, guestId?: string): Promise<void> {
    if (!this.device) {
      throw new Error('Device not initialized. Call initialize() first.');
    }

    // Wait for device to be ready if it's not ready yet
    if (!this.isDeviceReady) {
      if (this.readyPromise) {
        try {
          await this.readyPromise;
        } catch (error: any) {
          throw new Error('Device not ready. Please try again.');
        }
      } else {
        throw new Error('Device not ready. Please wait a moment and try again.');
      }
    }

    try {
      this.notifyStatus({ status: 'connecting' });

      const params = {
        To: phoneNumber,
        From: this.identity || '',
      };

      // Disconnect any existing call first
      if (this.call) {
        try {
          this.call.disconnect();
        } catch (e) {
          // Ignore errors from disconnecting old call
        }
        this.call = null;
      }

      // Make the call
      const connection = this.device.connect({ params });

      if (!connection || typeof connection.on !== 'function') {
        throw new Error('Failed to create call connection');
      }

      this.call = connection;
      this.setupCallListeners(guestId);
    } catch (error: any) {
      this.notifyStatus({
        status: 'disconnected',
        error: error.message || 'Failed to make call',
      });
      this.call = null;
      throw error;
    }
  }

  private setupCallListeners(guestId?: string): void {
    if (!this.call) {
      console.warn('setupCallListeners called but call is null');
      return;
    }

    // Verify that call has the 'on' method
    if (typeof this.call.on !== 'function') {
      console.error('Call object does not have on method:', this.call);
      this.notifyStatus({
        status: 'disconnected',
        error: 'Invalid call connection',
      });
      this.call = null;
      return;
    }

    try {
      this.call.on('accept', () => {
        this.notifyStatus({ status: 'connected', call: this.call || undefined });
      });

      this.call.on('disconnect', () => {
        this.notifyStatus({ status: 'disconnected' });
        this.call = null;
      });

      this.call.on('cancel', () => {
        this.notifyStatus({ status: 'disconnected' });
        this.call = null;
      });

      this.call.on('error', (error: any) => {
        console.error('Call Error:', error);
        this.notifyStatus({
          status: 'disconnected',
          error: error.message || 'Call error occurred',
        });
        this.call = null;
      });
    } catch (error: any) {
      console.error('Error setting up call listeners:', error);
      this.notifyStatus({
        status: 'disconnected',
        error: 'Failed to set up call listeners',
      });
      this.call = null;
    }
  }

  answerCall(): void {
    if (this.call && this.call.status() === 'pending') {
      this.call.accept();
    }
  }

  rejectCall(): void {
    if (this.call) {
      this.call.reject();
      this.call = null;
      this.notifyStatus({ status: 'idle' });
    }
  }

  hangUp(): void {
    if (this.call) {
      this.call.disconnect();
      this.call = null;
      this.notifyStatus({ status: 'idle' });
    }
  }

  mute(): void {
    if (this.call) {
      this.call.mute(true);
    }
  }

  unmute(): void {
    if (this.call) {
      this.call.mute(false);
    }
  }

  isMuted(): boolean {
    return this.call ? this.call.isMuted() : false;
  }

  onStatusChange(callback: (status: CallState) => void): () => void {
    this.statusCallbacks.push(callback);
    return () => {
      this.statusCallbacks = this.statusCallbacks.filter((cb) => cb !== callback);
    };
  }

  private notifyStatus(status: CallState): void {
    this.statusCallbacks.forEach((callback) => callback(status));
  }

  getCurrentCall(): Connection | null {
    return this.call;
  }

  isInitialized(): boolean {
    return this.device !== null && this.isDeviceReady;
  }

  async waitForReady(): Promise<void> {
    if (this.isDeviceReady) {
      return;
    }
    if (this.readyPromise) {
      await this.readyPromise;
    } else {
      throw new Error('Device not initialized');
    }
  }

  destroy(): void {
    if (this.call) {
      this.call.disconnect();
      this.call = null;
    }
    if (this.device) {
      this.device.destroy();
      this.device = null;
    }
    this.statusCallbacks = [];
  }
}

export const voiceService = new VoiceService();
