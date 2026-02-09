// src/lib/engines/paley_engine.ts
import { PALEY_HEIGHT_BOYS, PALEY_HEIGHT_GIRLS } from '../data/paley_data'

export interface PaleyHeightResult {
  predicted_height_cm: number
  growth_remaining_cm: number
  current_height_cm: number
  percent_grown: number
  // Meta object for "Medical Grade" Transparency
  meta: {
    methodology: string
    formula: string
    multiplier: number
    age_used: number
    gender: string
    is_bone_age: boolean
    reference_date: string
  }
}

export function calculatePredictedHeight(
  currentHeightCm: number,
  ageYears: number,
  gender: string,
  useBoneAge: boolean,
  refDate: string
): PaleyHeightResult | null {
  
  if (!currentHeightCm || !gender) return null

  // 1. Select the correct table
  const isMale = gender.toLowerCase().startsWith('m')
  const table = isMale ? PALEY_HEIGHT_BOYS : PALEY_HEIGHT_GIRLS
  
  // 2. Maturity Cap
  const maxAge = table[table.length - 1][0]
  if (ageYears >= maxAge) {
    return {
      predicted_height_cm: currentHeightCm,
      growth_remaining_cm: 0,
      current_height_cm: currentHeightCm,
      percent_grown: 100,
      meta: {
        methodology: 'Paley Multiplier (Maturity Reached)',
        formula: 'H_pred = H_current * 1.0',
        multiplier: 1.0,
        age_used: ageYears,
        gender,
        is_bone_age: useBoneAge,
        reference_date: refDate
      }
    }
  }

  // 3. Interpolation Logic
  let lowerRow = table[0]
  let upperRow = table[table.length - 1]

  for (let i = 0; i < table.length - 1; i++) {
    if (ageYears >= table[i][0] && ageYears < table[i+1][0]) {
      lowerRow = table[i]
      upperRow = table[i+1]
      break
    }
  }

  const x = ageYears
  const x1 = lowerRow[0]
  const y1 = lowerRow[1]
  const x2 = upperRow[0]
  const y2 = upperRow[1]

  let multiplier = y1
  if (x2 !== x1) {
    multiplier = y1 + (x - x1) * ((y2 - y1) / (x2 - x1))
  }

  // 4. Calculate Final Values
  const predictedHeight = currentHeightCm * multiplier
  const growthRemaining = predictedHeight - currentHeightCm
  const percentGrown = (currentHeightCm / predictedHeight) * 100

  return {
    predicted_height_cm: parseFloat(predictedHeight.toFixed(1)),
    growth_remaining_cm: parseFloat(growthRemaining.toFixed(1)),
    current_height_cm: currentHeightCm,
    percent_grown: parseFloat(percentGrown.toFixed(1)),
    meta: {
      methodology: 'Paley Multiplier Method',
      formula: `H_{pred} = H_{current} \\times ${multiplier.toFixed(4)}`,
      multiplier: parseFloat(multiplier.toFixed(4)),
      age_used: parseFloat(ageYears.toFixed(2)),
      gender,
      is_bone_age: useBoneAge,
      reference_date: refDate
    }
  }
}

export function formatImperial(cm: number): string {
  const totalInches = cm / 2.54
  const feet = Math.floor(totalInches / 12)
  const inches = Math.round(totalInches % 12)
  return `${feet}' ${inches}"`
}