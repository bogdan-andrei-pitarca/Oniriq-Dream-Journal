'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
}

const API_URL = 'http://localhost:5000/api';

export default function MonitoredUsersPage() {
  const [monitoredUsers, setMonitoredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (user.role !== 'admin') {
      router.push('/');
      return;
    }

    const fetchMonitoredUsers = async () => {
      try {
        const response = await fetch(`${API_URL}/users/monitored`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch monitored users');
        }

        const data = await response.json();
        setMonitoredUsers(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchMonitoredUsers();
  }, [user, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">Loading monitored users...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center text-red-500">Error: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Monitored Users</h1>
        {monitoredUsers.length === 0 ? (
          <p className="text-gray-500">No users are currently being monitored.</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {monitoredUsers.map((user) => (
              <div
                key={user.id}
                className="bg-white overflow-hidden shadow rounded-lg"
              >
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900">
                    {user.username}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">{user.email}</p>
                  <p className="mt-1 text-sm text-gray-500">Role: {user.role}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 