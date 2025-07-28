import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Eye, EyeOff, User, Mail, Users } from 'lucide-react';

const LoginPage = () => {
  const { login, register } = useAuth();
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    email: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      if (isLoginMode) {
        // Login
        const result = await login(formData.username, formData.email);
        if (!result.success) {
          setError(result.error || 'Login failed');
        }
      } else {
        // Register
        const result = await register(formData.username, formData.email);
        if (result.success) {
          setSuccessMessage('Registration successful! You are now logged in.');
        } else {
          setError(result.error || 'Registration failed');
        }
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
    setError('');
    setSuccessMessage('');
    setFormData({ username: '', email: '' });
  };

  const fillDemoCredentials = () => {
    setFormData({
      username: 'user123',
      email: 'user@gmail.com'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-16 w-16 rounded-full flex items-center justify-center" style={{ backgroundColor: '#9f7aea' }}>
            <Users className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {isLoginMode ? 'Sign in to your account' : 'Create new account'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Atom HR Community Wall
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="sr-only">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  className="appearance-none relative block w-full px-3 py-2 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm"
                  placeholder="Username"
                  value={formData.username}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none relative block w-full px-3 py-2 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm"
                  placeholder="Email address"
                  value={formData.email}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-md">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="text-green-600 text-sm text-center bg-green-50 p-3 rounded-md">
              {successMessage}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
              style={{ backgroundColor: '#9f7aea' }}
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {isLoginMode ? 'Signing in...' : 'Creating account...'}
                </div>
              ) : (
                isLoginMode ? 'Sign in' : 'Create Account'
              )}
            </button>
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={toggleMode}
              className="text-sm text-purple-600 hover:text-purple-500"
            >
              {isLoginMode ? "Don't have an account? Register" : "Already have an account? Sign in"}
            </button>

            {isLoginMode && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={fillDemoCredentials}
                  className="text-sm text-purple-600 hover:text-purple-500 underline"
                >
                  Use demo credentials
                </button>
                <div className="mt-2 text-xs text-gray-500">
                  Demo: user123 / user@gmail.com
                </div>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
