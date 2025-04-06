'use client';

import { useRouter } from 'next/navigation';

interface DashboardHeaderProps {
  title: string;
  userName?: string;
}

export default function DashboardHeader({ title, userName }: DashboardHeaderProps) {
  const router = useRouter();

  const handleSignOut = () => {
    // Show confirmation dialog
    if (confirm('Are you sure you want to sign out?')) {
      // Clear all session data
      sessionStorage.clear();
      
      // Add a flag to prevent browser back button navigation
      sessionStorage.setItem('userLoggedOut', 'true');
      
      // Clear browser history and redirect to login
      window.history.pushState(null, '', '/login');
      router.replace('/login');
      
      // Force reload to clear any cached state
      window.location.reload();
    }
  };

  return (
    <div className="flex justify-between items-center mb-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
        {userName && (
          <p className="text-sm text-gray-600 mt-1">Logged in as: {userName}</p>
        )}
      </div>
      <button
        onClick={handleSignOut}
        className="bg-red-600 hover:bg-red-700 text-white font-medium px-4 py-2 rounded-md shadow transition-colors duration-300 flex items-center"
      >
        <span>Sign Out</span>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
      </button>
    </div>
  );
} 