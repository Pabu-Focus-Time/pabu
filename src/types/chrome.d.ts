// Chrome Extension API types
declare global {
  interface Window {
    chrome: {
      storage: {
        local: {
          get: (keys: string[], callback: (result: Record<string, any>) => void) => void;
          set: (items: Record<string, any>, callback?: () => void) => void;
          remove: (keys: string[], callback?: () => void) => void;
          clear: (callback?: () => void) => void;
        };
      };
      runtime: {
        onMessage: {
          addListener: (callback: (request: any, sender: any, sendResponse: (response?: any) => void) => boolean | void) => void;
        };
        getURL: (path: string) => string;
      };
      action: {
        onClicked: {
          addListener: (callback: (tab: any) => void) => void;
        };
      };
      tabs: {
        create: (createProperties: { url: string }) => void;
      };
    };
  }
}

export {};