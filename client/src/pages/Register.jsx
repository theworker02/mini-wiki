import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import AuthForm from '../components/AuthForm';
import AnimatedWrapper from '../components/AnimatedWrapper';
import { useAuth } from '../context/AuthContext';

function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (payload) => {
    setSubmitting(true);
    setError('');
    try {
      await register(payload);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatedWrapper>
      <div className="mx-auto max-w-md">
        <AuthForm type="register" onSubmit={onSubmit} submitting={submitting} error={error} />
        <p className="mt-3 text-center text-sm text-slate-600">
          Already registered? <Link to="/login" className="font-semibold text-[var(--accent-color)]">Login</Link>
        </p>
      </div>
    </AnimatedWrapper>
  );
}

export default Register;
