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
      const response = await twilioApi.getToken();
      this.token = response.data.data.token;
      this.identity = response.data.data.identity;

      // Initialize Twilio Device
      this.device = new Device(this.token, {
        logLevel: 1,
        codecPreferences: ['opus', 'pcmu'],
      });

      // Set up listeners (they will handle ready state)
      this.setupDeviceListeners();

      // Wait for device to be ready
      this.readyPromise = new Promise<void>((resolve, reject) => {
        if (!this.device) {
          reject(new Error('Device not created'));
          return;
        }

        const timeout = setTimeout(() => {
          reject(new Error('Device initialization timeout'));
        }, 10000);

        // Listen for ready event
        const readyHandler = () => {
          this.isDeviceReady = true;
          clearTimeout(timeout);
          resolve();
        };

        this.device.on('ready', readyHandler);

        // Also handle error during initialization
        const errorHandler = (error: any) => {
          clearTimeout(timeout);
          reject(error);
        };

        this.device.on('error', errorHandler);
      });

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

  private setupDeviceListeners(): void {
    if (!this.device) return;

    this.device.on('ready', () => {
      this.isDeviceReady = true;
      this.notifyStatus({ status: 'idle' });
    });

    this.device.on('error', (error: any) => {
      console.error('Twilio Device Error:', error);
      this.isDeviceReady = false;
      this.notifyStatus({
        status: 'disconnected',
        error: error.message || 'Device error occurred',
      });
    });

    this.device.on('incoming', (connection: Connection) => {
      this.call = connection;
      this.setupCallListeners();
      this.notifyStatus({ status: 'ringing', call: connection });
    });

    this.device.on('offline', () => {
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
