'use client';

import { useState, useEffect } from 'react';

interface User {
  id: number;
  username: string;
  full_name: string;
  role: string;
}

interface ProblemRequest {
  id: number;
  title: string;
  description: string;
  priority: string;
  status: string;
  created_at: string;
  operator_name: string;
  technician_name?: string;
}

interface Notification {
  id: number;
  message: string;
  is_read: boolean;
  created_at: string;
  problem_title: string;
}

interface TechnicianDashboardProps {
  user: User;
  token: string;
  onLogout: () => void;
}

export default function TechnicianDashboard({ user, token, onLogout }: TechnicianDashboardProps) {
  const [problems, setProblems] = useState<ProblemRequest[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchProblems();
    fetchNotifications();
  }, []);

  const fetchProblems = async () => {
    try {
      const response = await fetch('/api/problems', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProblems(data.problems);
      } else {
        setError('Failed to fetch problems');
      }
    } catch (error) {
      setError('Network error');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications);
      }
    } catch (error) {
      console.error('Failed to fetch notifications');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'text-blue-600 bg-blue-100';
      case 'assigned': return 'text-purple-600 bg-purple-100';
      case 'in_progress': return 'text-orange-600 bg-orange-100';
      case 'resolved': return 'text-green-600 bg-green-100';
      case 'closed': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const unreadNotifications = notifications.filter(n => !n.is_read).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Technician Dashboard
              </h1>
              <p className="text-gray-600">Welcome, {user.full_name}</p>
            </div>
            <div className="flex items-center space-x-4">
              {unreadNotifications > 0 && (
                <div className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm">
                  {unreadNotifications} new notification{unreadNotifications !== 1 ? 's' : ''}
                </div>
              )}
              <button
                onClick={onLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success/Error Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - Problem Requests */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold">Problem Requests</h2>
              </div>
              
              {isLoading ? (
                <div className="p-6 text-center">Loading...</div>
              ) : problems.length === 0 ? (
                <div className="p-6 text-center text-gray-500">No problem requests available.</div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {problems.map((problem) => (
                    <div key={problem.id} className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-gray-900">{problem.title}</h3>
                          <p className="text-gray-600 mt-1">{problem.description}</p>
                          <p className="text-sm text-gray-500 mt-1">
                            Reported by: {problem.operator_name}
                          </p>
                          <div className="flex items-center mt-2 space-x-4">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(problem.priority)}`}>
                              {problem.priority.toUpperCase()}
                            </span>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(problem.status)}`}>
                              {problem.status.replace('_', ' ').toUpperCase()}
                            </span>
                            {problem.technician_name && (
                              <span className="text-sm text-gray-500">
                                Assigned to: {problem.technician_name}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(problem.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      {problem.status === 'open' && (
                        <div className="mt-4 flex space-x-2">
                          <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">
                            Assign to Me
                          </button>
                        </div>
                      )}
                      
                      {problem.technician_name === user.full_name && problem.status !== 'resolved' && problem.status !== 'closed' && (
                        <div className="mt-4 flex space-x-2">
                          {problem.status === 'assigned' && (
                            <button className="bg-orange-600 text-white px-3 py-1 rounded text-sm hover:bg-orange-700">
                              Start Work
                            </button>
                          )}
                          {problem.status === 'in_progress' && (
                            <button className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700">
                              Mark Resolved
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - Notifications */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold">Recent Notifications</h2>
              </div>
              
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-gray-500">No notifications.</div>
              ) : (
                <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                  {notifications.slice(0, 10).map((notification) => (
                    <div key={notification.id} className={`p-4 ${!notification.is_read ? 'bg-blue-50' : ''}`}>
                      <p className="text-sm font-medium text-gray-900">{notification.message}</p>
                      {notification.problem_title && (
                        <p className="text-xs text-gray-500 mt-1">Problem: {notification.problem_title}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(notification.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-lg shadow mt-6">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold">Quick Stats</h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Open Problems:</span>
                  <span className="font-semibold">{problems.filter(p => p.status === 'open').length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">My Assigned:</span>
                  <span className="font-semibold">
                    {problems.filter(p => p.technician_name === user.full_name && p.status !== 'resolved' && p.status !== 'closed').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Critical Issues:</span>
                  <span className="font-semibold text-red-600">
                    {problems.filter(p => p.priority === 'critical' && p.status !== 'resolved' && p.status !== 'closed').length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}