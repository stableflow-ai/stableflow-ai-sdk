/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_STABLEFLOW_API_URL: string;
  readonly VITE_STABLEFLOW_JWT_TOKEN: string;
  readonly VITE_WALLET_CONNECT_PROJECT_ID: string;
  readonly VITE_RAINBOW_PROJECT_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

