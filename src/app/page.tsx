'use client';

import { useState, useEffect } from 'react';
import LoginForm from '@/components/LoginForm';
import RegisterForm from '@/components/RegisterForm';
import OperatorDashboard from '@/components/OperatorDashboard';
import TechnicianDashboard from '@/components/TechnicianDashboard';
import ManagementDashboard from '@/components/ManagementDashboard';

interface User {
  id: number;
  username: string;
  email: string;
  role: 'operator' | 'technician' | 'management';
  employee_id: string;
  full_name: string;
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing token in localStorage
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const handleLogin = (userData: User, authToken: string) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('token', authToken);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              Daawat Foods Limited
            </h1>
            <p className="text-xl text-gray-600">
              Plant Activity Management System
            </p>
          </div>

          {/* Authentication Forms */}
          <div className="max-w-md mx-auto">
            {isRegistering ? (
              <RegisterForm onSuccess={() => setIsRegistering(false)} />
            ) : (
              <LoginForm onLogin={handleLogin} />
            )}
            
            <div className="mt-4 text-center">
              <button
                onClick={() => setIsRegistering(!isRegistering)}
                className="text-blue-600 hover:text-blue-800 underline"
              >
                {isRegistering 
                  ? 'Already have an account? Login' 
                  : 'Need an account? Register'
                }
              </button>
            </div>

            {/* Demo Credentials */}
            <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded">
              <h3 className="font-semibold text-sm mb-2">Demo Credentials:</h3>
              <div className="text-sm space-y-1">
                <div><strong>Admin:</strong> admin / admin123</div>
                <div><strong>Technician:</strong> technician1 / tech123</div>
                <div><strong>Operator:</strong> operator1 / op123</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render role-specific dashboard
  const renderDashboard = () => {
    switch (user.role) {
      case 'operator':
        return <OperatorDashboard user={user} token={token!} onLogout={handleLogout} />;
      case 'technician':
        return <TechnicianDashboard user={user} token={token!} onLogout={handleLogout} />;
      case 'management':
        return <ManagementDashboard user={user} token={token!} onLogout={handleLogout} />;
      default:
        return <div>Unknown role</div>;
    }
  };

  return renderDashboard();
}
