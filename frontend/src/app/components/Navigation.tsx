'use client';

import { useAuth } from '../context/AuthContext';
import Link from 'next/link';

export default function Navigation() {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-indigo-800 shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-xl font-bold text-white">
                Oniriq
              </Link>
            </div>
          </div>
          <div className="flex items-center space-x-6">
            {user ? (
              <>
                <span className="text-white">
                  Welcome, {user.username}
                </span>
                {user.role === 'admin' && (
                  <Link
                    href="/monitored-users"
                    className="text-white hover:text-indigo-200"
                  >
                    Monitored Users
                  </Link>
                )}
                <button
                  onClick={logout}
                  className="text-white hover:text-indigo-200"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="text-white hover:text-indigo-200"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
} 