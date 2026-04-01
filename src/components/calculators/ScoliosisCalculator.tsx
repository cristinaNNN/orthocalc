// src/components/calculators/ScoliosisCalculator.tsx
'use client'

import { useState, useEffect, useMemo } from 'react'
import { Calendar, Info } from 'lucide-react'
import { calculateScoliosisRisk, RISSER_DESCRIPTIONS, ScoliosisResult } from '@/lib/engines/scoliosis_engine'
import { getDemographicContext } from '@/lib/engines/bmi_engine' 
import ScoliosisResultDisplay from './ScoliosisResultDisplay'
import styles from './ScoliosisCalculator.module.css'

interface ScoliosisCalculatorProps {
  dob: string | null
  referenceDate: string 
  initialInputs?: any
  onSave: (data: { inputs: any, results: any, calculation_type: string }) => void
  onCancel: () => void
}

export default function ScoliosisCalculator({ dob, referenceDate, initialInputs, onSave, onCancel }: ScoliosisCalculatorProps) {
  const [cobbAngle, setCobbAngle] = useState('')
  const [risserSign, setRisserSign] = useState<number | null>(null)
  const [calcDate, setCalcDate] = useState(referenceDate ? new Date(referenceDate).toISOString().split('T')[0] : '')
  const [result, setResult] = useState<ScoliosisResult | null>(null)

  useEffect(() => {
    if (initialInputs) {
      setCobbAngle(initialInputs.cobb_angle || '')
      setRisserSign(initialInputs.risser_sign ?? null)
      setCalcDate(initialInputs.reference_date || '')
    }
  }, [initialInputs])

  const context = useMemo(() => 
    getDemographicContext(dob, calcDate), 
  [dob, calcDate])

  useEffect(() => {
    const cobb = parseFloat(cobbAngle)
    const age = context.ageMonths / 12

    if (!isNaN(cobb) && risserSign !== null && age > 0) {
      setResult(calculateScoliosisRisk(cobb, risserSign, age, calcDate))
    } else {
      setResult(null)
    }
  }, [cobbAngle, risserSign, context.ageMonths, calcDate])

  const handleSave = () => {
    if (!result) return
    onSave({
      calculation_type: 'scoliosis_risk',
      inputs: {
        cobb_angle: cobbAngle,
        risser_sign: risserSign,
        reference_date: calcDate,
        age_at_calc: context.ageMonths / 12
      },
      results: result
    })
  }

  return (
    <div className={styles.container}>
      {/* HEADER */}
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <h4 className={styles.title}>Scoliosis Progression Risk</h4>
          <span className={styles.subTitle}>
             Age: {(context.ageMonths/12).toFixed(1)}y • Lonstein-Carlson
          </span>
        </div>
        <div className={styles.badges}>
           <span className={styles.badge}>AIS Only</span>
        </div>
      </div>

      {/* INPUTS GRID */}
      <div className={styles.grid}>
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

        <div className={styles.inputGroup}>
          <label>Cobb Angle (°)</label>
          <input 
            type="number" 
            value={cobbAngle} 
            onChange={e => setCobbAngle(e.target.value)}
            placeholder="e.g. 25"
            className={styles.input}
            autoFocus
          />
        </div>

        {/* RISSER SELECTOR */}
        <div className={styles.risserContainer}>
          <div className={styles.risserLabelRow}>
            <label style={{fontSize: '0.875rem', fontWeight: 600, color: '#475569'}}>
              Risser Sign (0-5)
            </label>
            {risserSign !== null && (
              <span className={styles.risserDesc}>{RISSER_DESCRIPTIONS[risserSign]}</span>
            )}
          </div>
          <div className={styles.risserGroup}>
            {[0, 1, 2, 3, 4, 5].map((val) => (
              <button
                key={val}
                className={`${styles.risserBtn} ${risserSign === val ? styles.selected : ''}`}
                onClick={() => setRisserSign(val)}
              >
                {val}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* RESULT AREA */}
      {result ? (
        <ScoliosisResultDisplay result={result} />
      ) : (
        <div className={styles.placeholder}>
          <Info size={20} />
          <span>Enter Cobb angle and Risser sign to see progression risk.</span>
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
          Save Calculation
        </button>
      </div>
    </div>
  )
}