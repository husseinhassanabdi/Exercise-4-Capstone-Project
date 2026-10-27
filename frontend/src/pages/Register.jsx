import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '../lib/api.js';
import { extractErrorMessages } from '../util/errorUtils.js';

const initialValues = { username: '', email: '', password: '', confirmPassword: '' };

export default function Register() {
  const [values, setValues] = useState(initialValues);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const register = useMutation({
    mutationFn: ({ username, email, password }) =>
      apiRequest('/auth/register', {
        method: 'POST',
        body: { username, email, password },
      }),
    onSuccess: () => {
      setSuccessMessage('Your account is ready. Sign in to continue.');
      setValues(initialValues);
    },
    onError: (error) => setErrorMessage(extractErrorMessages(error)),
  });

  function handleSubmit(event) {
    event.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (values.username.trim().length < 2 || values.username.trim().length > 50) {
      setErrorMessage('Full name must be between 2 and 50 characters.');
      return;
    }
    if (values.password.length < 8 || values.password.length > 72) {
      setErrorMessage('Password must be between 8 and 72 characters.');
      return;
    }
    if (values.password !== values.confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    register.mutate(values);
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <a className="brand brand-auth" href="/" aria-label="Bluewave home">
          <span className="brand-mark">B</span>
          <span>Bluewave</span>
        </a>
        <p className="eyebrow">GET STARTED</p>
        <h1>Create your account</h1>
        <p className="auth-subtitle">A clearer view of your finances starts here.</p>

        <form className="form-stack" onSubmit={handleSubmit}>
          <label className="field">
            <span>Full name</span>
            <input
              name="username"
              autoComplete="name"
              value={values.username}
              onChange={(event) => setValues({ ...values, username: event.target.value })}
              placeholder="Your full name"
              minLength={2}
              maxLength={50}
              required
            />
          </label>
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
              autoComplete="new-password"
              value={values.password}
              onChange={(event) => setValues({ ...values, password: event.target.value })}
              placeholder="At least 8 characters"
              minLength={8}
              maxLength={72}
              required
            />
          </label>
          <label className="field">
            <span>Confirm password</span>
            <input
              type="password"
              name="confirmPassword"
              autoComplete="new-password"
              value={values.confirmPassword}
              onChange={(event) => setValues({ ...values, confirmPassword: event.target.value })}
              placeholder="Enter your password again"
              required
            />
          </label>
          {errorMessage && <p className="notice notice-error" role="alert">{errorMessage}</p>}
          {successMessage && <p className="notice notice-success" role="status">{successMessage}</p>}
          <button className="button button-primary button-full" disabled={register.isPending}>
            {register.isPending ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <a href="/login">Sign In</a>
        </p>
      </section>
    </main>
  );
}
