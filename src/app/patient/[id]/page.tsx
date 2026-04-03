'use client'

import PatientDetailView from '@/components/patients/PatientDetailView'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

import styles from './PatientPage.module.css'

export default function PatientPage({ params }: { params: { id: string } }) {
  return (
    <main className={styles.main}>
      <Link 
        href="/" 
        className={styles.backLink}
      >
        <ArrowLeft size={18} />
        Back to Dashboard
      </Link>
      
      <div className={styles.viewContainer}>
        <PatientDetailView patientId={params.id} />
      </div>
    </main>
  )
}