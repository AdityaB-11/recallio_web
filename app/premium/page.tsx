'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Navbar from '../components/Navbar';
import Card, { CardContent, CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import PremiumAlert from '../components/PremiumAlert';
import { useAuth } from '../context/AuthContext';
import { 
  CheckIcon, 
  SparklesIcon, 
  ShieldCheckIcon, 
  ClockIcon, 
  ArrowTrendingUpIcon, 
  ChartBarIcon,
  BoltIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

export default function PremiumPage() {
  const { user, isPremium, upgradeToPremium, isOnline } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [upgradeSuccess, setUpgradeSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [promoCode, setPromoCode] = useState('');
  
  // Get promo code from environment variable
  const validPromoCode = process.env.NEXT_PUBLIC_PREMIUM_PROMO_CODE || '';

  // Reset error when coming back online
  useEffect(() => {
    if (isOnline && error?.includes('offline')) {
      setError(null);
    }
  }, [isOnline, error]);

  // Redirect if already premium
  useEffect(() => {
    if (isPremium) {
      router.push('/?alreadyPremium=true');
    }
  }, [isPremium, router]);

  // Check if the promo code is valid and apply it
  const applyPromoCode = async () => {
    if (!promoCode) {
      setError('Please enter a promo code');
      return;
    }

    setIsUpgrading(true);
    setError(null);
    
    try {
      if (validPromoCode && promoCode === validPromoCode) {
        // Automatically upgrade the user when they enter the correct promo code
        await upgradeToPremium(promoCode);
        
        setUpgradeSuccess(true);
        
        // If offline, show a special message
        if (!isOnline) {
          setError("You're currently offline. Your premium access will be activated when you reconnect.");
          return;
        }
        
        // Redirect to dashboard after a short delay with success message
        setTimeout(() => {
          router.push('/?promoApplied=true');
        }, 2000);
      } else {
        setError('Invalid promo code. Please check and try again.');
      }
    } catch (err: any) {
      console.error('Failed to apply promo code:', err);
      
      // Handle offline error specifically
      if (err.message?.includes('offline') || err.code === 'failed-precondition' || err.code === 'unavailable') {
        setError('Unable to apply promo code while offline. Please check your internet connection and try again.');
      } else {
        setError(err.message || 'Failed to apply promo code. Please try again.');
      }
    } finally {
      setIsUpgrading(false);
    }
  };

  const premiumFeatures = [
    {
      title: "Full Access to All Features",
      description: "Unlock all features including advanced task management, detailed expense tracking, and comprehensive calorie counting.",
      icon: <ShieldCheckIcon className="h-6 w-6 text-indigo-400" />,
    },
    {
      title: "AI-Powered Analysis",
      description: "Our AI helps you identify patterns in your tasks, spending, and nutrition to provide personalized insights.",
      icon: <SparklesIcon className="h-6 w-6 text-indigo-400" />,
    },
    {
      title: "Data Visualization",
      description: "Beautiful charts and graphs help you visualize your progress and patterns over time.",
      icon: <ChartBarIcon className="h-6 w-6 text-indigo-400" />,
    },
    {
      title: "Enhanced Performance",
      description: "Experience faster load times and smoother animations with priority server processing.",
      icon: <BoltIcon className="h-6 w-6 text-indigo-400" />,
    },
    {
      title: "Progress Tracking",
      description: "Track your progress towards your goals with detailed metrics and insights.",
      icon: <ArrowTrendingUpIcon className="h-6 w-6 text-indigo-400" />,
    },
    {
      title: "Future Updates",
      description: "Be the first to access new features and improvements as they're released.",
      icon: <ClockIcon className="h-6 w-6 text-indigo-400" />,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-900">
      <Navbar />
      <PremiumAlert />
      
      {/* Offline Banner */}
      {!isOnline && (
        <div className="fixed top-20 inset-x-0 z-50 animate-fadeIn">
          <div className="max-w-6xl mx-auto px-4">
            <div className="bg-yellow-900/80 backdrop-blur-sm border border-yellow-700 text-yellow-200 p-3 rounded-lg flex items-center shadow-lg">
              <ExclamationTriangleIcon className="h-5 w-5 mr-2 flex-shrink-0" />
              <p>You're currently offline. Some premium features may be unavailable until you reconnect.</p>
            </div>
          </div>
        </div>
      )}
      
      <main className="pt-24 pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 animate-fadeIn">
            <div className="inline-block relative mb-4">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 blur-xl opacity-30 rounded-full"></div>
              <div className="relative bg-indigo-900/30 p-4 rounded-full border border-indigo-500/30">
                <SparklesIcon className="h-12 w-12 text-indigo-400" />
              </div>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 font-heading">
              <span className="text-gradient">Recallio Premium</span>
            </h1>
            
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Unlock the full potential of Recallio with our premium features. Enter your promo code below to get started.
            </p>
          </div>
          
          {/* Promo Code Section */}
          <div className="max-w-md mx-auto mb-12 animate-fadeIn">
            <Card withGradient>
              <CardHeader className="text-center">
                <h2 className="text-2xl font-bold font-heading">Enter Promo Code</h2>
                <p className="text-gray-300 mt-2">Redeem your promo code to unlock premium features</p>
              </CardHeader>
              <CardContent>
                {upgradeSuccess ? (
                  <div className="text-center py-4">
                    <div className="mx-auto h-12 w-12 bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                      <CheckIcon className="h-6 w-6 text-green-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Success!</h3>
                    <p className="text-gray-300">
                      Your premium access has been activated. You now have full access to all premium features!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="promo-code" className="block text-sm font-medium text-gray-300 mb-1">
                        Promo Code
                      </label>
                      <input
                        type="text"
                        id="promo-code"
                        className="w-full p-3 bg-slate-800 border border-slate-700 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="Enter your promo code"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                      />
                    </div>
                    
                    {error && (
                      <div className="p-3 bg-red-900/30 border border-red-800 rounded-md text-red-200">
                        {error}
                      </div>
                    )}
                    
                    <Button
                      variant="primary"
                      size="lg"
                      className="w-full"
                      onClick={applyPromoCode}
                      disabled={isUpgrading || !promoCode}
                    >
                      {isUpgrading ? 'Applying...' : 'Apply Promo Code'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Features List */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-center mb-8 font-heading">
              <span className="text-gradient">Premium Features</span>
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {premiumFeatures.map((feature, index) => (
                <div 
                  key={index}
                  className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 transition-transform hover:transform hover:scale-105 animate-fadeIn"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="mb-4 bg-indigo-900/30 p-3 inline-block rounded-lg">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-white">{feature.title}</h3>
                  <p className="text-gray-300">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 