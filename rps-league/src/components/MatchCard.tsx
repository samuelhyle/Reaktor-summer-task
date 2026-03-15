import { memo } from 'react';
import type { GameResult } from '../types';
import { determineWinner, formatTimestamp } from '../services/api';
import { MOVE_ICONS, COLORS } from '../constants';
import './MatchCard.css';

interface MatchCardProps {
  game: GameResult;
  onClick?: () => void;
}

export const MatchCard = memo(function MatchCard({ game, onClick }: MatchCardProps) {
  const winner = determineWinner(game.playerA.played, game.playerB.played);
  const winnerName = winner === 'TIE' ? 'TIE' : winner === 'A' ? game.playerA.name : game.playerB.name;

  const getWinnerClass = (name: string) => {
    if (winner === 'TIE') return 'tie';
    return name === winnerName ? 'winner' : 'loser';
  };

  return (
    <div className="match-card" onClick={onClick}>
      <div className="match-header">
        <span className="match-id">#{game.gameId.slice(0, 8)}</span>
        <span className="match-time">{formatTimestamp(game.time)}</span>
      </div>
      <div className="match-players">
        <div className={`player player-a ${getWinnerClass(game.playerA.name)}`}>
          <span className="player-name">{game.playerA.name}</span>
          <span 
            className="player-move" 
            style={{ color: COLORS[game.playerA.played as keyof typeof COLORS] }}
          >
            {MOVE_ICONS[game.playerA.played]} {game.playerA.played}
          </span>
        </div>
        <div className="vs">VS</div>
        <div className={`player player-b ${getWinnerClass(game.playerB.name)}`}>
          <span className="player-name">{game.playerB.name}</span>
          <span 
            className="player-move"
            style={{ color: COLORS[game.playerB.played as keyof typeof COLORS] }}
          >
            {MOVE_ICONS[game.playerB.played]} {game.playerB.played}
          </span>
        </div>
      </div>
    </div>
  );
});
