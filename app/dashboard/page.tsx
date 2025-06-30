'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <span className="text-xl font-bold text-white">AdForge Pro</span>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <img 
                  src={session.user?.image || ''} 
                  alt={session.user?.name || ''} 
                  className="w-8 h-8 rounded-full"
                />
                <span className="text-white">{session.user?.name}</span>
              </div>
              <button
                onClick={() => signOut()}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Dashboard Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Welcome to AdForge Pro!</h1>
          <p className="text-gray-400">Your Facebook ads analytics dashboard is ready</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400 mb-1">Total Spend</p>
                <p className="text-2xl font-bold text-white">$12,450</p>
              </div>
              <div className="text-sm font-medium text-green-400">
                ↗ +12.5%
              </div>
            </div>
          </div>

          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400 mb-1">ROAS</p>
                <p className="text-2xl font-bold text-white">3.2x</p>
              </div>
              <div className="text-sm font-medium text-green-400">
                ↗ +8.3%
              </div>
            </div>
          </div>

          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400 mb-1">CTR</p>
                <p className="text-2xl font-bold text-white">2.14%</p>
              </div>
              <div className="text-sm font-medium text-red-400">
                ↘ -0.2%
              </div>
            </div>
          </div>

          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400 mb-1">CPC</p>
                <p className="text-2xl font-bold text-white">$0.85</p>
              </div>
              <div className="text-sm font-medium text-green-400">
                ↗ +5.1%
              </div>
            </div>
          </div>
        </div>

        {/* Welcome Message */}
        <div className="bg-slate-800 rounded-lg p-8 border border-slate-700">
          <h2 className="text-2xl font-bold text-white mb-4">🎉 Authentication Working!</h2>
          <div className="space-y-4 text-gray-300">
            <p>
              <strong>Great news!</strong> Google authentication is now working perfectly. 
              You're successfully signed in as: <strong className="text-white">{session.user?.email}</strong>
            </p>
            
            <div className="bg-slate-900 rounded p-4">
              <h3 className="font-semibold text-white mb-2">Next Steps:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Set up your Supabase database using the SQL script in `sql/create_tables.sql`</li>
                <li>Configure your OpenAI API key for AI-powered website analysis</li>
                <li>Start uploading CSV files with your Facebook ads data</li>
                <li>Explore the product management features</li>
                <li>Use the AI competitor research tools</li>
              </ul>
            </div>

            <p className="text-sm">
              The full dashboard with CSV upload, Bioma product tracking, AI analysis, and all advanced features 
              will be available once you complete the database setup.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
} 