import { useQuery } from '@tanstack/react-query';
import DashboardLayout from '../components/DashboardLayout.jsx';
import { apiRequest } from '../lib/api.js';
import { extractErrorMessages } from '../util/errorUtils.js';

const currency = new Intl.NumberFormat(undefined, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export default function AdminDashboard({ user }) {
  const overview = useQuery({
    queryKey: ['adminOverview'],
    queryFn: () => apiRequest('/admin/overview'),
    retry: false,
  });

  return (
    <DashboardLayout user={user} activeLabel="Admin overview">
      <section className="welcome-row">
        <div>
          <p className="eyebrow">ADMINISTRATION</p>
          <h1>Platform overview</h1>
          <p className="muted">Administrative statistics from your existing API.</p>
        </div>
      </section>

      {overview.isPending && <p className="notice">Loading administrative statistics…</p>}
      {overview.error && (
        <section className="notice notice-error" role="alert">
          <strong>Administrative statistics are unavailable.</strong>
          <span>{extractErrorMessages(overview.error)}</span>
          <span>
            The frontend requests the existing <code>/api/admin/overview</code> endpoint.
            The backend currently does not mount this route.
          </span>
        </section>
      )}
      {overview.data && (
        <>
          <section className="summary-grid" aria-label="Administrative statistics">
            <article className="summary-card">
              <span className="summary-label">Registered users</span>
              <strong>{overview.data.totalUsers}</strong>
              <span className="summary-footnote">All accounts</span>
            </article>
            <article className="summary-card">
              <span className="summary-label">Income recorded</span>
              <strong>{currency.format(overview.data.totals?.income || 0)}</strong>
              <span className="summary-footnote">Across transactions</span>
            </article>
            <article className="summary-card">
              <span className="summary-label">Expenses recorded</span>
              <strong>{currency.format(overview.data.totals?.expense || 0)}</strong>
              <span className="summary-footnote">Across transactions</span>
            </article>
          </section>
          <section className="panel">
            <div className="panel-heading">
              <div>
                <h2>Top spending categories</h2>
                <p className="muted">Highest expense totals across the platform.</p>
              </div>
            </div>
            {overview.data.spendingCategories?.length ? (
              <ul className="category-list">
                {overview.data.spendingCategories.map((category) => (
                  <li key={category._id}>
                    <span>{category._id}</span>
                    <strong>{currency.format(category.totalSpent)}</strong>
                  </li>
                ))}
              </ul>
            ) : <p className="empty-state">No spending category data is available.</p>}
          </section>
        </>
      )}

      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>User management</h2>
            <p className="muted">Available backend operations are required to manage accounts.</p>
          </div>
        </div>
        <p className="notice">
          No admin-protected user-management endpoint is defined in the current backend.
          This section is intentionally not populated from the general authenticated users
          endpoint, because that route does not enforce the admin role.
        </p>
      </section>
    </DashboardLayout>
  );
}
