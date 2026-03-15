const isDev = import.meta.env.DEV;

export const API_CONFIG = {
  BASE_URL: isDev ? '/api' : 'https://assignments.reaktor.com',
  TOKEN: '0cREZMgoSZiQ1_RyanlrdLuROkaZpwj1',
  REFRESH_INTERVAL: 15000,
  DEBOUNCE_DELAY: 300,
};

export const COLORS = {
  ROCK: '#ff4d4d',
  PAPER: '#4d4dff',
  SCISSORS: '#4dff4d',
  TIE: '#a0a0a0',
  BACKGROUND: '#0f0f0f',
  SURFACE: '#1a1a1a',
  SURFACE_ELEVATED: '#252525',
  BORDER: '#333333',
  TEXT_PRIMARY: '#ffffff',
  TEXT_SECONDARY: '#a0a0a0',
  GOLD: '#ffd700',
  SILVER: '#c0c0c0',
  BRONZE: '#cd7f32',
};

export const MOVE_ICONS: Record<string, string> = {
  ROCK: '🪨',
  PAPER: '📄',
  SCISSORS: '✂️',
};

export const UI_CONFIG = {
  MATCHES_PER_PAGE: 50,
  SUGGESTIONS_LIMIT: 5,
  LEADERBOARD_TOP: 3,
  SKELETON_COUNT: 8,
};

export const CACHE_CONFIG = {
  MAX_AGE: 5 * 60 * 1000,
  MAX_ENTRIES: 100,
};
