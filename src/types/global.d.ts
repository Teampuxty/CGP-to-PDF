export {};

declare global {
  interface Window {
    electron: {
      invoke: (channel: string, args?: any) => Promise<any>;
      on: (
        channel: string,
        listener: (event: Electron.IpcRendererEvent, ...args: any[]) => void
      ) => void;
    };
  }
}