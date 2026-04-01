'use client'

import React from 'react'
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ModalProvider, useModal } from "@/lib/context/ModalContext";
import AddPatientModal from "@/components/patients/AddPatientModal";

export function AppLayout({ children, modal }: { children: React.ReactNode, modal: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <ModalProvider>
        <Header />
        <main style={{ minHeight: 'calc(100vh - 200px)' }}>
          {children}
        </main>
        <Footer />
        {modal}
        <GlobalModals />
      </ModalProvider>
    </ThemeProvider>
  )
}

function GlobalModals() {
  const { isAddPatientModalOpen, editingPatient, closeAddPatientModal, triggerRefresh } = useModal()
  
  return (
    <AddPatientModal 
      isOpen={isAddPatientModalOpen}
      initialData={editingPatient}
      onClose={closeAddPatientModal}
      onSuccess={triggerRefresh}
    />
  )
}
