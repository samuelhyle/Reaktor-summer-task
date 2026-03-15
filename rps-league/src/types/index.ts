export type Move = 'ROCK' | 'PAPER' | 'SCISSORS';

export interface Player {
  name: string;
  played: Move;
}

export interface GameResult {
  type: 'GAME_RESULT';
  gameId: string;
  time: number;
  playerA: Player;
  playerB: Player;
}

export interface HistoryResponse {
  data: GameResult[];
  cursor?: string;
}

export interface PlayerStats {
  name: string;
  wins: number;
  losses: number;
  totalGames: number;
  winRate: number;
}

export type Winner = 'A' | 'B' | 'TIE';
