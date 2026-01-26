/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_RECOLLECT_URL: string;
  readonly VITE_RECOLLECT_DOMAIN: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
