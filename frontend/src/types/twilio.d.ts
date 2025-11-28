declare module '@twilio/voice-sdk' {
  export class Device {
    constructor(token: string, options?: any);
    on(event: string, callback: (data?: any) => void): void;
    connect(params?: any): Connection;
    destroy(): void;
    token: string;
    isReady: boolean;
  }

  export class Connection {
    on(event: string, callback: (data?: any) => void): void;
    accept(): void;
    reject(): void;
    disconnect(): void;
    mute(mute: boolean): void;
    isMuted(): boolean;
    status(): string;
  }
}

