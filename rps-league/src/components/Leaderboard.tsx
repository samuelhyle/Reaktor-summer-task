import { memo, useState, useMemo } from 'react';
import type { ExtendedPlayerStats } from '../hooks/useData';
import './Leaderboard.css';

interface LeaderboardProps {
  players: ExtendedPlayerStats[];
  loading: boolean;
  title?: string;
}

type SortField = 'name' | 'wins' | 'losses' | 'winRate' | 'winStreak';
type SortDirection = 'asc' | 'desc';

export const Leaderboard = memo(function Leaderboard({ players, loading, title }: LeaderboardProps) {
  const [sortField, setSortField] = useState<SortField>('wins');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const sortedPlayers = useMemo(() => {
    if (!players) return [];
    return [...players].sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      
      if (aVal === bVal) {
        // Fallback to wins if tie
        return b.wins - a.wins;
      }
      
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc' 
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      
      return sortDirection === 'desc' 
        ? (bVal as number) - (aVal as number) 
        : (aVal as number) - (bVal as number);
    });
  }, [players, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(prev => prev === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return '↕️';
    return sortDirection === 'desc' ? '⬇️' : '⬆️';
  };

  if (loading) {
    return (
      <div className="leaderboard">
        {title && <h2 className="leaderboard-title">{title}</h2>}
        <div className="loading">Loading leaderboard...</div>
      </div>
    );
  }

  if (players.length === 0) {
    return (
      <div className="leaderboard">
        {title && <h2 className="leaderboard-title">{title}</h2>}
        <div className="empty">No data available</div>
      </div>
    );
  }

  const getRankClass = (rank: number) => {
    if (rank === 1) return 'gold';
    if (rank === 2) return 'silver';
    if (rank === 3) return 'bronze';
    return '';
  };

  return (
    <div className="leaderboard">
      {title && <h2 className="leaderboard-title">{title}</h2>}
      <div className="leaderboard-table-wrapper">
        <table className="leaderboard-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th onClick={() => handleSort('name')} className="sortable">Player <span className="sort-icon">{getSortIcon('name')}</span></th>
              <th onClick={() => handleSort('wins')} className="sortable">Wins <span className="sort-icon">{getSortIcon('wins')}</span></th>
              <th onClick={() => handleSort('losses')} className="sortable">Losses <span className="sort-icon">{getSortIcon('losses')}</span></th>
              <th onClick={() => handleSort('winRate')} className="sortable">Win Rate <span className="sort-icon">{getSortIcon('winRate')}</span></th>
              <th onClick={() => handleSort('winStreak')} className="sortable">Win Streak <span className="sort-icon">{getSortIcon('winStreak')}</span></th>
            </tr>
          </thead>
          <tbody>
            {sortedPlayers.map((player, index) => (
              <tr key={player.name} className={getRankClass(index + 1)}>
                <td className="rank">
                  <span className={`rank-badge ${getRankClass(index + 1)}`}>
                    {index + 1}
                  </span>
                </td>
                <td className="player-name">{player.name}</td>
                <td className="wins">{player.wins}</td>
                <td className="losses">{player.losses}</td>
                <td className="win-rate">{player.winRate}%</td>
                <td className="streak">
                  {player.winStreak > 0 && <span className="win-streak">🔥 {player.winStreak}</span>}
                  {player.lossStreak > 0 && <span className="loss-streak">📉 {player.lossStreak}</span>}
                  {player.winStreak === 0 && player.lossStreak === 0 && '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});
