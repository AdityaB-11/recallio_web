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

export interface Expense {
  id?: string;
  userId: string;
  amount: number;
  category: string;
  description?: string;
  date: Date;
  createdAt: Date;
}

// Add a new expense
export async function addExpense(expense: Omit<Expense, 'id' | 'createdAt'>) {
  try {
    const expenseWithDates = {
      ...expense,
      createdAt: Timestamp.now(),
      date: Timestamp.fromDate(expense.date),
    };
    
    const docRef = await addDoc(collection(db, 'expenses'), expenseWithDates);
    return { id: docRef.id, ...expense };
  } catch (error) {
    console.error('Error adding expense:', error);
    throw error;
  }
}

// Get all expenses for a specific user
export async function getUserExpenses(userId: string) {
  try {
    const expensesQuery = query(
      collection(db, 'expenses'),
      where('userId', '==', userId),
      orderBy('date', 'desc')
    );
    
    const querySnapshot = await getDocs(expensesQuery);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      
      // Convert Firestore timestamps back to JS Dates
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
        date: data.date?.toDate(),
      } as Expense;
    });
  } catch (error) {
    console.error('Error getting expenses:', error);
    throw error;
  }
}

// Get expense summary by category
export async function getExpenseSummaryByCategory(userId: string) {
  try {
    const expenses = await getUserExpenses(userId);
    
    // Group expenses by category and sum amounts
    const summary = expenses.reduce((acc, expense) => {
      const category = expense.category;
      if (!acc[category]) {
        acc[category] = 0;
      }
      acc[category] += expense.amount;
      return acc;
    }, {} as Record<string, number>);
    
    return summary;
  } catch (error) {
    console.error('Error getting expense summary:', error);
    throw error;
  }
}

// Update an existing expense
export async function updateExpense(expenseId: string, updates: Partial<Expense>) {
  try {
    const expenseRef = doc(db, 'expenses', expenseId);
    
    // Convert dates to Firestore timestamps
    const updatesWithTimestamps = { ...updates };
    if (updates.date) {
      updatesWithTimestamps.date = Timestamp.fromDate(updates.date);
    }
    
    await updateDoc(expenseRef, updatesWithTimestamps);
    return { id: expenseId, ...updates };
  } catch (error) {
    console.error('Error updating expense:', error);
    throw error;
  }
}

// Delete an expense
export async function deleteExpense(expenseId: string) {
  try {
    const expenseRef = doc(db, 'expenses', expenseId);
    await deleteDoc(expenseRef);
    return true;
  } catch (error) {
    console.error('Error deleting expense:', error);
    throw error;
  }
} 