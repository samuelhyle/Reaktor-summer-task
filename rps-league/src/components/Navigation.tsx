import './Navigation.css';

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function Navigation({ activeTab, onTabChange }: NavigationProps) {
  const tabs = [
    { id: 'latest', label: 'Latest Matches' },
    { id: 'search', label: 'Player Search' },
    { id: 'leaderboard', label: 'Leaderboard' },
  ];

  return (
    <nav className="navigation">
      <div className="nav-content">
        <div className="logo">
          <span className="logo-text">RPS</span>
          <span className="logo-league">LEAGUE</span>
        </div>
        <ul className="nav-links">
          {tabs.map(tab => (
            <li key={tab.id}>
              <button
                className={`nav-link ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => onTabChange(tab.id)}
              >
                {tab.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
