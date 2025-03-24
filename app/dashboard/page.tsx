'use client';

import { useState } from 'react';
import Navbar from '../components/Navbar';
import TaskList from '../components/TaskList';
import ExpenseList from '../components/ExpenseList';
import CalorieCounter from '../components/CalorieCounter';
import PremiumAlert from '../components/PremiumAlert';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/Tabs';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('tasks');

  return (
    <div className="min-h-screen bg-slate-900">
      <Navbar />
      <PremiumAlert />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-10">
        <h1 className="text-3xl font-bold text-white mb-8 font-heading">Dashboard</h1>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-8">
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="calories">Calories</TabsTrigger>
          </TabsList>
          
          <TabsContent value="tasks">
            <TaskList />
          </TabsContent>
          
          <TabsContent value="expenses">
            <ExpenseList />
          </TabsContent>
          
          <TabsContent value="calories">
            <CalorieCounter />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 