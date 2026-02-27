import { useCallback } from 'react';
import { schemes } from '../data/mockSchemes';

/**
 * useEligibility — checks citizen profile against scheme eligibility rules.
 * In production, this would call the backend API (AWS Lambda).
 * For the prototype, it runs client-side matching.
 */
export function useEligibility() {
  const checkEligibility = useCallback((profile) => {
    if (!profile || !profile.age) return [];

    return schemes.filter((scheme) => {
      const e = scheme.eligibility;

      // Age check
      if (e.minAge && profile.age < e.minAge) return false;
      if (e.maxAge && profile.age > e.maxAge) return false;

      // Income check
      if (e.maxIncome && profile.income && profile.income * 12 > e.maxIncome) return false;

      // Gender check
      if (e.gender !== 'any' && profile.gender && profile.gender !== e.gender) return false;

      // Category check
      if (e.category && profile.category && !e.category.includes(profile.category)) return false;

      // Widow check
      if (e.isWidow === true && !profile.isWidow) return false;

      // Disability check
      if (e.hasDisability === true && !profile.hasDisability) return false;

      // Occupation check
      if (e.occupation && profile.occupation && !e.occupation.includes(profile.occupation)) return false;

      return true;
    });
  }, []);

  return { checkEligibility };
}

export default useEligibility;
