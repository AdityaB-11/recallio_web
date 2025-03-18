import { db } from '../firebase/config';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  Timestamp 
} from 'firebase/firestore';

export interface Macros {
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  sugar?: number;
}

export interface FoodEntry {
  id?: string;
  userId: string;
  foodName: string;
  calories: number;
  macros?: Macros;
  servingSize?: string;
  mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  date: Date;
  createdAt: Date;
}

// Add a new food entry
export async function addFoodEntry(entry: Omit<FoodEntry, 'id' | 'createdAt'>) {
  try {
    const entryWithDates = {
      ...entry,
      createdAt: Timestamp.now(),
      date: Timestamp.fromDate(entry.date),
    };
    
    const docRef = await addDoc(collection(db, 'foodEntries'), entryWithDates);
    return { id: docRef.id, ...entry };
  } catch (error) {
    console.error('Error adding food entry:', error);
    throw error;
  }
}

// Get all food entries for a specific user
export async function getUserFoodEntries(userId: string) {
  try {
    const entriesQuery = query(
      collection(db, 'foodEntries'),
      where('userId', '==', userId),
      orderBy('date', 'desc')
    );
    
    const querySnapshot = await getDocs(entriesQuery);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      
      // Convert Firestore timestamps back to JS Dates
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
        date: data.date?.toDate(),
      } as FoodEntry;
    });
  } catch (error) {
    console.error('Error getting food entries:', error);
    throw error;
  }
}

// Get daily calorie summary
export async function getDailyCalorieSummary(userId: string, date: Date) {
  try {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    const entriesQuery = query(
      collection(db, 'foodEntries'),
      where('userId', '==', userId),
      where('date', '>=', Timestamp.fromDate(startOfDay)),
      where('date', '<=', Timestamp.fromDate(endOfDay))
    );
    
    const querySnapshot = await getDocs(entriesQuery);
    const entries = querySnapshot.docs.map(doc => {
      return { id: doc.id, ...doc.data() } as FoodEntry;
    });
    
    // Calculate total calories and macros
    const totalCalories = entries.reduce((sum, entry) => sum + entry.calories, 0);
    
    const totalMacros = entries.reduce((acc, entry) => {
      if (entry.macros) {
        return {
          protein: (acc.protein || 0) + (entry.macros.protein || 0),
          carbs: (acc.carbs || 0) + (entry.macros.carbs || 0),
          fat: (acc.fat || 0) + (entry.macros.fat || 0),
          fiber: (acc.fiber || 0) + (entry.macros.fiber || 0),
          sugar: (acc.sugar || 0) + (entry.macros.sugar || 0),
        };
      }
      return acc;
    }, {} as Macros);
    
    return {
      date,
      totalCalories,
      totalMacros,
      entries
    };
  } catch (error) {
    console.error('Error getting daily calorie summary:', error);
    throw error;
  }
}

// Update a food entry
export async function updateFoodEntry(entryId: string, updates: Partial<FoodEntry>) {
  try {
    const entryRef = doc(db, 'foodEntries', entryId);
    
    // Convert dates to Firestore timestamps
    const updatesWithTimestamps = { ...updates };
    if (updates.date) {
      updatesWithTimestamps.date = Timestamp.fromDate(updates.date);
    }
    
    await updateDoc(entryRef, updatesWithTimestamps);
    return { id: entryId, ...updates };
  } catch (error) {
    console.error('Error updating food entry:', error);
    throw error;
  }
}

// Delete a food entry
export async function deleteFoodEntry(entryId: string) {
  try {
    const entryRef = doc(db, 'foodEntries', entryId);
    await deleteDoc(entryRef);
    return true;
  } catch (error) {
    console.error('Error deleting food entry:', error);
    throw error;
  }
} 