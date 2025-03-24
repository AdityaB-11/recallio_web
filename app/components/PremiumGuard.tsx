'use client';

import { useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import Card, { CardContent } from './ui/Card';
import Button from './ui/Button';
import { SparklesIcon } from '@heroicons/react/24/outline';

interface PremiumGuardProps {
  children: ReactNode;
}

export default function PremiumGuard({ children }: PremiumGuardProps) {
  const { user, isPremium, checkPremiumStatus } = useAuth();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [hasPremium, setHasPremium] = useState(false);

  useEffect(() => {
    const verifyPremium = async () => {
      if (!user) {
        setIsChecking(false);
        return;
      }

      try {
        // First use the cached status
        setHasPremium(isPremium);
        
        // Then verify with the server (in case premium has expired)
        const status = await checkPremiumStatus();
        setHasPremium(status);
      } catch (error) {
        console.error('Error checking premium status:', error);
      } finally {
        setIsChecking(false);
      }
    };

    verifyPremium();
  }, [user, isPremium, checkPremiumStatus]);

  if (isChecking) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-slate-900">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-400 border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  if (!hasPremium) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <Card withGradient className="max-w-2xl w-full animate-fadeIn">
          <CardContent className="text-center py-8">
            <div className="mx-auto w-16 h-16 bg-indigo-800/50 rounded-full flex items-center justify-center mb-4">
              <SparklesIcon className="h-8 w-8 text-indigo-300" />
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-4 font-heading">
              Premium Feature
            </h2>
            
            <p className="text-gray-300 mb-8 max-w-lg mx-auto">
              This feature requires premium access. Enter your promo code to unlock all premium features including advanced task management, detailed expense tracking, and comprehensive calorie counting.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button
                variant="primary"
                size="lg"
                onClick={() => router.push('/premium')}
              >
                Enter Promo Code
              </Button>
              
              <Button
                variant="secondary"
                size="lg"
                onClick={() => router.push('/')}
              >
                Return to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
} 