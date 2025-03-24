'use client';

import { useRouter } from 'next/navigation';
import { SparklesIcon, ArrowRightIcon, WifiIcon } from '@heroicons/react/24/outline';
import Button from './ui/Button';
import { useAuth } from '../context/AuthContext';

interface PremiumPromoProps {
  className?: string;
  compact?: boolean;
}

export default function PremiumPromo({ className = '', compact = false }: PremiumPromoProps) {
  const router = useRouter();
  const { isOnline } = useAuth();
  
  const navigateToPremium = (withPromo = false) => {
    if (!isOnline) {
      // Show offline alert by adding a query parameter
      router.push('/?offline=true');
      return;
    }
    router.push(withPromo ? '/premium?showPromo=true' : '/premium');
  };
  
  if (compact) {
    return (
      <div className={`bg-gradient-to-r from-indigo-900/30 to-purple-900/30 border border-indigo-800/50 rounded-lg p-4 animate-fadeIn ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <SparklesIcon className="h-5 w-5 text-indigo-400 mr-3" />
            <span className="text-white font-medium">Unlock premium features</span>
          </div>
          <div className="flex items-center space-x-2">
            {!isOnline && (
              <div className="flex items-center text-yellow-400 text-xs">
                <WifiIcon className="h-4 w-4 mr-1" />
                <span>Offline</span>
              </div>
            )}
            <button 
              className={`text-indigo-400 hover:text-indigo-300 text-xs font-medium transition-colors underline
                ${!isOnline ? 'opacity-60 cursor-not-allowed' : ''}`}
              onClick={() => navigateToPremium(true)}
            >
              Have a promo code?
            </button>
            <Button 
              variant="primary" 
              size="sm" 
              onClick={() => navigateToPremium()}
              icon={<ArrowRightIcon className="h-4 w-4" />}
              iconPosition="right"
              disabled={!isOnline}
            >
              Upgrade
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`gradientBg p-6 sm:p-8 rounded-xl shadow-xl border border-indigo-800/50 animate-fadeIn ${className}`}>
      <div className="flex flex-col sm:flex-row items-center">
        <div className="bg-indigo-900/50 p-4 rounded-full mb-4 sm:mb-0 sm:mr-6">
          <SparklesIcon className="h-8 w-8 text-indigo-400" />
        </div>
        
        <div className="flex-1 text-center sm:text-left mb-4 sm:mb-0">
          <h3 className="text-xl font-bold text-white font-heading mb-2">Upgrade to Premium</h3>
          <p className="text-gray-300">
            Unlock AI-powered analysis, task management, expense tracking, and calorie counting.
          </p>
          {!isOnline ? (
            <div className="mt-2 flex items-center text-yellow-400 text-sm justify-center sm:justify-start">
              <WifiIcon className="h-4 w-4 mr-1" />
              <span>You're offline. Reconnect to upgrade to premium.</span>
            </div>
          ) : (
            <button 
              className="text-indigo-400 hover:text-indigo-300 text-sm font-medium transition-colors underline mt-2"
              onClick={() => navigateToPremium(true)}
            >
              Have a promo code?
            </button>
          )}
        </div>
        
        <Button
          variant="primary"
          size="lg"
          onClick={() => navigateToPremium()}
          className="px-6 whitespace-nowrap"
          icon={<SparklesIcon className="h-5 w-5" />}
          disabled={!isOnline}
        >
          Get Premium
        </Button>
      </div>
      
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50">
          <div className="font-medium text-white mb-1">Smart Note Analysis</div>
          <div className="text-gray-400 text-sm">AI analyzes your notes and converts them to tasks, expenses, or food entries</div>
        </div>
        
        <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50">
          <div className="font-medium text-white mb-1">Premium Features</div>
          <div className="text-gray-400 text-sm">Access to task manager, expense tracker, and calorie counter</div>
        </div>
        
        <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50">
          <div className="font-medium text-white mb-1">Beautiful UI</div>
          <div className="text-gray-400 text-sm">Modern, dark theme interface with animations and responsive design</div>
        </div>
      </div>
    </div>
  );
} 