/**
 * useWeightUnit — convenience hook for reading and setting the weight unit preference.
 *
 * Returns { weightUnit, setWeightUnit }.
 * Delegates to WorkoutContext which handles AsyncStorage persistence.
 *
 * @returns {{ weightUnit: 'kg'|'lbs', setWeightUnit: (unit: 'kg'|'lbs') => void }}
 */
import { useWorkout } from '../context/WorkoutContext';

export function useWeightUnit() {
  const { weightUnit, setWeightUnit } = useWorkout();
  return { weightUnit, setWeightUnit };
}
