'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import Link from 'next/link';
import Button from '../components/ui/Button';
import Navbar from '../components/Navbar';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, isOnline } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    if (!isOnline) {
      setError('You are currently offline. Please check your internet connection and try again.');
      return;
    }
    
    setError('');
    setLoading(true);
    
    try {
      await login(email, password);
      router.push('/');
    } catch (err: any) {
      console.error('Login error:', err);
      
      // Handle specific error messages
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Invalid email or password');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many failed login attempts. Please try again later or reset your password');
      } else if (err.code === 'auth/api-key-not-valid') {
        setError('Firebase configuration error. The application is not properly configured.');
      } else if (err.message?.includes('Firebase configuration error')) {
        setError(err.message);
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('Failed to log in. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <Navbar />
      
      <div className="flex flex-col items-center justify-center px-6 py-8 mx-auto md:h-screen lg:py-0 pt-20">
        <div className="w-full bg-slate-800 rounded-lg shadow md:mt-0 sm:max-w-md xl:p-0">
          <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
            <h1 className="text-xl font-bold leading-tight tracking-tight text-indigo-400 md:text-2xl">
              Sign in to your account
            </h1>
            
            <p className="text-sm text-white">
              Welcome back! Please enter your credentials to access your account.
            </p>
            
            {error && (
              <div className="p-3 bg-red-900/30 border border-red-800 rounded-lg text-red-300 text-sm">
                {error}
                {error.includes('Firebase configuration') && (
                  <div className="mt-2 text-xs">
                    <p className="font-medium">Possible solutions:</p>
                    <ul className="list-disc pl-5 mt-1 space-y-1">
                      <li>Contact the site administrator</li>
                      <li>Check if the application has valid Firebase credentials</li>
                      <li>Try refreshing the page</li>
                    </ul>
                  </div>
                )}
              </div>
            )}
            
            <form className="space-y-4 md:space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-300">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-slate-700 border border-slate-600 text-white sm:text-sm rounded-lg focus:ring-indigo-600 focus:border-indigo-600 block w-full p-2.5"
                  placeholder="name@company.com"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block mb-2 text-sm font-medium text-gray-300">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-slate-700 border border-slate-600 text-white sm:text-sm rounded-lg focus:ring-indigo-600 focus:border-indigo-600 block w-full p-2.5"
                  required
                />
              </div>
              
              <Button 
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                isLoading={loading}
                disabled={loading || !isOnline}
              >
                Sign in
              </Button>
              
              <p className="text-sm text-gray-400">
                Don't have an account yet?{' '}
                <Link href="/signup" className="font-medium text-indigo-400 hover:underline">
                  Sign up
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 