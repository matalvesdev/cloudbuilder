import { useContext } from 'react'
import { ValidationContext } from './ValidationProvider'

export function useValidation() {
  const ctx = useContext(ValidationContext)
  if (!ctx) {
    throw new Error('useValidation must be used within a ValidationProvider')
  }
  return ctx
}
