'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { XMarkIcon, SparklesIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

export default function PremiumAlert() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [show, setShow] = useState(false);
  const [type, setType] = useState<'promo-required' | 'promo-applied' | 'already-premium'>('promo-required');
  
  useEffect(() => {
    // Check for query parameters
    if (searchParams.has('promoApplied')) {
      setType('promo-applied');
      setShow(true);
    } else if (searchParams.has('alreadyPremium')) {
      setType('already-premium');
      setShow(true);
    } else if (searchParams.has('from') && searchParams.get('from') === 'premium-required') {
      setType('promo-required');
      setShow(true);
    }
  }, [searchParams]);
  
  if (!show) {
    return null;
  }
  
  let alertContent;
  
  switch (type) {
    case 'promo-applied':
      alertContent = (
        <div className="bg-green-900/60 border border-green-700 text-green-200 p-4 rounded-lg animate-fadeIn">
          <div className="flex">
            <div className="flex-shrink-0">
              <CheckCircleIcon className="h-5 w-5 text-green-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">
                Congratulations! Your promo code has been applied successfully. You now have full access to all premium features!
              </p>
            </div>
            <div className="ml-auto pl-3">
              <div className="-mx-1.5 -my-1.5">
                <button
                  type="button"
                  className="inline-flex rounded-md p-1.5 text-green-300 hover:bg-green-800 hover:text-green-200 focus:outline-none"
                  onClick={() => setShow(false)}
                >
                  <span className="sr-only">Dismiss</span>
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      );
      break;
      
    case 'already-premium':
      alertContent = (
        <div className="bg-indigo-900/60 border border-indigo-700 text-indigo-200 p-4 rounded-lg animate-fadeIn">
          <div className="flex">
            <div className="flex-shrink-0">
              <SparklesIcon className="h-5 w-5 text-indigo-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">
                You're already a premium member! You have full access to all premium features.
              </p>
            </div>
            <div className="ml-auto pl-3">
              <div className="-mx-1.5 -my-1.5">
                <button
                  type="button"
                  className="inline-flex rounded-md p-1.5 text-indigo-300 hover:bg-indigo-800 hover:text-indigo-200 focus:outline-none"
                  onClick={() => setShow(false)}
                >
                  <span className="sr-only">Dismiss</span>
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      );
      break;
      
    default:
      alertContent = (
        <div className="bg-indigo-900/60 border border-indigo-700 text-indigo-200 p-4 rounded-lg animate-fadeIn">
          <div className="flex">
            <div className="flex-shrink-0">
              <SparklesIcon className="h-5 w-5 text-indigo-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">
                This feature requires premium access. Enter your promo code to unlock all premium features.
              </p>
            </div>
            <div className="ml-auto pl-3">
              <div className="-mx-1.5 -my-1.5">
                <button
                  type="button"
                  className="inline-flex rounded-md p-1.5 text-indigo-300 hover:bg-indigo-800 hover:text-indigo-200 focus:outline-none"
                  onClick={() => setShow(false)}
                >
                  <span className="sr-only">Dismiss</span>
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      );
  }
  
  return (
    <div className="fixed top-16 inset-x-0 z-50 py-2 px-4 pointer-events-none">
      <div className="max-w-7xl mx-auto pointer-events-auto">
        {alertContent}
      </div>
    </div>
  );
}