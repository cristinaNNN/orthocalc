// src/components/calculators/PaleyHeightCalculator.tsx
'use client'

import { useState, useEffect, useMemo } from 'react'
import { Calendar, Info } from 'lucide-react'
import { calculatePredictedHeight, PaleyHeightResult } from '@/lib/engines/paley_engine'
import { getDemographicContext } from '@/lib/engines/bmi_engine'
import PaleyHeightResultDisplay from './PaleyHeightResultDisplay'
import styles from './PaleyHeightCalculator.module.css'

interface PaleyHeightCalculatorProps {
  dob: string | null
  gender: string | null
  referenceDate: string 
  onSave: (data: { inputs: any, results: any, calculation_type: string }) => void
  onCancel: () => void
}

export default function PaleyHeightCalculator({ dob, gender, referenceDate, onSave, onCancel }: PaleyHeightCalculatorProps) {
  const [height, setHeight] = useState('')
  const [calcDate, setCalcDate] = useState(referenceDate ? new Date(referenceDate).toISOString().split('T')[0] : '')
  
  // LOGIC PRESERVED: Original Checkbox
  const [useBoneAge, setUseBoneAge] = useState(false)
  const [manualBoneAge, setManualBoneAge] = useState('')

  const [result, setResult] = useState<PaleyHeightResult | null>(null)

  const context = useMemo(() => 
    getDemographicContext(dob, calcDate), 
  [dob, calcDate])

  useEffect(() => {
    const h = parseFloat(height)
    if (!h || !gender) {
      setResult(null)
      return
    }

    let ageToUse = context.ageMonths / 12
    
    if (useBoneAge) {
       const ba = parseFloat(manualBoneAge)
       if (isNaN(ba) || ba <= 0) {
         setResult(null)
         return
       }
       ageToUse = ba
    }

    if (ageToUse > 0) {
      setResult(calculatePredictedHeight(h, ageToUse, gender, useBoneAge, calcDate))
    }
  }, [height, calcDate, useBoneAge, manualBoneAge, gender, context.ageMonths])

  const handleSave = () => {
    if (!result) return
    onSave({
      calculation_type: 'paley_height',
      inputs: { 
        height_cm: height, 
        reference_date: calcDate,
        use_bone_age: useBoneAge,
        manual_bone_age: manualBoneAge,
        age_used: result.meta.age_used,
        gender
      },
      results: result
    })
  }

  return (
    <div className={styles.container}>
      {/* HEADER (Matches others) */}
      <div className={styles.header}>
        <div className={styles.titleGroup}>
           <h4 className={styles.title}>Adult Height Prediction</h4>
           <span className={styles.subTitle}>Paley Multiplier Method</span>
        </div>
        <div className={styles.badges}>
           <span className={styles.badge}>{gender || 'N/A'}</span>
        </div>
      </div>

      <div className={styles.grid}>
        {/* Date Input */}
        <div className={styles.inputGroup}>
          <label>Date of Measurement</label>
          <div className={styles.dateInputWrapper}>
            <Calendar size={16} className={styles.inputIcon} />
            <input 
              type="date" 
              value={calcDate} 
              onChange={e => setCalcDate(e.target.value)}
              className={styles.input}
            />
          </div>
        </div>

        {/* Height Input */}
        <div className={styles.inputGroup}>
          <label>Current Height (cm)</label>
          <input 
            type="number" 
            value={height} 
            onChange={e => setHeight(e.target.value)}
            placeholder="e.g. 145"
            className={styles.input}
            autoFocus
          />
        </div>

        {/* CHECKBOX UI (PRESERVED) */}
        <div className={styles.checkboxGroup}>
           <input 
             type="checkbox" 
             id="boneAgeToggle" 
             checked={useBoneAge} 
             onChange={e => setUseBoneAge(e.target.checked)} 
           />
           <label htmlFor="boneAgeToggle">Manual Bone Age Override</label>
        </div>

        {/* Conditional Age Input */}
        {useBoneAge ? (
           <div className={styles.inputGroup}>
             <label>Skeletal Age (Years)</label>
             <input 
               type="number" 
               value={manualBoneAge} 
               onChange={e => setManualBoneAge(e.target.value)}
               placeholder="e.g. 11.5"
               className={styles.input}
               autoFocus
             />
           </div>
        ) : (
           <div className={styles.inputGroup}>
             <label>Chronological Age</label>
             <div style={{ padding: '0.75rem', background: '#f1f5f9', borderRadius: '8px', color: '#64748b', fontSize: '1rem'}}>
                {(context.ageMonths / 12).toFixed(2)} Years
             </div>
           </div>
        )}
      </div>

      {/* RESULT AREA */}
      {result ? (
        <PaleyHeightResultDisplay result={result} />
      ) : (
        <div className={styles.placeholder}>
          <Info size={20} />
          <span>Enter height and date to see prediction.</span>
        </div>
      )}

      {/* ACTIONS */}
      <div className={styles.actions}>
        <button onClick={onCancel} className={styles.cancelBtn}>Cancel</button>
        <button 
          onClick={handleSave} 
          disabled={!result} 
          className={styles.saveBtn}
        >
          Save Prediction
        </button>
      </div>
    </div>
  )
}