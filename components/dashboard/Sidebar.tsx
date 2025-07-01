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
  PlusIcon,
  ArrowUpTrayIcon
} from '@heroicons/react/24/outline'
import AddProductModal from '@/components/modals/AddProductModal'
import UploadDataModal from '@/components/modals/UploadDataModal'

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
  const [showAddProductModal, setShowAddProductModal] = useState(false)
  const [showUploadDataModal, setShowUploadDataModal] = useState(false)
  const [productsList, setProductsList] = useState(products)
  const pathname = usePathname()
  const { data: session } = useSession()

  const handleProductAdded = (product: { name: string; initials: string; category: string }) => {
    // Add the new product to the list
    const newProduct = {
      name: product.name,
      href: `/dashboard/products/${product.initials.toLowerCase()}`,
      category: product.category,
      status: 'active' as const
    }
    setProductsList(prev => [...prev, newProduct])
    
    // Show success message
    console.log(`✅ Product "${product.name}" added successfully!`)
  }

  return (
    <>
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-slate-900 px-6">
          <div className="flex h-16 shrink-0 items-center">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                <span className="text-white font-bold text-sm">T</span>
              </div>
              <span className="text-xl font-semibold text-white">Toka Analysis</span>
            </div>
          </div>
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {navigation.map((item) => (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className={classNames(
                          pathname === item.href
                            ? 'bg-slate-800 text-white'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800',
                          'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'
                        )}
                      >
                        <item.icon className="h-6 w-6 shrink-0" aria-hidden="true" />
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
              
              {/* Products Section */}
              <li>
                <div className="text-xs font-semibold leading-6 text-slate-400">Products</div>
                <ul role="list" className="-mx-2 mt-2 space-y-1">
                  {productsList.map((product) => (
                    <li key={product.name}>
                      <Link
                        href={product.href}
                        className={classNames(
                          pathname.includes(product.href)
                            ? 'bg-slate-800 text-white'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800',
                          'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'
                        )}
                      >
                        {product.name === 'Colonbroom' ? '🌿' : '💊'} {product.name}
                      </Link>
                    </li>
                  ))}
                  <li>
                    <button
                      onClick={() => setShowAddProductModal(true)}
                      className="text-slate-400 hover:text-white hover:bg-slate-800 group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold w-full text-left"
                    >
                      <PlusIcon className="h-6 w-6 shrink-0" aria-hidden="true" />
                      Add Product
                    </button>
                  </li>
                </ul>
              </li>

              {/* Data Management Section */}
              <li>
                <div className="text-xs font-semibold leading-6 text-slate-400">Data Management</div>
                <ul role="list" className="-mx-2 mt-2 space-y-1">
                  <li>
                    <button
                      onClick={() => setShowUploadDataModal(true)}
                      className="text-slate-400 hover:text-white hover:bg-slate-800 group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold w-full text-left"
                    >
                      <ArrowUpTrayIcon className="h-6 w-6 shrink-0" aria-hidden="true" />
                      Upload Data
                    </button>
                  </li>
                </ul>
              </li>

              <li className="mt-auto">
                <Link
                  href="/dashboard/settings"
                  className={classNames(
                    pathname === '/dashboard/settings'
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800',
                    'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'
                  )}
                >
                  <CogIcon className="h-6 w-6 shrink-0" aria-hidden="true" />
                  Settings
                </Link>
              </li>
              
              {/* User Profile */}
              <li className="-mx-6 mt-auto">
                {session?.user && (
                  <div className="flex items-center gap-x-4 px-6 py-3 text-sm font-semibold leading-6 text-white">
                    <img
                      className="h-8 w-8 rounded-full bg-slate-800"
                      src={session.user.image || ''}
                      alt={session.user.name || ''}
                    />
                    <span className="sr-only">Your profile</span>
                    <div className="flex-1">
                      <span aria-hidden="true">{session.user.name}</span>
                      <button
                        onClick={() => signOut()}
                        className="block text-xs text-slate-400 hover:text-white"
                      >
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </li>
            </ul>
          </nav>
        </div>
      </div>
      
      {showAddProductModal && (
        <AddProductModal 
          isOpen={showAddProductModal}
          onClose={() => setShowAddProductModal(false)}
          onProductAdded={handleProductAdded}
        />
      )}
      {showUploadDataModal && (
        <UploadDataModal onClose={() => setShowUploadDataModal(false)} />
      )}
    </>
  )
}

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
} 