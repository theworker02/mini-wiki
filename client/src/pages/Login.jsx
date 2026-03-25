import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import AuthForm from '../components/AuthForm';
import AnimatedWrapper from '../components/AnimatedWrapper';
import { useAuth } from '../context/AuthContext';

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (payload) => {
    setSubmitting(true);
    setError('');
    try {
      await login(payload);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatedWrapper>
      <div className="mx-auto max-w-md">
        <AuthForm type="login" onSubmit={onSubmit} submitting={submitting} error={error} />
        <p className="mt-3 text-center text-sm text-slate-600">
          Need an account? <Link to="/register" className="font-semibold text-[var(--accent-color)]">Register</Link>
        </p>
      </div>
    </AnimatedWrapper>
  );
}

export default Login;
