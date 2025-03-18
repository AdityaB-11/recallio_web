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
  Timestamp, 
  DocumentData 
} from 'firebase/firestore';

export interface Task {
  id?: string;
  userId: string;
  title: string;
  description?: string;
  dueDate?: Date | null;
  priority?: 'low' | 'medium' | 'high';
  status: 'pending' | 'in-progress' | 'completed';
  createdAt: Date;
}

// Add a new task
export async function addTask(task: Omit<Task, 'id' | 'createdAt'>) {
  try {
    const taskWithDates = {
      ...task,
      createdAt: Timestamp.now(),
      dueDate: task.dueDate ? Timestamp.fromDate(task.dueDate) : null,
    };
    
    const docRef = await addDoc(collection(db, 'tasks'), taskWithDates);
    return { id: docRef.id, ...task };
  } catch (error) {
    console.error('Error adding task:', error);
    throw error;
  }
}

// Get all tasks for a specific user
export async function getUserTasks(userId: string) {
  try {
    const tasksQuery = query(
      collection(db, 'tasks'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(tasksQuery);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      
      // Convert Firestore timestamps back to JS Dates
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
        dueDate: data.dueDate?.toDate() || null,
      } as Task;
    });
  } catch (error) {
    console.error('Error getting tasks:', error);
    throw error;
  }
}

// Update an existing task
export async function updateTask(taskId: string, updates: Partial<Task>) {
  try {
    const taskRef = doc(db, 'tasks', taskId);
    
    // Convert dates to Firestore timestamps
    const updatesWithTimestamps = { ...updates };
    if (updates.dueDate) {
      updatesWithTimestamps.dueDate = Timestamp.fromDate(updates.dueDate);
    }
    
    await updateDoc(taskRef, updatesWithTimestamps);
    return { id: taskId, ...updates };
  } catch (error) {
    console.error('Error updating task:', error);
    throw error;
  }
}

// Delete a task
export async function deleteTask(taskId: string) {
  try {
    const taskRef = doc(db, 'tasks', taskId);
    await deleteDoc(taskRef);
    return true;
  } catch (error) {
    console.error('Error deleting task:', error);
    throw error;
  }
} 