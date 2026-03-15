import { useState, useMemo } from 'react';
import { MatchCard, MatchCardSkeleton, PlayerStatsSkeleton, Modal } from '../components';
import { usePlayerSearch } from '../hooks/useData';
import { determineWinner } from '../services/api';
import type { GameResult, Move } from '../types';
import { MOVE_ICONS, COLORS } from '../constants';
import './PlayerSearch.css';

export function PlayerSearch() {
  const [query, setQuery] = useState('');
  const [selectedGame, setSelectedGame] = useState<GameResult | null>(null);
  const { matches, loading, error, playerNames } = usePlayerSearch(query);

  const stats = useMemo(() => {
    if (!query.trim() || matches.length === 0) return null;
    
    const playerName = playerNames.find(n => n.toLowerCase() === query.toLowerCase());
    if (!playerName) return null;

    let wins = 0;
    let losses = 0;
    let currentWinStreak = 0;
    let maxWinStreak = 0;
    let currentLossStreak = 0;
    let maxLossStreak = 0;
    const moveStats: Record<Move, number> = { ROCK: 0, PAPER: 0, SCISSORS: 0 };

    const sortedMatches = [...matches].sort((a, b) => b.time - a.time);

    sortedMatches.forEach(game => {
      const isPlayerA = game.playerA.name === playerName;
      const isPlayerB = game.playerB.name === playerName;
      if (!isPlayerA && !isPlayerB) return;

      const playerMove = isPlayerA ? game.playerA.played : game.playerB.played;
      const opponentMove = isPlayerA ? game.playerB.played : game.playerA.played;
      moveStats[playerMove]++;

      if (playerMove === opponentMove) return;

      const playerWins = 
        (playerMove === 'ROCK' && opponentMove === 'SCISSORS') ||
        (playerMove === 'SCISSORS' && opponentMove === 'PAPER') ||
        (playerMove === 'PAPER' && opponentMove === 'ROCK');

      if (playerWins) {
        wins++;
        currentWinStreak++;
        currentLossStreak = 0;
        maxWinStreak = Math.max(maxWinStreak, currentWinStreak);
      } else {
        losses++;
        currentLossStreak++;
        currentWinStreak = 0;
        maxLossStreak = Math.max(maxLossStreak, currentLossStreak);
      }
    });

    const totalGames = wins + losses;
    return {
      name: playerName,
      wins,
      losses,
      totalGames,
      winRate: totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0,
      winStreak: maxWinStreak,
      lossStreak: maxLossStreak,
      moveStats,
    };
  }, [matches, playerNames, query]);

  return (
    <div className="player-search">
      <div className="page-header">
        <h1>Player Search</h1>
      </div>

      <div className="search-container">
        <input
          type="text"
          className="search-input"
          placeholder="Search for a player..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {playerNames.length > 0 && query && (
          <div className="player-suggestions">
            {playerNames.slice(0, 5).map(name => (
              <button
                key={name}
                className="suggestion"
                onClick={() => setQuery(name)}
              >
                {name}
              </button>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="error">
          Error: {error}
        </div>
      )}

      {loading ? (
        <PlayerStatsSkeleton />
      ) : stats && (
        <div className="player-stats">
          <h2>{stats.name}</h2>
          <div className="stats-grid">
            <div className="stat">
              <span className="stat-value">{stats.totalGames}</span>
              <span className="stat-label">Games</span>
            </div>
            <div className="stat">
              <span className="stat-value wins">{stats.wins}</span>
              <span className="stat-label">Wins</span>
            </div>
            <div className="stat">
              <span className="stat-value losses">{stats.losses}</span>
              <span className="stat-label">Losses</span>
            </div>
            <div className="stat">
              <span className="stat-value win-rate">{stats.winRate}%</span>
              <span className="stat-label">Win Rate</span>
            </div>
          </div>
          
          {(stats.winStreak > 0 || stats.lossStreak > 0) && (
            <div className="streaks">
              {stats.winStreak > 0 && (
                <span className="streak win-streak">🔥 {stats.winStreak} win streak</span>
              )}
              {stats.lossStreak > 0 && (
                <span className="streak loss-streak">📉 {stats.lossStreak} loss streak</span>
              )}
            </div>
          )}
          
          <div className="move-breakdown">
            <h3>Move Statistics</h3>
            <div className="move-bars">
              {(['ROCK', 'PAPER', 'SCISSORS'] as Move[]).map(move => {
                const count = stats.moveStats[move];
                const percentage = stats.totalGames > 0 ? (count / stats.totalGames) * 100 : 0;
                return (
                  <div key={move} className="move-bar-container">
                    <div className="move-bar-label">
                      <span>{MOVE_ICONS[move]} {move}</span>
                      <span>{count} ({percentage.toFixed(0)}%)</span>
                    </div>
                    <div className="move-bar-bg">
                      <div 
                        className="move-bar-fill" 
                        style={{ 
                          width: `${percentage}%`,
                          backgroundColor: COLORS[move as keyof typeof COLORS]
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="matches-list">
          <h3>Searching...</h3>
          <div className="matches-grid">
            {Array.from({ length: 4 }).map((_, i) => <MatchCardSkeleton key={i} />)}
          </div>
        </div>
      ) : matches.length > 0 ? (
        <div className="matches-list">
          <h3>{matches.length} matches found</h3>
          <div className="matches-grid">
            {matches.map(game => (
              <MatchCard 
                key={game.gameId} 
                game={game}
                onClick={() => setSelectedGame(game)}
              />
            ))}
          </div>
        </div>
      ) : query.trim() ? (
        <div className="empty">No matches found for "{query}"</div>
      ) : null}

      <Modal
        isOpen={!!selectedGame}
        onClose={() => setSelectedGame(null)}
        title="Match Details"
      >
        {selectedGame && (
          <div className="match-details">
            <div className="detail-row">
              <span className="detail-label">Game ID</span>
              <span className="detail-value">{selectedGame.gameId}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Date</span>
              <span className="detail-value">{new Date(selectedGame.time).toLocaleString()}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Player A</span>
              <span className="detail-value">{selectedGame.playerA.name}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Move</span>
              <span className="detail-value">
                {MOVE_ICONS[selectedGame.playerA.played]} {selectedGame.playerA.played}
              </span>
            </div>
            <div className="detail-divider"></div>
            <div className="detail-row">
              <span className="detail-label">Player B</span>
              <span className="detail-value">{selectedGame.playerB.name}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Move</span>
              <span className="detail-value">
                {MOVE_ICONS[selectedGame.playerB.played]} {selectedGame.playerB.played}
              </span>
            </div>
            <div className="detail-divider"></div>
            <div className="detail-row">
              <span className="detail-label">Winner</span>
              <span className="detail-value winner">
                {determineWinner(selectedGame.playerA.played, selectedGame.playerB.played) === 'TIE' 
                  ? 'TIE' 
                  : determineWinner(selectedGame.playerA.played, selectedGame.playerB.played) === 'A' 
                    ? selectedGame.playerA.name 
                    : selectedGame.playerB.name}
              </span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
