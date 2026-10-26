/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** auto — бэкенд, при недоступности моки; mock — только моки; live — только бэкенд */
  readonly VITE_API_MODE?: 'auto' | 'mock' | 'live';
  /** Базовый URL бэкенда. Пусто — относительные пути (/api/...) через прокси nginx/vite */
  readonly VITE_API_BASE?: string;
}
