// src/components/calculators/ScoliosisResultDisplay.tsx
'use client'

import { ScoliosisResult } from '@/lib/engines/scoliosis_engine'
import styles from './ScoliosisCalculator.module.css'
import FormulaPopover from './FormulaPopover'

interface Props {
  result: ScoliosisResult
}

export default function ScoliosisResultDisplay({ result }: Props) {
  if (!result) return null

  // 1. Color Logic
  const getCategoryStyle = (cat: string) => {
    if (cat === 'LOW') return styles.green
    if (cat === 'MODERATE') return styles.yellow
    if (cat === 'HIGH') return styles.red
    return styles.green
  }

  // 2. Bar Gauge Logic (Scale: 0 to 2.5 for display)
  // Low (<0.5), Mod (0.5-1.5), High (>1.5)
  // We map 0-2.5 to 0-100%
  const maxScale = 2.5
  const clampedFactor = Math.min(Math.max(result.risk_factor, 0), maxScale)
  const markerPosition = (clampedFactor / maxScale) * 100

  // Segments: 0.5 is 20% of 2.5. 1.5 is 60% of 2.5.
  // 0 -> 0.5 (Low) = 20% width
  // 0.5 -> 1.5 (Mod) = 40% width
  // 1.5 -> 2.5 (High) = 40% width
  
  return (
    <div className={styles.resultContainer}>
      
      {/* 1. MEASUREMENTS (Read-only inputs) */}
      <div className={styles.measurementsRow}>
        <div className={styles.measureItem}>
           <span className={styles.measureLabel}>Cobb Angle</span>
           <span className={styles.measureValue}>{result.meta.cobb_angle}°</span>
        </div>
        <div className={styles.measureItem}>
           <span className={styles.measureLabel}>Risser</span>
           <span className={styles.measureValue}>{result.meta.risser_sign}</span>
        </div>
        <div className={styles.measureItem}>
           <span className={styles.measureLabel}>Age</span>
           <span className={styles.measureValue}>{result.meta.age_used.toFixed(1)}y</span>
        </div>
      </div>

      <div className={styles.divider} />

      {/* 2. MAIN RESULT (Risk Factor) */}
      <div className={styles.mainResult}>
         <div className={styles.valueGroup}>
            <div style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
               <span className={styles.mainValue}>{result.risk_factor}</span>
               <FormulaPopover 
                  title="Progression Factor"
                  formula={result.meta.formula}
               />
            </div>
            <span className={styles.unit}>LCR</span>
         </div>
         <div className={`${styles.categoryPill} ${getCategoryStyle(result.risk_category)}`}>
            {result.risk_category} RISK
         </div>
      </div>

      {/* 3. VISUAL CONTEXT (Risk Gauge) */}
      <div className={styles.visualContext}>
         <div className={styles.contextHeader}>
            <span>Progression Probability: <strong>{result.progression_probability}</strong></span>
            <span>Ref: Lonstein (1984)</span>
         </div>

         <div className={styles.barContainer}>
            <div className={styles.barSegments}>
               <div className={`${styles.seg} ${styles.green}`} style={{width: '20%'}}></div>
               <div className={`${styles.seg} ${styles.yellow}`} style={{width: '40%'}}></div>
               <div className={`${styles.seg} ${styles.red}`} style={{width: '40%'}}></div>
            </div>
            <div 
               className={styles.marker}
               style={{ left: `${markerPosition}%` }}
            >
               <div className={styles.markerHead}></div>
            </div>
         </div>
         <div className={styles.barLabels}>
             <span style={{left: '0%'}}>0</span>
             <span style={{left: '20%'}}>0.5</span>
             <span style={{left: '60%'}}>1.5</span>
             <span style={{left: '100%'}}>2.5+</span>
         </div>
      </div>

      {/* 4. METHODOLOGY & PARAMETERS */}
      <div className={styles.metaContainer}>
         <h5 className={styles.metaTitle}>
            METHODOLOGY: {result.meta.methodology}
            <FormulaPopover 
               title="Lonstein-Carlson Method"
               description="A predictive model for AIS curves (20-29 degrees). It weighs the magnitude of the curve against the remaining skeletal growth (Risser sign) to estimate the risk of the curve progressing to >25 degrees."
            />
         </h5>

         <div className={styles.metaGrid}>
            <div className={styles.metaItem}>
               <span className={styles.metaLabel}>Equation</span>
               <span className={styles.metaValue} style={{fontSize: '0.75rem'}}>
                 (Cobb - 3×Risser) / Age
               </span>
            </div>
            <div className={styles.metaItem}>
               <div style={{display: 'flex', alignItems: 'center'}}>
                  <span className={styles.metaLabel}>Cobb</span>
                  <FormulaPopover title="Cobb Angle" description="The degree of lateral curvature." />
               </div>
               <span className={styles.metaValue}>{result.meta.cobb_angle}</span>
            </div>
            <div className={styles.metaItem}>
               <div style={{display: 'flex', alignItems: 'center'}}>
                  <span className={styles.metaLabel}>Risser</span>
                   <FormulaPopover title="Risser Sign" description="Grade of iliac apophysis ossification (0-5), indicating skeletal maturity." />
               </div>
               <span className={styles.metaValue}>{result.meta.risser_sign}</span>
            </div>
         </div>
      </div>

    </div>
  )
}