import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, getToken, saveToken } from '../lib/api.js';
import { extractErrorMessages } from '../util/errorUtils.js';

export default function SignIn() {
  const [values, setValues] = useState({ email: '', password: '' });
  const [errorMessage, setErrorMessage] = useState('');
  const signIn = useMutation({
    mutationFn: (credentials) =>
      apiRequest('/auth/login', { method: 'POST', body: credentials }),
    onSuccess: (result) => {
      if (!result?.token || !result?.user?.role) {
        setErrorMessage('The login response did not include account details.');
        return;
      }

      saveToken(result.token);
      window.location.assign(result.user.role === 'admin' ? '/admin' : '/dashboard');
    },
    onError: (error) => setErrorMessage(extractErrorMessages(error)),
  });

  if (getToken()) {
    return (
      <main className="loading-screen">
        <p>You are already signed in. <a href="/">Continue to your dashboard</a>.</p>
      </main>
    );
  }

  function handleSubmit(event) {
    event.preventDefault();
    setErrorMessage('');
    signIn.mutate(values);
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <a className="brand brand-auth" href="/" aria-label="Bluewave home">
          <span className="brand-mark">B</span>
          <span>Bluewave</span>
        </a>
        <p className="eyebrow">WELCOME BACK</p>
        <h1>Sign in to your account</h1>
        <p className="auth-subtitle">Manage your money with clarity and confidence.</p>

        <form className="form-stack" onSubmit={handleSubmit}>
          <label className="field">
            <span>Email address</span>
            <input
              type="email"
              name="email"
              autoComplete="email"
              value={values.email}
              onChange={(event) => setValues({ ...values, email: event.target.value })}
              placeholder="you@example.com"
              required
            />
          </label>
          <label className="field">
            <span>Password</span>
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              value={values.password}
              onChange={(event) => setValues({ ...values, password: event.target.value })}
              placeholder="Enter your password"
              required
            />
          </label>
          {errorMessage && <p className="notice notice-error" role="alert">{errorMessage}</p>}
          <button className="button button-primary button-full" disabled={signIn.isPending}>
            {signIn.isPending ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="auth-switch">
          New to Bluewave? <a href="/register">Create Account</a>
        </p>
      </section>
    </main>
  );
}
