'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { FoodEntry, getUserFoodEntries, getDailyCalorieSummary, updateFoodEntry, deleteFoodEntry, addFoodEntry } from '../services/calorieService';
import { format, addDays, subDays, startOfDay } from 'date-fns';
import { TrashIcon, PencilIcon, ChevronLeftIcon, ChevronRightIcon, PlusIcon, ArrowPathIcon, ExclamationCircleIcon } from '@heroicons/react/20/solid';
import { Bar } from 'react-chartjs-2';
import { generateNutritionInfo } from '../services/gemini';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend 
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function CalorieCounter() {
  const { user } = useAuth();
  const [foodEntries, setFoodEntries] = useState<FoodEntry[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [dailySummary, setDailySummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingEntry, setEditingEntry] = useState<FoodEntry | null>(null);
  
  // New food entry form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newFoodEntry, setNewFoodEntry] = useState({
    foodName: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
    servingSize: '',
    mealType: 'lunch' as 'breakfast' | 'lunch' | 'dinner' | 'snack'
  });
  const [isGeneratingNutrition, setIsGeneratingNutrition] = useState(false);
  const [isSavingEntry, setIsSavingEntry] = useState(false);
  const [aiFailedCount, setAiFailedCount] = useState(0);
  
  const loadFoodEntries = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      console.log('Loading food entries for user:', user.uid, 'date:', selectedDate);
      
      const userEntries = await getUserFoodEntries(user.uid);
      console.log('Retrieved food entries:', userEntries.length);
      setFoodEntries(userEntries);
      
      const summary = await getDailyCalorieSummary(user.uid, selectedDate);
      console.log('Generated daily summary:', summary);
      setDailySummary(summary);
    } catch (err) {
      console.error('Error loading food entries:', err);
      setError('Failed to load food entries. Please refresh the page to try again.');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    if (user) {
      loadFoodEntries();
    } else {
      setFoodEntries([]);
      setDailySummary(null);
      setLoading(false);
    }
  }, [user, selectedDate]);
  
  const handleDeleteEntry = async (entryId: string) => {
    try {
      await deleteFoodEntry(entryId);
      await loadFoodEntries(); // Reload entries and summary
    } catch (err) {
      console.error('Error deleting food entry:', err);
    }
  };
  
  const handleSaveEdit = async () => {
    if (!editingEntry || !editingEntry.id) return;
    
    try {
      await updateFoodEntry(editingEntry.id, {
        foodName: editingEntry.foodName,
        calories: editingEntry.calories,
        macros: editingEntry.macros,
        servingSize: editingEntry.servingSize,
        mealType: editingEntry.mealType,
        date: editingEntry.date,
      });
      
      await loadFoodEntries(); // Reload entries and summary
      setEditingEntry(null);
    } catch (err) {
      console.error('Error updating food entry:', err);
    }
  };
  
  const handleDateChange = (days: number) => {
    setSelectedDate(currentDate => {
      const newDate = days > 0 ? addDays(currentDate, days) : subDays(currentDate, Math.abs(days));
      return startOfDay(newDate);
    });
  };

  // Function to check if we should try AI generation
  const shouldTryAiGeneration = useCallback(() => {
    // If AI has failed 3 times in a row, don't try it again
    return aiFailedCount < 3;
  }, [aiFailedCount]);

  // Generate nutrition info using Gemini AI
  const generateAndFillNutrition = async () => {
    if (!newFoodEntry.foodName) {
      setError('Please enter a food name to generate nutrition information');
      return;
    }
    
    if (!shouldTryAiGeneration()) {
      setError('Automatic generation is currently unavailable. Please enter values manually.');
      return;
    }
    
    try {
      setIsGeneratingNutrition(true);
      setError(null);
      
      const nutritionInfo = await generateNutritionInfo(
        newFoodEntry.foodName,
        newFoodEntry.servingSize || undefined
      );
      
      setNewFoodEntry({
        ...newFoodEntry,
        calories: nutritionInfo.calories.toString(),
        protein: nutritionInfo.macros.protein.toString(),
        carbs: nutritionInfo.macros.carbs.toString(),
        fat: nutritionInfo.macros.fat.toString(),
        servingSize: nutritionInfo.servingSize || newFoodEntry.servingSize
      });
      
      // Reset AI fail counter on success
      setAiFailedCount(0);
    } catch (err) {
      console.error('Error generating nutrition info:', err);
      setError('Failed to generate nutrition information. Please enter manually.');
      
      // Increment AI fail counter
      setAiFailedCount(prev => prev + 1);
    } finally {
      setIsGeneratingNutrition(false);
    }
  };
  
  // Handle adding a new food entry
  const handleAddFoodEntry = async () => {
    if (!user) return;
    if (!newFoodEntry.foodName) {
      setError('Please enter a food name');
      return;
    }
    
    try {
      setIsSavingEntry(true);
      setError(null);
      
      // Check if calories are specified, if not, generate them using Gemini
      let caloriesValue = newFoodEntry.calories;
      let proteinValue = newFoodEntry.protein;
      let carbsValue = newFoodEntry.carbs;
      let fatValue = newFoodEntry.fat;
      let servingSizeValue = newFoodEntry.servingSize;
      
      if (!caloriesValue && shouldTryAiGeneration()) {
        try {
          setIsGeneratingNutrition(true);
          const nutritionInfo = await generateNutritionInfo(
            newFoodEntry.foodName,
            newFoodEntry.servingSize || undefined
          );
          
          caloriesValue = nutritionInfo.calories.toString();
          proteinValue = nutritionInfo.macros.protein.toString();
          carbsValue = nutritionInfo.macros.carbs.toString();
          fatValue = nutritionInfo.macros.fat.toString();
          servingSizeValue = nutritionInfo.servingSize || newFoodEntry.servingSize;
          
          // Reset AI fail counter on success
          setAiFailedCount(0);
        } catch (err) {
          console.error('Error generating nutrition info:', err);
          setError('Auto-generation failed. Please enter calories manually.');
          setIsGeneratingNutrition(false);
          setIsSavingEntry(false);
          
          // Increment AI fail counter
          setAiFailedCount(prev => prev + 1);
          return;
        } finally {
          setIsGeneratingNutrition(false);
        }
      } else if (!caloriesValue) {
        setError('Please enter calories manually as auto-generation is currently unavailable.');
        setIsSavingEntry(false);
        return;
      }
      
      const calories = parseInt(caloriesValue) || 0;
      if (calories <= 0) {
        setError('Please enter a valid calorie amount');
        setIsSavingEntry(false);
        return;
      }
      
      // Prepare macros object from form values
      const macros = {
        protein: parseFloat(proteinValue) || 0,
        carbs: parseFloat(carbsValue) || 0,
        fat: parseFloat(fatValue) || 0
      };
      
      console.log('Attempting to add food entry:', {
        userId: user.uid,
        foodName: newFoodEntry.foodName,
        calories,
        macros,
        servingSize: servingSizeValue || undefined,
        mealType: newFoodEntry.mealType,
        date: selectedDate
      });
      
      // Create the food entry
      await addFoodEntry({
        userId: user.uid,
        foodName: newFoodEntry.foodName,
        calories,
        macros,
        servingSize: servingSizeValue || undefined,
        mealType: newFoodEntry.mealType,
        date: selectedDate
      });
      
      // Reset form and reload entries
      setNewFoodEntry({
        foodName: '',
        calories: '',
        protein: '',
        carbs: '',
        fat: '',
        servingSize: '',
        mealType: 'lunch'
      });
      setShowAddForm(false);
      
      // Reload entries
      await loadFoodEntries();
      
    } catch (err) {
      console.error('Error adding food entry:', err);
      setError(`Failed to add food entry: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsGeneratingNutrition(false);
      setIsSavingEntry(false);
    }
  };
  
  // Prepare macro data for chart
  const macroData = dailySummary?.totalMacros ? {
    labels: ['Protein', 'Carbs', 'Fat'],
    datasets: [
      {
        label: 'Grams',
        data: [
          dailySummary.totalMacros.protein || 0,
          dailySummary.totalMacros.carbs || 0,
          dailySummary.totalMacros.fat || 0,
        ],
        backgroundColor: [
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(255, 99, 132, 0.6)',
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(255, 99, 132, 1)',
        ],
        borderWidth: 1,
      },
    ],
  } : null;
  
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };
  
  // Group entries by meal type
  const entriesByMeal = dailySummary?.entries?.reduce((acc: any, entry: FoodEntry) => {
    const mealType = entry.mealType || 'Other';
    if (!acc[mealType]) {
      acc[mealType] = [];
    }
    acc[mealType].push(entry);
    return acc;
  }, {});
  
  if (!user) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4">Calorie Counter</h2>
        <p className="text-gray-600">Please log in to view and manage your food entries.</p>
      </div>
    );
  }
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Calorie Counter</h2>
      
      {/* Date Navigation */}
      <div className="flex items-center justify-between mb-6">
        <button
          className="p-1 rounded-md hover:bg-gray-100"
          onClick={() => handleDateChange(-1)}
        >
          <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
        </button>
        
        <h3 className="text-lg font-medium">
          {format(selectedDate, 'EEEE, MMMM d, yyyy')}
        </h3>
        
        <button
          className="p-1 rounded-md hover:bg-gray-100"
          onClick={() => handleDateChange(1)}
        >
          <ChevronRightIcon className="h-5 w-5 text-gray-600" />
        </button>
      </div>
      
      {loading ? (
        <p className="text-gray-600">Loading food entries...</p>
      ) : error ? (
        <div className="p-3 bg-red-100 text-red-700 rounded-md">{error}</div>
      ) : (
        <div className="space-y-8">
          {/* Add Food Entry Button */}
          <div className="flex justify-end">
            <button
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-500 transition-colors"
              onClick={() => setShowAddForm(!showAddForm)}
              disabled={loading}
            >
              {showAddForm ? 'Cancel' : 'Add Food Entry'}
              {!showAddForm && <PlusIcon className="h-5 w-5 ml-1" />}
            </button>
          </div>
          
          {/* Add Food Entry Form */}
          {showAddForm && (
            <div className="bg-gray-50 p-4 rounded-md border border-gray-200 mb-6">
              <h3 className="font-medium text-lg mb-3">Add Food Entry</h3>
              
              {aiFailedCount >= 3 && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-800 flex items-start">
                  <ExclamationCircleIcon className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Auto-generation temporarily unavailable</p>
                    <p className="text-sm">Please enter nutrition information manually. We'll try again later.</p>
                  </div>
                </div>
              )}
              
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Food Name *</label>
                    <input
                      type="text"
                      className="w-full p-2 border border-gray-300 rounded-md"
                      value={newFoodEntry.foodName}
                      onChange={(e) => setNewFoodEntry({ ...newFoodEntry, foodName: e.target.value })}
                      placeholder="e.g. Chicken Sandwich"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Serving Size</label>
                    <input
                      type="text"
                      className="w-full p-2 border border-gray-300 rounded-md"
                      value={newFoodEntry.servingSize}
                      onChange={(e) => setNewFoodEntry({ ...newFoodEntry, servingSize: e.target.value })}
                      placeholder="e.g. 1 sandwich, 100g"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Calories 
                      <span className="text-gray-500 ml-1 font-normal">(or auto-generate)</span>
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="number"
                        className="w-full p-2 border border-gray-300 rounded-md"
                        value={newFoodEntry.calories}
                        onChange={(e) => setNewFoodEntry({ ...newFoodEntry, calories: e.target.value })}
                        placeholder="e.g. 450"
                      />
                      
                      <button
                        className="flex items-center px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                        onClick={generateAndFillNutrition}
                        disabled={isGeneratingNutrition || !newFoodEntry.foodName}
                        title="Auto-generate nutrition info using AI"
                      >
                        {isGeneratingNutrition ? (
                          <ArrowPathIcon className="h-5 w-5 animate-spin" />
                        ) : (
                          <ArrowPathIcon className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Meal Type</label>
                    <select
                      className="w-full p-2 border border-gray-300 rounded-md"
                      value={newFoodEntry.mealType}
                      onChange={(e) => setNewFoodEntry({ 
                        ...newFoodEntry, 
                        mealType: e.target.value as 'breakfast' | 'lunch' | 'dinner' | 'snack' 
                      })}
                    >
                      <option value="breakfast">Breakfast</option>
                      <option value="lunch">Lunch</option>
                      <option value="dinner">Dinner</option>
                      <option value="snack">Snack</option>
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Protein (g)</label>
                    <input
                      type="number"
                      step="0.1"
                      className="w-full p-2 border border-gray-300 rounded-md"
                      value={newFoodEntry.protein}
                      onChange={(e) => setNewFoodEntry({ ...newFoodEntry, protein: e.target.value })}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Carbs (g)</label>
                    <input
                      type="number"
                      step="0.1"
                      className="w-full p-2 border border-gray-300 rounded-md"
                      value={newFoodEntry.carbs}
                      onChange={(e) => setNewFoodEntry({ ...newFoodEntry, carbs: e.target.value })}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fat (g)</label>
                    <input
                      type="number"
                      step="0.1"
                      className="w-full p-2 border border-gray-300 rounded-md"
                      value={newFoodEntry.fat}
                      onChange={(e) => setNewFoodEntry({ ...newFoodEntry, fat: e.target.value })}
                    />
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <button
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-500 transition-colors disabled:bg-gray-400 flex items-center"
                    onClick={handleAddFoodEntry}
                    disabled={!newFoodEntry.foodName || isGeneratingNutrition || isSavingEntry}
                  >
                    {isGeneratingNutrition ? (
                      <>
                        <ArrowPathIcon className="h-5 w-5 animate-spin inline mr-2" />
                        Generating...
                      </>
                    ) : isSavingEntry ? (
                      <>
                        <ArrowPathIcon className="h-5 w-5 animate-spin inline mr-2" />
                        Saving...
                      </>
                    ) : 'Add Entry'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Summary Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-lg mb-3">Daily Summary</h3>
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="text-2xl font-bold text-gray-900">
                  {dailySummary?.totalCalories || 0} cal
                </div>
                <div className="text-sm text-gray-500 mt-1">Total Calories</div>
                
                {dailySummary?.totalMacros && (
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between">
                      <span>Protein:</span>
                      <span className="font-medium">{dailySummary.totalMacros.protein || 0}g</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Carbs:</span>
                      <span className="font-medium">{dailySummary.totalMacros.carbs || 0}g</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Fat:</span>
                      <span className="font-medium">{dailySummary.totalMacros.fat || 0}g</span>
                    </div>
                    {dailySummary.totalMacros.fiber > 0 && (
                      <div className="flex justify-between">
                        <span>Fiber:</span>
                        <span className="font-medium">{dailySummary.totalMacros.fiber}g</span>
                      </div>
                    )}
                    {dailySummary.totalMacros.sugar > 0 && (
                      <div className="flex justify-between">
                        <span>Sugar:</span>
                        <span className="font-medium">{dailySummary.totalMacros.sugar}g</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <h3 className="font-medium text-lg mb-3">Macronutrient Distribution</h3>
              {macroData ? (
                <div className="h-64">
                  <Bar data={macroData} options={chartOptions} />
                </div>
              ) : (
                <div className="bg-gray-50 p-4 rounded-md flex items-center justify-center h-64">
                  <p className="text-gray-500">No nutrition data to display</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Food Entries List */}
          <div>
            <h3 className="font-medium text-lg mb-3">Food Entries</h3>
            
            {!dailySummary?.entries || dailySummary.entries.length === 0 ? (
              <p className="text-gray-600">No food entries found for this date. Add a food entry to get started.</p>
            ) : (
              <div className="space-y-6">
                {entriesByMeal && Object.entries(entriesByMeal).map(([mealType, entries]: [string, any]) => (
                  <div key={mealType}>
                    <h4 className="font-medium text-md mb-2 capitalize">{mealType}</h4>
                    <div className="space-y-3">
                      {entries.map((entry: FoodEntry) => (
                        <div 
                          key={entry.id} 
                          className="border border-gray-200 rounded-md p-4 hover:bg-gray-50"
                        >
                          {editingEntry && editingEntry.id === entry.id ? (
                            <div className="space-y-3">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Food Name</label>
                                  <input
                                    type="text"
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                    value={editingEntry.foodName}
                                    onChange={(e) => setEditingEntry({ 
                                      ...editingEntry, 
                                      foodName: e.target.value 
                                    })}
                                  />
                                </div>
                                
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Calories</label>
                                  <input
                                    type="number"
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                    value={editingEntry.calories}
                                    onChange={(e) => setEditingEntry({ 
                                      ...editingEntry, 
                                      calories: parseInt(e.target.value) 
                                    })}
                                  />
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-3 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Protein (g)</label>
                                  <input
                                    type="number"
                                    step="0.1"
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                    value={editingEntry.macros?.protein || ''}
                                    onChange={(e) => setEditingEntry({ 
                                      ...editingEntry, 
                                      macros: {
                                        ...editingEntry.macros,
                                        protein: parseFloat(e.target.value)
                                      }
                                    })}
                                  />
                                </div>
                                
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Carbs (g)</label>
                                  <input
                                    type="number"
                                    step="0.1"
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                    value={editingEntry.macros?.carbs || ''}
                                    onChange={(e) => setEditingEntry({ 
                                      ...editingEntry, 
                                      macros: {
                                        ...editingEntry.macros,
                                        carbs: parseFloat(e.target.value)
                                      }
                                    })}
                                  />
                                </div>
                                
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Fat (g)</label>
                                  <input
                                    type="number"
                                    step="0.1"
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                    value={editingEntry.macros?.fat || ''}
                                    onChange={(e) => setEditingEntry({ 
                                      ...editingEntry, 
                                      macros: {
                                        ...editingEntry.macros,
                                        fat: parseFloat(e.target.value)
                                      }
                                    })}
                                  />
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Serving Size</label>
                                  <input
                                    type="text"
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                    value={editingEntry.servingSize || ''}
                                    onChange={(e) => setEditingEntry({ 
                                      ...editingEntry, 
                                      servingSize: e.target.value 
                                    })}
                                  />
                                </div>
                                
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Meal Type</label>
                                  <select
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                    value={editingEntry.mealType || ''}
                                    onChange={(e) => setEditingEntry({ 
                                      ...editingEntry, 
                                      mealType: e.target.value as 'breakfast' | 'lunch' | 'dinner' | 'snack' 
                                    })}
                                  >
                                    <option value="">Select meal type</option>
                                    <option value="breakfast">Breakfast</option>
                                    <option value="lunch">Lunch</option>
                                    <option value="dinner">Dinner</option>
                                    <option value="snack">Snack</option>
                                  </select>
                                </div>
                              </div>
                              
                              <div className="flex justify-end space-x-2">
                                <button
                                  className="bg-gray-200 text-gray-800 px-3 py-1 rounded-md hover:bg-gray-300"
                                  onClick={() => setEditingEntry(null)}
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
                                <h5 className="font-medium">{entry.foodName}</h5>
                                
                                <div className="flex items-center mt-1">
                                  <span className="font-medium text-gray-700">{entry.calories} cal</span>
                                  {entry.servingSize && (
                                    <span className="text-sm text-gray-500 ml-2">
                                      ({entry.servingSize})
                                    </span>
                                  )}
                                </div>
                                
                                {entry.macros && (
                                  <div className="text-sm text-gray-600 mt-1">
                                    {entry.macros.protein ? `${entry.macros.protein}g P` : ''}
                                    {entry.macros.carbs ? ` · ${entry.macros.carbs}g C` : ''}
                                    {entry.macros.fat ? ` · ${entry.macros.fat}g F` : ''}
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex space-x-2">
                                <button
                                  className="p-1 text-gray-500 hover:text-indigo-600"
                                  onClick={() => setEditingEntry(entry)}
                                  title="Edit food entry"
                                >
                                  <PencilIcon className="h-5 w-5" />
                                </button>
                                <button
                                  className="p-1 text-gray-500 hover:text-red-600"
                                  onClick={() => handleDeleteEntry(entry.id!)}
                                  title="Delete food entry"
                                >
                                  <TrashIcon className="h-5 w-5" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
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