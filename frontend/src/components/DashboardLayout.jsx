import { clearToken } from '../lib/api.js';

export default function DashboardLayout({ user, activeLabel, children }) {
  const isAdmin = user.role === 'admin';
  const dashboardUrl = isAdmin ? '/admin' : '/dashboard';

  function handleSignOut() {
    clearToken();
    window.location.assign('/login');
  }

  return (
    <div className="dashboard-page">
      <header className="topbar">
        <a className="brand" href={dashboardUrl}>
          <span className="brand-mark">B</span>
          <span>Bluewave</span>
        </a>
        <nav className="topbar-nav" aria-label="Main navigation">
          <a className="nav-current" href={dashboardUrl}>{activeLabel}</a>
        </nav>
        <div className="account-actions">
          <span className="user-greeting">{user.username}</span>
          <span className="role-badge">{isAdmin ? 'Admin' : 'Personal account'}</span>
          <button className="button button-quiet" onClick={handleSignOut}>Sign out</button>
        </div>
      </header>
      <main className="dashboard-content">{children}</main>
    </div>
  );
}
