'use client'

import { useRouter } from 'next/navigation'
import PatientDetailView from '@/components/patients/PatientDetailView'
import { X } from 'lucide-react'

import styles from './InterceptedPatientModal.module.css'

export default function InterceptedPatientModal({ params }: { params: { id: string } }) {
  const router = useRouter()

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <span className={styles.quickView}>Quick View</span>
          <button 
            onClick={() => router.back()}
            className={styles.closeBtn}
          >
            <X size={20} />
          </button>
        </div>

        <div className={styles.body}>
          <PatientDetailView patientId={params.id} />
        </div>
      </div>
    </div>
  )
}