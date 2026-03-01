import { createContext, useContext, useState, useEffect } from 'react';
import { getCitizenProfile, saveCitizen } from '../utils/api';
import { useAuth } from './AuthContext';

const CitizenContext = createContext();

const emptyProfile = {
    name: '',
    age: null,
    state: '',
    income: null,
    category: '',
    gender: '',
    maritalStatus: '',
    urban: null,
    disability: false,
    bplCard: '',
    occupation: '',
    persona: '',
    // widow / female
    isWidow: false,
    shgMember: false,
    // farmer branch
    landOwned: null,
    landSize: null,
    tenantFarmer: null,
    livestock: null,
    irrigatedLand: null,
    // student branch
    classLevel: '',
    govtSchool: null,
    minority: null,
    // unemployed branch
    skillTrained: null,
    interestedInTraining: null,
    educationLevel: '',
    // business branch
    msmeRegistered: null,
    businessTurnover: null,
    loanNeeded: null,
    // senior branch
    pensionReceiving: null,
    // disability branch
    disabilityPercent: '',
    disabilityType: '',
    disabilityCertificate: null,
    // pregnant branch
    pregnant: null,
    lactating: null,
    // urban/rural branch
    ownHouse: null,
    streetVendor: null,
    kutchaHouse: null,
    mgnregaCard: null,
    // legacy compat
    hasDisability: false,
    familySize: null,
    isFarmer: false,
    hasLand: false,
    hasDaughters: false,
};

export function CitizenProvider({ children }) {
    const [citizenProfile, setCitizenProfile] = useState(emptyProfile);
    const [eligibleSchemes, setEligibleSchemes] = useState([]);

    const [isLoadingProfile, setIsLoadingProfile] = useState(false);
    const { isAuthenticated, user } = useAuth();

    // The Cognito user ID (using email as a proxy if actual sub isn't easily available in AuthContext)
    const userId = user?.email || localStorage.getItem('userEmail');

    useEffect(() => {
        if (isAuthenticated && userId) {
            loadProfile();
        } else {
            resetProfile();
        }
    }, [isAuthenticated, userId]);

    const loadProfile = async () => {
        setIsLoadingProfile(true);
        try {
            const data = await getCitizenProfile(userId);
            if (data && data.citizenId) {
                setCitizenProfile((prev) => ({ ...prev, ...data }));
                if (data.matchedSchemes) {
                    setEligibleSchemes(data.matchedSchemes);
                }
            }
        } catch (error) {
            console.log('[CitizenContext] No existing profile found for user or error loading:', error);
        } finally {
            setIsLoadingProfile(false);
        }
    };

    const updateProfile = (updates) => {
        setCitizenProfile((prev) => ({ ...prev, ...updates }));
    };

    const saveCurrentProfile = async (matchedSchemes = []) => {
        if (!userId) return null;
        try {
            const payload = { ...citizenProfile };
            if (matchedSchemes.length > 0) {
                payload.matchedSchemes = matchedSchemes;
                const total = matchedSchemes.reduce((sum, s) => sum + (s.annualBenefit || 0), 0);
                payload.totalAnnualBenefit = total;
            }
            const res = await saveCitizen(payload, userId);
            return res;
        } catch (error) {
            console.error('[CitizenContext] Failed to save profile:', error);
            throw error;
        }
    };

    const resetProfile = () => {
        setCitizenProfile(emptyProfile);
        setEligibleSchemes([]);
    };

    return (
        <CitizenContext.Provider
            value={{
                citizenProfile,
                eligibleSchemes,
                isLoadingProfile,
                updateProfile,
                saveCurrentProfile,
                setEligibleSchemes,
                resetProfile,
            }}
        >
            {children}
        </CitizenContext.Provider>
    );
}

export function useCitizen() {
    const context = useContext(CitizenContext);
    if (!context) {
        throw new Error('useCitizen must be used within a CitizenProvider');
    }
    return context;
}

export default CitizenContext;
