import './Skeleton.css';

interface SkeletonProps {
  width?: string;
  height?: string;
  borderRadius?: string;
  className?: string;
}

export function Skeleton({ width = '100%', height = '20px', borderRadius = '4px', className = '' }: SkeletonProps) {
  return (
    <div 
      className={`skeleton ${className}`}
      style={{ width, height, borderRadius }}
    />
  );
}

export function MatchCardSkeleton() {
  return (
    <div className="match-card-skeleton">
      <div className="skeleton-header">
        <Skeleton width="80px" height="12px" />
        <Skeleton width="120px" height="12px" />
      </div>
      <div className="skeleton-players">
        <div className="skeleton-player">
          <Skeleton width="100px" height="16px" />
          <Skeleton width="60px" height="14px" />
        </div>
        <Skeleton width="30px" height="12px" />
        <div className="skeleton-player skeleton-player-right">
          <Skeleton width="100px" height="16px" />
          <Skeleton width="60px" height="14px" />
        </div>
      </div>
    </div>
  );
}

export function LeaderboardSkeleton() {
  return (
    <div className="leaderboard-skeleton">
      <div className="skeleton-table-header">
        <Skeleton width="50px" height="16px" />
        <Skeleton width="150px" height="16px" />
        <Skeleton width="60px" height="16px" />
        <Skeleton width="60px" height="16px" />
        <Skeleton width="60px" height="16px" />
      </div>
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="skeleton-table-row">
          <Skeleton width="30px" height="20px" borderRadius="50%" />
          <Skeleton width="120px" height="20px" />
          <Skeleton width="40px" height="20px" />
          <Skeleton width="40px" height="20px" />
          <Skeleton width="40px" height="20px" />
        </div>
      ))}
    </div>
  );
}

export function PlayerStatsSkeleton() {
  return (
    <div className="player-stats-skeleton">
      <Skeleton width="200px" height="28px" />
      <div className="skeleton-stats-grid">
        <div className="skeleton-stat">
          <Skeleton width="40px" height="32px" />
          <Skeleton width="50px" height="12px" />
        </div>
        <div className="skeleton-stat">
          <Skeleton width="40px" height="32px" />
          <Skeleton width="50px" height="12px" />
        </div>
        <div className="skeleton-stat">
          <Skeleton width="40px" height="32px" />
          <Skeleton width="50px" height="12px" />
        </div>
        <div className="skeleton-stat">
          <Skeleton width="40px" height="32px" />
          <Skeleton width="50px" height="12px" />
        </div>
      </div>
    </div>
  );
}
