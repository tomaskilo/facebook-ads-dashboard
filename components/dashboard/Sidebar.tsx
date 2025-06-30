'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import {
  ChartBarIcon,
  ChartPieIcon,
  UsersIcon,
  SwatchIcon,
  CogIcon,
  FolderIcon,
  PlusIcon
} from '@heroicons/react/24/outline'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: ChartBarIcon },
  { name: 'Analytics', href: '/dashboard/analytics', icon: ChartPieIcon },
  { name: 'Competitors', href: '/dashboard/competitors', icon: UsersIcon },
  { name: 'Creative Studio', href: '/dashboard/creative-studio', icon: SwatchIcon },
  { name: 'Brand Assets', href: '/dashboard/brand-assets', icon: FolderIcon },
  { name: 'Product Assets', href: '/dashboard/product-assets', icon: FolderIcon },
  { name: 'Naming', href: '/dashboard/naming', icon: CogIcon },
  { name: 'API Connections', href: '/dashboard/api-connections', icon: CogIcon },
  { name: 'Overall Metrics', href: '/dashboard/overall-metrics', icon: ChartBarIcon },
]

const products = [
  { name: 'Ecommerce', children: [
    { name: 'Rhea', href: '/dashboard/products/rhea' },
    { name: 'Colourform', href: '/dashboard/products/colourform' },
    { name: 'Moerie', href: '/dashboard/products/moerie' },
    { name: 'Bioma', href: '/dashboard/products/bioma' },
  ]},
  { name: 'Ecom Accelerator', children: [
    { name: 'Hot Bodhi', href: '/dashboard/products/hot-bodhi' },
    { name: 'Burnbok', href: '/dashboard/products/burnbok' },
  ]},
  { name: 'Go Health', children: [
    { name: 'Cardi Health', href: '/dashboard/products/cardi-health' },
    { name: 'My Body', href: '/dashboard/products/my-body' },
  ]},
  { name: 'WMA', children: [
    { name: 'Kure', href: '/dashboard/products/kure' },
    { name: 'Her Hypnosis', href: '/dashboard/products/her-hypnosis' },
    { name: 'Perfect Body', href: '/dashboard/products/perfect-body' },
    { name: 'No Carbs Challenge', href: '/dashboard/products/no-carbs-challenge' },
  ]},
]

export default function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [expandedCategory, setExpandedCategory] = useState<string | null>('Ecommerce')

  const toggleCategory = (categoryName: string) => {
    setExpandedCategory(expandedCategory === categoryName ? null : categoryName)
  }

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

          {products.map((category) => (
            <div key={category.name}>
              <button
                onClick={() => toggleCategory(category.name)}
                className="w-full sidebar-item sidebar-item-inactive justify-between"
              >
                <span>{category.name}</span>
                <span className={`transform transition-transform ${
                  expandedCategory === category.name ? 'rotate-90' : ''
                }`}>▶</span>
              </button>
              
              {expandedCategory === category.name && (
                <div className="ml-4 space-y-1">
                  {category.children.map((product) => (
                    <Link
                      key={product.name}
                      href={product.href}
                      className={`sidebar-item text-sm ${
                        pathname === product.href ? 'sidebar-item-active' : 'sidebar-item-inactive'
                      }`}
                    >
                      {product.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
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