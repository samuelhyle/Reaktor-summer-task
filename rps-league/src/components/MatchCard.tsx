import { memo } from 'react';
import type { GameResult } from '../types';
import { determineWinner, formatTimestamp, normalizeMove, isValidMatch } from '../services/api';
import { MOVE_ICONS, COLORS } from '../constants';
import './MatchCard.css';

interface MatchCardProps {
  game: GameResult;
  onClick?: () => void;
}

export const MatchCard = memo(function MatchCard({ game, onClick }: MatchCardProps) {
  const valid = isValidMatch(game);
  const moveA = normalizeMove(game.playerA.played);
  const moveB = normalizeMove(game.playerB.played);
  const winner = valid ? determineWinner(moveA, moveB) : 'INVALID';
  const winnerName = winner === 'TIE' ? 'TIE' : winner === 'A' ? game.playerA.name : winner === 'B' ? game.playerB.name : '';

  const getWinnerClass = (name: string) => {
    if (!valid) return 'invalid';
    if (winner === 'TIE') return 'tie';
    return name === winnerName ? 'winner' : 'loser';
  };

  return (
    <div className={`match-card ${!valid ? 'match-card-invalid' : ''}`} onClick={onClick}>
      <div className="match-header">
        <span className="match-id">#{game.gameId.slice(0, 8)}</span>
        <span className="match-time">{formatTimestamp(game.time)}</span>
      </div>
      <div className="match-players">
        <div className={`player player-a ${getWinnerClass(game.playerA.name)}`}>
          <span className="player-name">{game.playerA.name}</span>
          <span
            className="player-move"
            style={{ color: COLORS[moveA as keyof typeof COLORS] }}
          >
            {MOVE_ICONS[moveA] || game.playerA.played} {moveA}
          </span>
        </div>
        <div className="vs">VS</div>
        <div className={`player player-b ${getWinnerClass(game.playerB.name)}`}>
          <span className="player-name">{game.playerB.name}</span>
          <span
            className="player-move"
            style={{ color: COLORS[moveB as keyof typeof COLORS] }}
          >
            {MOVE_ICONS[moveB] || game.playerB.played} {moveB}
          </span>
        </div>
      </div>
    </div>
  );
});
