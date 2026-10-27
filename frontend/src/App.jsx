import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import SignIn from './pages/SignIn.jsx';
import Register from './pages/Register.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import UserDashboard from './pages/UserDashboard.jsx';
import { apiRequest, clearToken, getToken } from './lib/api.js';
import { extractErrorMessages } from './util/errorUtils.js';
import './App.css';

function ProtectedPage({ role, children }) {
  const token = getToken();
  const { data, error, isPending } = useQuery({
    queryKey: ['profile'],
    queryFn: () => apiRequest('/auth/profile'),
    enabled: Boolean(token),
    retry: false,
  });

  useEffect(() => {
    if (!token) {
      window.location.replace('/login');
    } else if (error?.status === 401) {
      clearToken();
      window.location.replace('/login');
    } else if (data && (!data.user || !['admin', 'user'].includes(data.user.role))) {
      clearToken();
      window.location.replace('/login');
    }
  }, [data, error, token]);

  if (!token || isPending || error?.status === 401) {
    return <LoadingPage message="Checking your account..." />;
  }

  if (error) {
    return (
      <main className="page-shell">
        <section className="notice notice-error" role="alert">
          Could not verify your account: {extractErrorMessages(error)}
        </section>
      </main>
    );
  }

  const user = data?.user;
  if (!user || !['admin', 'user'].includes(user.role)) {
    return <LoadingPage message="Redirecting to sign in..." />;
  }

  const destination = user.role === 'admin' ? '/admin' : '/dashboard';
  if (role && user.role !== role) {
    return <RedirectPage destination={destination} message="Opening your dashboard..." />;
  }

  return children(user);
}

function LoadingPage({ message }) {
  return (
    <main className="loading-screen" aria-live="polite">
      <span className="loading-spinner" aria-hidden="true" />
      <p>{message}</p>
    </main>
  );
}

function RedirectPage({ destination, message }) {
  useEffect(() => {
    window.location.replace(destination);
  }, [destination]);

  return <LoadingPage message={message} />;
}

function HomeRedirect() {
  return (
    <ProtectedPage>
      {(user) => (
        <RedirectPage
          destination={user.role === 'admin' ? '/admin' : '/dashboard'}
          message="Opening your dashboard..."
        />
      )}
    </ProtectedPage>
  );
}

function App() {
  const path = window.location.pathname.replace(/\/+$/, '') || '/';

  if (path === '/register') return <Register />;
  if (path === '/login') return <SignIn />;
  if (path === '/admin') {
    return (
      <ProtectedPage role="admin">
        {(user) => <AdminDashboard user={user} />}
      </ProtectedPage>
    );
  }

  if (path === '/dashboard') {
    return (
      <ProtectedPage role="user">
        {(user) => <UserDashboard user={user} />}
      </ProtectedPage>
    );
  }

  return <HomeRedirect />;
}

export default App;
