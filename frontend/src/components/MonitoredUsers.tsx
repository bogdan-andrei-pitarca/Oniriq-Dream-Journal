import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
}

const MonitoredUsers: React.FC = () => {
  const [monitoredUsers, setMonitoredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchMonitoredUsers = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/users/monitored', {
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

    if (user?.role === 'admin') {
      fetchMonitoredUsers();
    }
  }, [user]);

  if (user?.role !== 'admin') {
    return null;
  }

  if (loading) {
    return <div>Loading monitored users...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Monitored Users</h2>
      {monitoredUsers.length === 0 ? (
        <p>No users are currently being monitored.</p>
      ) : (
        <div className="grid gap-4">
          {monitoredUsers.map((user) => (
            <div
              key={user.id}
              className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <h3 className="font-semibold">{user.username}</h3>
              <p className="text-gray-600">{user.email}</p>
              <p className="text-sm text-gray-500">Role: {user.role}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MonitoredUsers; 