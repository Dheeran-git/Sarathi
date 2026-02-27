import { useCallback } from 'react';
import { checkEligibility } from '../utils/api';

/**
 * useEligibility — calls the live AWS eligibility API.
 * Returns the async checkEligibility function that calls the backend Lambda.
 */
export function useEligibility() {
  const check = useCallback(async (profile) => {
    if (!profile || !profile.age) return [];
    const result = await checkEligibility({
      age: profile.age,
      gender: profile.gender || 'any',
      monthlyIncome: profile.income || profile.monthlyIncome || 0,
      isWidow: profile.isWidow || false,
      occupation: profile.occupation || 'any',
      category: profile.category || 'General',
    });
    return result.matchedSchemes || [];
  }, []);

  return { checkEligibility: check };
}

export default useEligibility;
