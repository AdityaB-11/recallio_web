'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Expense, getUserExpenses, getExpenseSummaryByCategory, updateExpense, deleteExpense } from '../services/expenseService';
import { format } from 'date-fns';
import { TrashIcon, PencilIcon } from '@heroicons/react/20/solid';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

// Define some default categories and their colors
const categoryColors: Record<string, string> = {
  'Food': 'rgb(255, 99, 132)',
  'Transportation': 'rgb(54, 162, 235)',
  'Entertainment': 'rgb(255, 206, 86)',
  'Housing': 'rgb(75, 192, 192)',
  'Utilities': 'rgb(153, 102, 255)',
  'Healthcare': 'rgb(255, 159, 64)',
  'Shopping': 'rgb(199, 199, 199)',
  'Education': 'rgb(83, 102, 255)',
  'Travel': 'rgb(255, 99, 255)',
  'Uncategorized': 'rgb(159, 159, 159)'
};

// Generate a random color for categories not in our predefined list
const getColorForCategory = (category: string) => {
  if (categoryColors[category]) {
    return categoryColors[category];
  }
  
  // Generate a random color
  const r = Math.floor(Math.random() * 200) + 55;
  const g = Math.floor(Math.random() * 200) + 55;
  const b = Math.floor(Math.random() * 200) + 55;
  
  return `rgb(${r}, ${g}, ${b})`;
};

export default function ExpenseManager() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categorySummary, setCategorySummary] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  
  const loadExpenses = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const userExpenses = await getUserExpenses(user.uid);
      setExpenses(userExpenses);
      
      const summary = await getExpenseSummaryByCategory(user.uid);
      setCategorySummary(summary);
    } catch (err) {
      console.error('Error loading expenses:', err);
      setError('Failed to load expenses. Please refresh the page to try again.');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    if (user) {
      loadExpenses();
    } else {
      setExpenses([]);
      setCategorySummary({});
      setLoading(false);
    }
  }, [user]);
  
  const handleDeleteExpense = async (expenseId: string) => {
    try {
      await deleteExpense(expenseId);
      await loadExpenses(); // Reload expenses and summary
    } catch (err) {
      console.error('Error deleting expense:', err);
    }
  };
  
  const handleSaveEdit = async () => {
    if (!editingExpense || !editingExpense.id) return;
    
    try {
      await updateExpense(editingExpense.id, {
        amount: editingExpense.amount,
        category: editingExpense.category,
        description: editingExpense.description,
        date: editingExpense.date,
      });
      
      await loadExpenses(); // Reload expenses and summary
      setEditingExpense(null);
    } catch (err) {
      console.error('Error updating expense:', err);
    }
  };
  
  // Prepare chart data
  const chartData = {
    labels: Object.keys(categorySummary),
    datasets: [
      {
        data: Object.values(categorySummary),
        backgroundColor: Object.keys(categorySummary).map(category => getColorForCategory(category)),
        borderWidth: 1,
      },
    ],
  };
  
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
      },
    },
  };
  
  // Calculate total expenses
  const totalExpenses = Object.values(categorySummary).reduce((sum, amount) => sum + amount, 0);
  
  if (!user) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4">Expense Manager</h2>
        <p className="text-gray-600">Please log in to view and manage your expenses.</p>
      </div>
    );
  }
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Expense Manager</h2>
      
      {loading ? (
        <p className="text-gray-600">Loading expenses...</p>
      ) : error ? (
        <div className="p-3 bg-red-100 text-red-700 rounded-md">{error}</div>
      ) : (
        <div className="space-y-8">
          {/* Summary Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-lg mb-3">Expense Summary</h3>
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="text-2xl font-bold text-gray-900">
                  ${totalExpenses.toFixed(2)}
                </div>
                <div className="text-sm text-gray-500 mt-1">Total Expenses</div>
                
                <div className="mt-4">
                  {Object.entries(categorySummary).map(([category, amount]) => (
                    <div key={category} className="flex justify-between py-1">
                      <div className="flex items-center">
                        <div 
                          className="w-3 h-3 rounded-full mr-2" 
                          style={{ backgroundColor: getColorForCategory(category) }}
                        ></div>
                        <span>{category}</span>
                      </div>
                      <span className="font-medium">${amount.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium text-lg mb-3">Expense Distribution</h3>
              {Object.keys(categorySummary).length > 0 ? (
                <div className="h-64">
                  <Doughnut data={chartData} options={chartOptions} />
                </div>
              ) : (
                <div className="bg-gray-50 p-4 rounded-md flex items-center justify-center h-64">
                  <p className="text-gray-500">No expense data to display</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Expense List */}
          <div>
            <h3 className="font-medium text-lg mb-3">Recent Expenses</h3>
            
            {expenses.length === 0 ? (
              <p className="text-gray-600">No expenses found. Add an expense to get started.</p>
            ) : (
              <div className="space-y-4">
                {expenses.map(expense => (
                  <div 
                    key={expense.id} 
                    className="border border-gray-200 rounded-md p-4 hover:bg-gray-50"
                  >
                    {editingExpense && editingExpense.id === expense.id ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                            <input
                              type="number"
                              step="0.01"
                              className="w-full p-2 border border-gray-300 rounded-md"
                              value={editingExpense.amount}
                              onChange={(e) => setEditingExpense({ 
                                ...editingExpense, 
                                amount: parseFloat(e.target.value) 
                              })}
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                            <input
                              type="text"
                              className="w-full p-2 border border-gray-300 rounded-md"
                              value={editingExpense.category}
                              onChange={(e) => setEditingExpense({ 
                                ...editingExpense, 
                                category: e.target.value 
                              })}
                            />
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                          <input
                            type="text"
                            className="w-full p-2 border border-gray-300 rounded-md"
                            value={editingExpense.description || ''}
                            onChange={(e) => setEditingExpense({ 
                              ...editingExpense, 
                              description: e.target.value 
                            })}
                            placeholder="Description (optional)"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                          <input
                            type="date"
                            className="w-full p-2 border border-gray-300 rounded-md"
                            value={format(editingExpense.date, 'yyyy-MM-dd')}
                            onChange={(e) => setEditingExpense({ 
                              ...editingExpense, 
                              date: e.target.value ? new Date(e.target.value) : new Date() 
                            })}
                          />
                        </div>
                        
                        <div className="flex justify-end space-x-2">
                          <button
                            className="bg-gray-200 text-gray-800 px-3 py-1 rounded-md hover:bg-gray-300"
                            onClick={() => setEditingExpense(null)}
                          >
                            Cancel
                          </button>
                          <button
                            className="bg-indigo-600 text-white px-3 py-1 rounded-md hover:bg-indigo-500"
                            onClick={handleSaveEdit}
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center">
                            <span className="font-medium text-lg">${expense.amount.toFixed(2)}</span>
                            <span 
                              className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {expense.category}
                            </span>
                          </div>
                          
                          {expense.description && (
                            <p className="text-gray-600 mt-1">{expense.description}</p>
                          )}
                          
                          <p className="text-sm text-gray-500 mt-1">
                            {format(expense.date, 'MMM d, yyyy')}
                          </p>
                        </div>
                        
                        <div className="flex space-x-2">
                          <button
                            className="p-1 text-gray-500 hover:text-indigo-600"
                            onClick={() => setEditingExpense(expense)}
                            title="Edit expense"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button
                            className="p-1 text-gray-500 hover:text-red-600"
                            onClick={() => handleDeleteExpense(expense.id!)}
                            title="Delete expense"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 