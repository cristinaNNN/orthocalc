// src/lib/engines/scoliosis_engine.ts

export interface ScoliosisResult {
  risk_factor: number
  risk_category: 'LOW' | 'MODERATE' | 'HIGH' | 'INVALID'
  progression_probability: string
  meta: {
    methodology: string
    formula: string
    reference_date: string
    age_used: number
    cobb_angle: number
    risser_sign: number
    error?: string
  }
}

export const RISSER_DESCRIPTIONS = [
  "No ossification",           // 0
  "25% (anterolateral)",       // 1
  "50% (halfway)",             // 2
  "75% (posteromedial)",       // 3
  "100% (no fusion)",          // 4
  "Fusion (maturity)"          // 5
]

export function calculateScoliosisRisk(
  cobb: number, 
  risser: number, 
  age: number,
  refDate: string
): ScoliosisResult {
  
  // DEFENSIVE CODING: Prevent division by zero for infantile cases
  if (age <= 0) {
    return {
      risk_factor: 0,
      risk_category: 'INVALID',
      progression_probability: 'N/A (Age <= 0)',
      meta: {
        methodology: 'Lonstein-Carlson (1984) - FAILED',
        formula: 'LCR = (Cobb - 3*Risser) / Age',
        reference_date: refDate,
        age_used: age,
        cobb_angle: cobb,
        risser_sign: risser,
        error: 'Age must be greater than 0 to calculate progression risk.'
      }
    }
  }

  // Formula: (Cobb - 3*Risser) / Age
  const rawFactor = (cobb - (3 * risser)) / age
  const factor = parseFloat(rawFactor.toFixed(2))

  // Thresholds (Lonstein & Carlson 1984)
  let category: 'LOW' | 'MODERATE' | 'HIGH' = 'LOW'
  let prob = '< 20%'

  if (factor <= 0.5) {
    category = 'LOW'
    prob = 'approx. 20%'
  } else if (factor > 0.5 && factor <= 1.5) {
    category = 'MODERATE'
    prob = '40% - 60%'
  } else {
    category = 'HIGH'
    prob = '> 80%'
  }

  return {
    risk_factor: factor,
    risk_category: category,
    progression_probability: prob,
    meta: {
      methodology: 'Lonstein-Carlson (1984)',
      formula: 'LCR = (Cobb - 3*Risser) / Age',
      reference_date: refDate,
      age_used: age,
      cobb_angle: cobb,
      risser_sign: risser
    }
  }
}