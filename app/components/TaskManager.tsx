'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Task, getUserTasks, updateTask, deleteTask } from '../services/taskService';
import { format } from 'date-fns';
import { CheckIcon, TrashIcon, PencilIcon, PlusIcon } from '@heroicons/react/24/outline';
import Card, { CardContent, CardHeader } from './ui/Card';
import Button from './ui/Button';
import Badge from './ui/Badge';

export default function TaskManager() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  
  const loadTasks = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const userTasks = await getUserTasks(user.uid);
      setTasks(userTasks);
    } catch (err) {
      console.error('Error loading tasks:', err);
      setError('Failed to load tasks. Please refresh the page to try again.');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    if (user) {
      loadTasks();
    } else {
      setTasks([]);
      setLoading(false);
    }
  }, [user]);
  
  const handleStatusChange = async (taskId: string, newStatus: 'pending' | 'in-progress' | 'completed') => {
    try {
      await updateTask(taskId, { status: newStatus });
      setTasks(tasks.map(task => 
        task.id === taskId ? { ...task, status: newStatus } : task
      ));
    } catch (err) {
      console.error('Error updating task status:', err);
    }
  };
  
  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteTask(taskId);
      setTasks(tasks.filter(task => task.id !== taskId));
    } catch (err) {
      console.error('Error deleting task:', err);
    }
  };
  
  const handleSaveEdit = async () => {
    if (!editingTask || !editingTask.id) return;
    
    try {
      await updateTask(editingTask.id, {
        title: editingTask.title,
        description: editingTask.description,
        priority: editingTask.priority,
        dueDate: editingTask.dueDate,
      });
      
      setTasks(tasks.map(task => 
        task.id === editingTask.id ? editingTask : task
      ));
      
      setEditingTask(null);
    } catch (err) {
      console.error('Error updating task:', err);
    }
  };
  
  const getPriorityVariant = (priority?: string) => {
    switch (priority) {
      case 'high': return 'danger';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'default';
    }
  };
  
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in-progress': return 'info';
      case 'pending': return 'default';
      default: return 'default';
    }
  };
  
  if (!user) {
    return (
      <Card>
        <CardContent>
          <div className="text-center py-8">
            <div className="mx-auto w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mb-4">
              <CheckIcon className="h-8 w-8 text-indigo-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2 font-heading">Task Manager</h2>
            <p className="text-gray-300">Please log in to view and manage your tasks.</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-400 border-t-transparent"></div>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-900/30 border border-red-700/50 text-red-300 rounded-lg">
            {error}
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-8">
            <div className="mx-auto w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mb-4">
              <PlusIcon className="h-8 w-8 text-indigo-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2 font-heading">No Tasks Yet</h2>
            <p className="text-gray-300 mb-4">You don't have any tasks yet. Add your first task to get started.</p>
            <Button 
              variant="primary"
              onClick={() => setEditingTask({
                title: '',
                description: '',
                status: 'pending',
                priority: 'medium',
                userId: user.uid
              })}
            >
              Create a task
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-end mb-4">
              <Button 
                variant="primary"
                icon={<PlusIcon className="h-5 w-5" />}
                onClick={() => setEditingTask({
                  title: '',
                  description: '',
                  status: 'pending',
                  priority: 'medium',
                  userId: user.uid
                })}
              >
                Add Task
              </Button>
            </div>
            
            {tasks.map((task, index) => (
              <div 
                key={task.id} 
                className="bg-slate-700/30 rounded-xl p-5 hover:bg-slate-700/50 transition-all border border-slate-600/50 animate-fadeIn"
                style={{ animationDelay: `${0.1 * index}s` }}
              >
                {editingTask && editingTask.id === task.id ? (
                  <div className="space-y-4">
                    <input
                      type="text"
                      className="w-full p-3 bg-slate-900/70 border border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white"
                      value={editingTask.title}
                      onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                      placeholder="Task title"
                    />
                    
                    <textarea
                      className="w-full p-3 bg-slate-900/70 border border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white"
                      value={editingTask.description || ''}
                      onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                      placeholder="Description (optional)"
                      rows={2}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Priority</label>
                        <select
                          className="w-full p-3 bg-slate-900/70 border border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white"
                          value={editingTask.priority || 'medium'}
                          onChange={(e) => setEditingTask({ 
                            ...editingTask, 
                            priority: e.target.value as 'low' | 'medium' | 'high' 
                          })}
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Due Date</label>
                        <input
                          type="date"
                          className="w-full p-3 bg-slate-900/70 border border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white"
                          value={editingTask.dueDate ? format(editingTask.dueDate, 'yyyy-MM-dd') : ''}
                          onChange={(e) => setEditingTask({ 
                            ...editingTask, 
                            dueDate: e.target.value ? new Date(e.target.value) : null
                          })}
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-end space-x-3">
                      <Button
                        variant="secondary"
                        onClick={() => setEditingTask(null)}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        onClick={handleSaveEdit}
                      >
                        Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col md:flex-row justify-between md:items-start">
                      <div>
                        <h3 className="font-medium text-xl text-white font-heading">{task.title}</h3>
                        {task.description && (
                          <p className="text-gray-300 mt-2">{task.description}</p>
                        )}
                        
                        <div className="flex flex-wrap mt-4 gap-2">
                          {task.priority && (
                            <Badge variant={getPriorityVariant(task.priority)}>
                              {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority
                            </Badge>
                          )}
                          
                          <Badge variant={getStatusVariant(task.status)}>
                            {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                          </Badge>
                          
                          {task.dueDate && (
                            <Badge variant="info">
                              Due: {format(task.dueDate, 'MMM d, yyyy')}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex space-x-1 mt-4 md:mt-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-2 text-gray-400 hover:text-indigo-400 bg-slate-800/50 rounded-lg hover:bg-slate-700"
                          onClick={() => setEditingTask(task)}
                          aria-label="Edit task"
                          icon={<PencilIcon className="h-5 w-5" />}
                        />
                        <Button
                          variant="ghost"
                          size="sm" 
                          className={`p-2 ${task.status === 'completed' ? 'text-green-400' : 'text-gray-400 hover:text-green-400'} bg-slate-800/50 rounded-lg hover:bg-slate-700`}
                          onClick={() => handleStatusChange(task.id!, 
                            task.status === 'completed' ? 'pending' : 'completed')}
                          aria-label={task.status === 'completed' ? 'Mark as pending' : 'Mark as completed'}
                          icon={<CheckIcon className="h-5 w-5" />}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-2 text-gray-400 hover:text-red-400 bg-slate-800/50 rounded-lg hover:bg-slate-700"
                          onClick={() => handleDeleteTask(task.id!)}
                          aria-label="Delete task"
                          icon={<TrashIcon className="h-5 w-5" />}
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 