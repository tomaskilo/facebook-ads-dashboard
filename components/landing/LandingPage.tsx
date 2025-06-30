'use client'

import { useState } from 'react'
import { ChartBarIcon, UsersIcon, SwatchIcon } from '@heroicons/react/24/outline'
import AuthModal from '@/components/auth/AuthModal'

export default function LandingPage() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')

  const openSignUp = () => {
    setAuthMode('signup')
    setIsAuthModalOpen(true)
  }

  const openSignIn = () => {
    setAuthMode('signin')
    setIsAuthModalOpen(true)
  }

  return (
    <>
      <div className="min-h-screen bg-dark-900">
        {/* Header */}
        <header className="relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center mr-2">
                  <span className="text-white font-bold text-sm">A</span>
                </div>
                <span className="text-xl font-bold text-white">AdForge Pro</span>
              </div>
              <button
                onClick={openSignIn}
                className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Get Started
              </button>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <main className="relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
            <div className="text-center">
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
                Master Your Facebook Ads with{' '}
                <span className="text-primary-500">AI-Powered Analytics</span>
              </h1>
              <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
                Track competitors, optimize creatives, and boost your ROAS with our comprehensive
                Facebook ads intelligence platform built for performance marketers.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={openSignUp}
                  className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 rounded-lg font-medium text-lg transition-colors flex items-center justify-center"
                >
                  Start Free Trial
                  <span className="ml-2">→</span>
                </button>
                <button
                  onClick={openSignIn}
                  className="bg-transparent border border-gray-600 hover:border-gray-500 text-white px-8 py-4 rounded-lg font-medium text-lg transition-colors"
                >
                  Sign In
                </button>
              </div>
            </div>
          </div>

          {/* Features Section */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Everything You Need to Dominate Facebook Ads
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Advanced Analytics */}
              <div className="bg-dark-800 rounded-lg p-8 text-center">
                <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-6">
                  <ChartBarIcon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-4">Advanced Analytics</h3>
                <p className="text-gray-300">
                  Deep-dive into your ad performance with comprehensive metrics, trend analysis, and actionable insights.
                </p>
              </div>

              {/* Competitor Intelligence */}
              <div className="bg-dark-800 rounded-lg p-8 text-center">
                <div className="w-16 h-16 bg-purple-600 rounded-lg flex items-center justify-center mx-auto mb-6">
                  <UsersIcon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-4">Competitor Intelligence</h3>
                <p className="text-gray-300">
                  Monitor competitor strategies, discover winning creatives, and stay ahead of market trends.
                </p>
              </div>

              {/* Creative Studio */}
              <div className="bg-dark-800 rounded-lg p-8 text-center">
                <div className="w-16 h-16 bg-green-600 rounded-lg flex items-center justify-center mx-auto mb-6">
                  <SwatchIcon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-4">Creative Studio</h3>
                <p className="text-gray-300">
                  Generate high-converting ad creatives with AI assistance and proven templates.
                </p>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="bg-dark-800 py-16">
            <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Ready to Transform Your Ad Performance?
              </h2>
              <p className="text-xl text-gray-300 mb-8">
                Join thousands of marketers who trust AdForge Pro to scale their Facebook ad campaigns.
              </p>
              <button
                onClick={openSignUp}
                className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 rounded-lg font-medium text-lg transition-colors inline-flex items-center"
              >
                Get Started Now
                <span className="ml-2">→</span>
              </button>
            </div>
          </div>
        </main>
      </div>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        mode={authMode}
      />
    </>
  )
} 