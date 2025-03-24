'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { analyzeText } from '../services/gemini';
import { addTask } from '../services/taskService';
import { addExpense } from '../services/expenseService';
import { addFoodEntry } from '../services/calorieService';
import { SparklesIcon, PaperAirplaneIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import Button from './ui/Button';

export default function NoteEditor() {
  const { user, isPremium } = useAuth();
  const router = useRouter();
  const [note, setNote] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!note.trim()) {
      setError('Please enter some text to analyze');
      return;
    }

    if (!user) {
      setError('Please log in to analyze notes');
      return;
    }
    
    if (!isPremium) {
      router.push('/premium?from=premium-required');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setAnalysisResult(null);

    try {
      const result = await analyzeText(note);
      setAnalysisResult(result);
      
      // Automatically save the analyzed data to the appropriate service
      if (result.confidence > 0.7) {
        await saveAnalyzedData(result);
      }
    } catch (err) {
      console.error('Error analyzing note:', err);
      setError('Failed to analyze note. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const saveAnalyzedData = async (result: any) => {
    if (!user) return;

    try {
      switch (result.type) {
        case 'task':
          // Format task data and save
          await addTask({
            userId: user.uid,
            title: result.data.title || note,
            description: result.data.description || '',
            dueDate: result.data.dueDate ? new Date(result.data.dueDate) : null,
            priority: result.data.priority || 'medium',
            status: 'pending',
          });
          break;
          
        case 'expense':
          // Format expense data and save
          await addExpense({
            userId: user.uid,
            amount: parseFloat(result.data.amount) || 0,
            category: result.data.category || 'Uncategorized',
            description: result.data.description || note,
            date: result.data.date ? new Date(result.data.date) : new Date(),
          });
          break;
          
        case 'calorie':
          // Format food entry data and save
          await addFoodEntry({
            userId: user.uid,
            foodName: result.data.foodName || note,
            calories: parseInt(result.data.calories) || 0,
            macros: {
              protein: parseFloat(result.data.protein) || 0,
              carbs: parseFloat(result.data.carbs) || 0,
              fat: parseFloat(result.data.fat) || 0,
              fiber: parseFloat(result.data.fiber) || 0,
              sugar: parseFloat(result.data.sugar) || 0,
            },
            date: result.data.date ? new Date(result.data.date) : new Date(),
          });
          break;
          
        default:
          console.log('Unknown data type', result.type);
      }
    } catch (err) {
      console.error('Error saving data:', err);
      setError('Failed to save data. Please try again.');
    }
  };

  return (
    <div className="bg-slate-800 p-6 rounded-xl shadow-xl border border-slate-700/50 backdrop-blur-sm">
      <div className="flex items-center mb-4">
        <SparklesIcon className="h-6 w-6 text-indigo-400 mr-3" />
        <h2 className="text-2xl font-bold text-white font-heading">Smart Note</h2>
        {!isPremium && (
          <div className="ml-auto">
            <div className="flex items-center text-indigo-400 bg-slate-700/50 py-1 px-3 rounded-full text-sm">
              <LockClosedIcon className="h-4 w-4 mr-1" />
              <span>Premium Feature</span>
            </div>
          </div>
        )}
      </div>
      
      <p className="text-gray-300 mb-6 font-light">
        {isPremium 
          ? "Type anything and Recallio's AI will automatically determine if it's a task, expense, or food entry."
          : "Upgrade to Premium to unlock AI-powered note analysis that automatically identifies tasks, expenses, and food entries."}
      </p>
      
      <div className="mb-4 relative">
        <textarea
          className="w-full p-4 bg-slate-900/70 border border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white placeholder:text-gray-500 transition-all"
          rows={4}
          placeholder={isPremium 
            ? "Example: 'Buy groceries tomorrow', 'Spent $24.99 on lunch today', or 'Had a chicken sandwich with 450 calories'"
            : "Upgrade to Premium to use this feature"}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          disabled={!isPremium}
        />
        
        {isPremium ? (
          <button
            className="absolute bottom-3 right-3 btn-primary p-2 rounded-full hover:scale-105 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:hover:scale-100"
            onClick={handleAnalyze}
            disabled={isAnalyzing || !note.trim()}
            aria-label="Analyze and save"
          >
            {isAnalyzing ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-200 border-t-transparent" />
            ) : (
              <PaperAirplaneIcon className="h-5 w-5 text-white" />
            )}
          </button>
        ) : (
          <div className="flex justify-center mt-6">
            <Button
              variant="primary"
              onClick={() => router.push('/premium?from=premium-required')}
              icon={<SparklesIcon className="h-5 w-5" />}
            >
              Upgrade to Premium
            </Button>
          </div>
        )}
      </div>
      
      {error && (
        <div className="mt-4 p-3 bg-red-900/30 border border-red-700/50 text-red-300 rounded-lg animate-fadeIn">
          {error}
        </div>
      )}
      
      {analysisResult && (
        <div className="mt-6 p-4 bg-slate-700/50 border border-slate-600/50 rounded-lg animate-fadeIn">
          <h3 className="font-medium text-white mb-3 font-heading">Analysis Result</h3>
          <div className="space-y-3">
            <div className="flex items-center">
              <span className="font-medium text-gray-300 w-24">Type:</span>
              <span className="capitalize px-3 py-1 bg-indigo-900/50 text-indigo-300 rounded-full text-sm">
                {analysisResult.type}
              </span>
            </div>
            
            <div className="flex items-center">
              <span className="font-medium text-gray-300 w-24">Confidence:</span>
              <div className="w-full max-w-xs bg-slate-800 rounded-full h-2.5">
                <div 
                  className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2.5 rounded-full" 
                  style={{ width: `${Math.round(analysisResult.confidence * 100)}%` }}
                ></div>
              </div>
              <span className="ml-2 text-white">
                {Math.round(analysisResult.confidence * 100)}%
              </span>
            </div>
            
            <div>
              <p className="font-medium text-gray-300 mb-2">Extracted Data:</p>
              <pre className="bg-slate-900/70 p-3 rounded-lg text-sm overflow-x-auto text-gray-300 border border-slate-700/50">
                {JSON.stringify(analysisResult.data, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 