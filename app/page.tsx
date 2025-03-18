'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from './components/Navbar';
import NoteEditor from './components/NoteEditor';
import { useAuth } from './context/AuthContext';
import { 
  ClipboardDocumentListIcon, 
  CurrencyDollarIcon, 
  FireIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

export default function Home() {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  return (
    <div className="min-h-screen bg-slate-900">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-fadeIn" style={{ animationDelay: '0.2s' }}>
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-4 font-heading">
              <span className="text-gradient">Recallio</span>
            </h1>
            <p className="mt-6 text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto font-light">
              Smart task management, expense tracking, and calorie counting with AI assistance
            </p>
            
            <div className="mt-8 flex flex-wrap justify-center gap-2">
              <div className="flex items-center px-4 py-2 bg-slate-800/50 backdrop-blur-sm rounded-full border border-slate-700 text-gray-300">
                <SparklesIcon className="h-5 w-5 text-indigo-400 mr-2" />
                <span>AI-powered analysis</span>
              </div>
              <div className="flex items-center px-4 py-2 bg-slate-800/50 backdrop-blur-sm rounded-full border border-slate-700 text-gray-300">
                <ClipboardDocumentListIcon className="h-5 w-5 text-indigo-400 mr-2" />
                <span>Task management</span>
              </div>
              <div className="flex items-center px-4 py-2 bg-slate-800/50 backdrop-blur-sm rounded-full border border-slate-700 text-gray-300">
                <CurrencyDollarIcon className="h-5 w-5 text-indigo-400 mr-2" />
                <span>Expense tracking</span>
              </div>
              <div className="flex items-center px-4 py-2 bg-slate-800/50 backdrop-blur-sm rounded-full border border-slate-700 text-gray-300">
                <FireIcon className="h-5 w-5 text-indigo-400 mr-2" />
                <span>Calorie counting</span>
              </div>
            </div>
          </div>
          
          {mounted && user ? (
            <>
              <div className="mb-16 animate-fadeIn" style={{ animationDelay: '0.4s' }}>
                <NoteEditor />
              </div>
              
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-8 font-heading animate-fadeIn" style={{ animationDelay: '0.6s' }}>
                Quick Access
              </h2>
              
              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                <Link
                  href="/tasks"
                  className="block card-gradient p-6 rounded-xl shadow-xl hover-lift border border-slate-700/50 animate-fadeIn"
                  style={{ animationDelay: '0.7s' }}
                >
                  <div className="flex items-center">
                    <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 p-3 rounded-lg shadow-md transform transition-transform group-hover:scale-105">
                      <ClipboardDocumentListIcon className="h-7 w-7 text-white" aria-hidden="true" />
                    </div>
                    <div className="ml-5">
                      <h3 className="text-xl font-medium text-white font-heading">Task Manager</h3>
                      <p className="mt-1 text-gray-400">
                        Organize your tasks and track your productivity
                      </p>
                    </div>
                  </div>
                </Link>
                
                <Link
                  href="/expenses"
                  className="block card-gradient p-6 rounded-xl shadow-xl hover-lift border border-slate-700/50 animate-fadeIn"
                  style={{ animationDelay: '0.8s' }}
                >
                  <div className="flex items-center">
                    <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 p-3 rounded-lg shadow-md">
                      <CurrencyDollarIcon className="h-7 w-7 text-white" aria-hidden="true" />
                    </div>
                    <div className="ml-5">
                      <h3 className="text-xl font-medium text-white font-heading">Expense Manager</h3>
                      <p className="mt-1 text-gray-400">
                        Track your spending and monitor your budget
                      </p>
                    </div>
                  </div>
                </Link>
                
                <Link
                  href="/calories"
                  className="block card-gradient p-6 rounded-xl shadow-xl hover-lift border border-slate-700/50 animate-fadeIn"
                  style={{ animationDelay: '0.9s' }}
                >
                  <div className="flex items-center">
                    <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 p-3 rounded-lg shadow-md">
                      <FireIcon className="h-7 w-7 text-white" aria-hidden="true" />
                    </div>
                    <div className="ml-5">
                      <h3 className="text-xl font-medium text-white font-heading">Calorie Counter</h3>
                      <p className="mt-1 text-gray-400">
                        Track your food intake and monitor your nutrition
                      </p>
                    </div>
                  </div>
                </Link>
              </div>
            </>
          ) : (
            <div className="card-gradient p-8 rounded-2xl shadow-2xl text-center border border-slate-700/50 max-w-2xl mx-auto animate-fadeIn" style={{ animationDelay: '0.5s' }}>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-4 font-heading">
                Get Started
              </h2>
              <p className="text-gray-300 mb-8 text-lg">
                Sign in or create an account to start tracking your tasks, expenses, and calories with AI assistance.
              </p>
              <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-6 justify-center">
                <Link
                  href="/login"
                  className="btn-primary py-3 px-6 rounded-lg text-white font-medium shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all"
                >
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  className="bg-slate-700 hover:bg-slate-600 py-3 px-6 rounded-lg text-gray-300 font-medium shadow-lg transition-all border border-slate-600"
                >
                  Create account
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
