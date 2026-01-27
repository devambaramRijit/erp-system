// Type declarations for Google APIs
declare global {
  interface Window {
    gapi: {
      load: (name: string, callback?: () => void) => void;
      client: {
        init: (options: any) => Promise<any>;
        setToken: (token: any) => void;
        getToken: () => any;
        drive: {
          files: {
            list: (options: any) => Promise<any>;
            get: (options: any) => Promise<any>;
            create: (options: any) => Promise<any>;
            update: (options: any) => Promise<any>;
          };
        };
      };
    };

    google: {
      accounts: {
        oauth2: {
          initTokenClient: (options: any) => any;
          revoke: (token: string) => void;
        };
      };
    };
  }
}
