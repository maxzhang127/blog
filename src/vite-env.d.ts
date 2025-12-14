/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SITE_NAME: string;
  readonly VITE_COPYRIGHT_YEAR: string;
  readonly VITE_ICP_NUMBER: string;
  readonly VITE_ICP_URL: string;
  readonly VITE_BEIAN_NUMBER: string;
  readonly VITE_BEIAN_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
