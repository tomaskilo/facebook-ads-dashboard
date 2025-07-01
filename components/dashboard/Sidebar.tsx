'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import {
  ChartBarIcon,
  ChartPieIcon,
  SwatchIcon,
  CogIcon,
  PlusIcon,
  ArrowUpTrayIcon,
  ChevronRightIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline'
import AddProductModal from '@/components/modals/AddProductModal'
import UploadDataModal from '@/components/modals/UploadDataModal'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: ChartBarIcon },
  { name: 'Analytics', href: '/dashboard/analytics', icon: ChartPieIcon },
  { name: 'Creative Studio', href: '/dashboard/creative-studio', icon: SwatchIcon },
]

interface Product {
  id: number;
  name: string;
  initials: string;
  category: string;
  table_name: string;
  created_at: string;
}

interface GroupedProducts {
  [category: string]: Product[];
}

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

export default function Sidebar() {
  const [showAddProductModal, setShowAddProductModal] = useState(false)
  const [showUploadDataModal, setShowUploadDataModal] = useState(false)
  const [productsList, setProductsList] = useState<Product[]>([])
  const [groupedProducts, setGroupedProducts] = useState<GroupedProducts>({})
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [loadingProducts, setLoadingProducts] = useState(true)
  const pathname = usePathname()
  const { data: session } = useSession()

  // Fetch products from database
  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      setLoadingProducts(true)
      const response = await fetch('/api/products')
      if (response.ok) {
        const products = await response.json()
        setProductsList(products)
        
        // Group products by category
        const grouped = (products as Product[]).reduce((acc: GroupedProducts, product: Product) => {
          if (!acc[product.category]) {
            acc[product.category] = []
          }
          acc[product.category].push(product)
          return acc
        }, {})
        
        setGroupedProducts(grouped)
        
        // Auto-expand categories that have active products
        const activeCategories = new Set<string>()
        Object.entries(grouped).forEach(([category, categoryProducts]) => {
          if (categoryProducts.some((product: Product) => 
            pathname.includes(`/dashboard/products/${product.name.toLowerCase()}`) ||
            pathname.includes(`/dashboard/categories/${category.toLowerCase()}`)
          )) {
            activeCategories.add(category)
          }
        })
        setExpandedCategories(activeCategories)
        
      } else {
        console.error('Failed to fetch products')
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoadingProducts(false)
    }
  }

  const handleProductAdded = (product: { name: string; initials: string; category: string }) => {
    // Refresh the products list from database
    fetchProducts()
    
    // Show success message
    console.log(`✅ Product "${product.name}" added successfully!`)
  }

  // Get category icon
  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: string } = {
      'Ecommerce': '🛒',
      'Ecom Accelerator': '🚀',
      'Go Health': '🏥',
      'WMA': '⚖️',
      'Beyond Wellness': '🌟'
    }
    return icons[category] || '📦'
  }

  // Get product icon based on category
  const getProductIcon = (category: string, name: string) => {
    if (name.toLowerCase() === 'colonbroom') return '🌿'
    if (category === 'Ecommerce') return '💊'
    if (category === 'Go Health') return '🏥'
    if (category === 'WMA') return '⚖️'
    if (category === 'Beyond Wellness') return '🌟'
    return '📦'
  }

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev)
      if (newSet.has(category)) {
        newSet.delete(category)
      } else {
        newSet.add(category)
      }
      return newSet
    })
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
              
              {/* Categories Section */}
              <li>
                <div className="text-xs font-semibold leading-6 text-slate-400">Categories</div>
                <ul role="list" className="-mx-2 mt-2 space-y-1">
                  {loadingProducts ? (
                    <li className="text-slate-400 px-2 py-2 text-sm">Loading categories...</li>
                  ) : Object.keys(groupedProducts).length > 0 ? (
                    Object.entries(groupedProducts).map(([category, products]) => (
                      <li key={category}>
                        {/* Category Header */}
                        <div className="flex flex-col">
                          {/* Category Link + Toggle */}
                          <div className="flex items-center">
                            <Link
                              href={`/dashboard/categories/${category.toLowerCase().replace(/\s+/g, '-')}`}
                              className={classNames(
                                pathname.includes(`/dashboard/categories/${category.toLowerCase().replace(/\s+/g, '-')}`)
                                  ? 'bg-slate-800 text-white'
                                  : 'text-slate-400 hover:text-white hover:bg-slate-800',
                                'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold flex-1'
                              )}
                            >
                              {getCategoryIcon(category)} {category}
                              <span className="ml-auto text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded-full">
                                {products.length}
                              </span>
                            </Link>
                            <button
                              onClick={() => toggleCategory(category)}
                              className="p-1 text-slate-400 hover:text-white"
                            >
                              {expandedCategories.has(category) ? (
                                <ChevronDownIcon className="h-4 w-4" />
                              ) : (
                                <ChevronRightIcon className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                          
                          {/* Products Sub-menu */}
                          {expandedCategories.has(category) && (
                            <ul className="ml-6 mt-1 space-y-1">
                              {products.map((product) => (
                                <li key={product.id}>
                                  <Link
                                    href={`/dashboard/products/${product.name.toLowerCase()}`}
                                    className={classNames(
                                      pathname.includes(`/dashboard/products/${product.name.toLowerCase()}`)
                                        ? 'bg-slate-800 text-white'
                                        : 'text-slate-400 hover:text-white hover:bg-slate-700',
                                      'group flex gap-x-3 rounded-md p-2 text-sm leading-6 pl-3'
                                    )}
                                  >
                                    {getProductIcon(product.category, product.name)} {product.name}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </li>
                    ))
                  ) : (
                    <li className="text-slate-400 px-2 py-2 text-sm">No categories yet</li>
                  )}
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
                      Upload CSV Data
                    </button>
                  </li>
                  <li>
                    <Link
                      href="/dashboard/admin/products/new"
                      className={classNames(
                        pathname === '/dashboard/admin/products/new'
                          ? 'bg-slate-800 text-white'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800',
                        'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'
                      )}
                    >
                      <CogIcon className="h-6 w-6 shrink-0" aria-hidden="true" />
                      Admin Panel
                    </Link>
                  </li>
                </ul>
              </li>

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
        <UploadDataModal 
          onClose={() => setShowUploadDataModal(false)}
          products={productsList}
        />
      )}
    </>
  )
} 