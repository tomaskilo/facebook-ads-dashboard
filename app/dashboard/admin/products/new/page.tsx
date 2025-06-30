'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import AddProductModal from '@/components/modals/AddProductModal'

export default function NewProductPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(true)

  const handleClose = () => {
    setIsModalOpen(false)
    router.push('/dashboard')
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Add New Product</h1>
        <p className="text-gray-400">Create a new product and upload CSV data</p>
      </div>

      <AddProductModal 
        isOpen={isModalOpen}
        onClose={handleClose}
      />
    </div>
  )
} 