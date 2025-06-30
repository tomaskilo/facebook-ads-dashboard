'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import {
  ChartBarIcon,
  ChartPieIcon,
  SwatchIcon,
  CogIcon,
  PlusIcon
} from '@heroicons/react/24/outline'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: ChartBarIcon },
  { name: 'Analytics', href: '/dashboard/analytics', icon: ChartPieIcon },
  { name: 'Creative Studio', href: '/dashboard/creative-studio', icon: SwatchIcon },
]

// Current products - we'll expand this as more products are added
const products = [
  {
    name: 'Colonbroom',
    href: '/dashboard/products/colonbroom',
    category: 'Digestive Health',
    status: 'active'
  }
]

export default function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()

  return (
    <div className="w-64 bg-dark-800 h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-dark-700">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center mr-3">
            <span className="text-white font-bold text-sm">A</span>
          </div>
          <span className="text-xl font-bold text-white">AdForge Pro</span>
        </div>
        <div className="mt-2 text-sm text-gray-400">{session?.user?.email}</div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`sidebar-item ${isActive ? 'sidebar-item-active' : 'sidebar-item-inactive'}`}
            >
              <item.icon className="w-5 h-5 mr-3" />
              {item.name}
            </Link>
          )
        })}

        {/* Products Section */}
        <div className="pt-6">
          <div className="px-4 mb-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Products
              </h3>
              <Link href="/dashboard/admin/products/new">
                <PlusIcon className="w-4 h-4 text-gray-400 hover:text-white" />
              </Link>
            </div>
          </div>

          {/* Current Products */}
          <div className="space-y-1">
            {products.map((product) => {
              const isActive = pathname === product.href
              return (
                <Link
                  key={product.name}
                  href={product.href}
                  className={`sidebar-item text-sm ${isActive ? 'sidebar-item-active' : 'sidebar-item-inactive'}`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-xs text-gray-500">{product.category}</p>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </nav>

      {/* Sign Out */}
      <div className="p-4 border-t border-dark-700">
        <button
          onClick={() => signOut()}
          className="w-full text-left px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
        >
          Sign Out
        </button>
      </div>
    </div>
  )
} 