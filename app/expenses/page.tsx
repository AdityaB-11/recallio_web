'use client';

import Navbar from '../components/Navbar';
import ExpenseManager from '../components/ExpenseManager';
import PremiumGuard from '../components/PremiumGuard';
import { CurrencyDollarIcon } from '@heroicons/react/24/outline';
import { CardHeader } from '../components/ui/Card';

export default function ExpensesPage() {
  return (
    <div className="min-h-screen bg-slate-900">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="animate-fadeIn">
            <CardHeader icon={<CurrencyDollarIcon className="h-8 w-8 text-indigo-400" />}>
              Expense Manager
            </CardHeader>
          </div>
          
          <div className="animate-fadeIn" style={{ animationDelay: '0.2s' }}>
            <PremiumGuard>
              <ExpenseManager />
            </PremiumGuard>
          </div>
        </div>
      </main>
    </div>
  );
} 