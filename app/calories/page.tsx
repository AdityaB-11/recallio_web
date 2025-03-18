'use client';

import Navbar from '../components/Navbar';
import CalorieCounter from '../components/CalorieCounter';

export default function CaloriesPage() {
  return (
    <div className="min-h-screen bg-slate-900">
      <Navbar />
      
      <main className="py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-white mb-6">Calorie Counter</h1>
          
          <CalorieCounter />
        </div>
      </main>
    </div>
  );
} 