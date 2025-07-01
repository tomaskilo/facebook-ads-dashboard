'use client'

import { useState } from 'react'
import { ChartBarIcon, PlusIcon, CogIcon } from '@heroicons/react/24/outline'
import AddProductModal from '@/components/modals/AddProductModal'

export default function QuickActions() {
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false)

  const handleProductAdded = (product: { name: string; initials: string; category: string }) => {
    // Product has been added successfully
    console.log('Product added:', product)
    setIsAddProductModalOpen(false)
  }

  const actions = [
    {
      name: 'Analyze Ad Performance',
      description: 'Deep dive into your ad metrics',
      icon: ChartBarIcon,
      action: () => console.log('Analyze performance'),
      color: 'bg-blue-600'
    },
    {
      name: 'Add Product',
      description: 'Add a new product to track',
      icon: PlusIcon,
      action: () => setIsAddProductModalOpen(true),
      color: 'bg-green-600'
    },
    {
      name: 'Setup Naming Rules',
      description: 'Configure naming conventions',
      icon: CogIcon,
      action: () => console.log('Setup naming'),
      color: 'bg-purple-600'
    }
  ]

  return (
    <>
      <div className="dashboard-card">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-white mb-2">Quick Actions</h2>
          <p className="text-gray-400 text-sm">Jump to the most common tasks</p>
        </div>

        <div className="space-y-4">
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={action.action}
              className="w-full p-4 bg-dark-700 hover:bg-dark-600 rounded-lg transition-colors text-left"
            >
              <div className="flex items-start">
                <div className={`p-2 rounded-lg ${action.color} mr-4`}>
                  <action.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-medium text-white mb-1">{action.name}</h3>
                  <p className="text-gray-400 text-sm">{action.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <AddProductModal 
        isOpen={isAddProductModalOpen}
        onClose={() => setIsAddProductModalOpen(false)}
        onProductAdded={handleProductAdded}
      />
    </>
  )
} 