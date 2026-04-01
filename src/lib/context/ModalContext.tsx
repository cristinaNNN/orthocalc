'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react'
import { Patient } from '@/types'

type ModalContextType = {
  isAddPatientModalOpen: boolean
  editingPatient: Patient | null
  openAddPatientModal: (patient?: Patient) => void
  closeAddPatientModal: () => void
  refreshTrigger: number
  triggerRefresh: () => void
}

const ModalContext = createContext<ModalContextType | undefined>(undefined)

export function ModalProvider({ children }: { children: ReactNode }) {
  const [isAddPatientModalOpen, setIsAddPatientModalOpen] = useState(false)
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const openAddPatientModal = (patient?: Patient) => {
    setEditingPatient(patient || null)
    setIsAddPatientModalOpen(true)
  }
  
  const closeAddPatientModal = () => {
    setIsAddPatientModalOpen(false)
    setEditingPatient(null)
  }
  
  const triggerRefresh = () => setRefreshTrigger(prev => prev + 1)

  return (
    <ModalContext.Provider 
      value={{ 
        isAddPatientModalOpen, 
        editingPatient,
        openAddPatientModal, 
        closeAddPatientModal, 
        refreshTrigger, 
        triggerRefresh 
      }}
    >
      {children}
    </ModalContext.Provider>
  )
}

export function useModal() {
  const context = useContext(ModalContext)
  if (context === undefined) {
    throw new Error('useModal must be used within a ModalProvider')
  }
  return context
}
