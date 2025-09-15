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

interface ManagementDashboardProps {
  user: User;
  token: string;
  onLogout: () => void;
}

export default function ManagementDashboard({ user, token, onLogout }: ManagementDashboardProps) {
  const [problems, setProblems] = useState<ProblemRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTimeframe, setSelectedTimeframe] = useState('all');

  useEffect(() => {
    fetchProblems();
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

  // Calculate statistics
  const totalProblems = problems.length;
  const openProblems = problems.filter(p => p.status === 'open').length;
  const inProgressProblems = problems.filter(p => p.status === 'in_progress' || p.status === 'assigned').length;
  const resolvedProblems = problems.filter(p => p.status === 'resolved' || p.status === 'closed').length;
  const criticalProblems = problems.filter(p => p.priority === 'critical' && p.status !== 'resolved' && p.status !== 'closed').length;

  // Calculate resolution rate
  const resolutionRate = totalProblems > 0 ? ((resolvedProblems / totalProblems) * 100).toFixed(1) : '0';

  // Get recent problems (last 7 days)
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const recentProblems = problems.filter(p => new Date(p.created_at) >= oneWeekAgo).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Management Dashboard
              </h1>
              <p className="text-gray-600">Welcome, {user.full_name}</p>
            </div>
            <button
              onClick={onLogout}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
            >
              Logout
            </button>
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

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900">Total Problems</h3>
                <p className="text-3xl font-bold text-blue-600">{totalProblems}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900">Open Issues</h3>
                <p className="text-3xl font-bold text-orange-600">{openProblems}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900">In Progress</h3>
                <p className="text-3xl font-bold text-purple-600">{inProgressProblems}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900">Resolution Rate</h3>
                <p className="text-3xl font-bold text-green-600">{resolutionRate}%</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Alert for Critical Issues */}
        {criticalProblems > 0 && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Attention Required
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>
                    There {criticalProblems === 1 ? 'is' : 'are'} {criticalProblems} critical issue{criticalProblems !== 1 ? 's' : ''} requiring immediate attention.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Additional Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Quick Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Problems This Week:</span>
                <span className="font-semibold">{recentProblems}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Critical Issues:</span>
                <span className="font-semibold text-red-600">{criticalProblems}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Resolved Issues:</span>
                <span className="font-semibold text-green-600">{resolvedProblems}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">System Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Overall Health:</span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  criticalProblems === 0 ? 'text-green-600 bg-green-100' : 
                  criticalProblems <= 2 ? 'text-yellow-600 bg-yellow-100' : 
                  'text-red-600 bg-red-100'
                }`}>
                  {criticalProblems === 0 ? 'GOOD' : criticalProblems <= 2 ? 'CAUTION' : 'CRITICAL'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Response Time:</span>
                <span className="text-green-600 font-semibold">Normal</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Active Technicians:</span>
                <span className="font-semibold">Available</span>
              </div>
            </div>
          </div>
        </div>

        {/* Problems Overview */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold">All Problem Requests</h2>
          </div>
          
          {isLoading ? (
            <div className="p-6 text-center">Loading...</div>
          ) : problems.length === 0 ? (
            <div className="p-6 text-center text-gray-500">No problem requests found.</div>
          ) : (
            <div className="divide-y divide-gray-200">
              {problems.slice(0, 10).map((problem) => (
                <div key={problem.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900">{problem.title}</h3>
                      <p className="text-gray-600 mt-1">{problem.description}</p>
                      <div className="flex items-center mt-2 space-x-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(problem.priority)}`}>
                          {problem.priority.toUpperCase()}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(problem.status)}`}>
                          {problem.status.replace('_', ' ').toUpperCase()}
                        </span>
                        <span className="text-sm text-gray-500">
                          By: {problem.operator_name}
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
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}