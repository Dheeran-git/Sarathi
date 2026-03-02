import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { getCitizenProfile, saveCitizen } from '../utils/api';
import { useAuth } from './AuthContext';

const CitizenContext = createContext();

const PROFILE_STORAGE_KEY = 'sarathi_citizen_profile';
const SCHEMES_STORAGE_KEY = 'sarathi_eligible_schemes';

/* ── localStorage helpers ─────────────────────────────────────────────── */
const loadFromStorage = (key, fallback) => {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch {
        return fallback;
    }
};

const saveToStorage = (key, value) => {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
        console.warn('[CitizenContext] localStorage write failed:', e);
    }
};

const clearStorage = () => {
    try {
        localStorage.removeItem(PROFILE_STORAGE_KEY);
        localStorage.removeItem(SCHEMES_STORAGE_KEY);
    } catch { }
};

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
    const [citizenProfile, setCitizenProfile] = useState(() => loadFromStorage(PROFILE_STORAGE_KEY, emptyProfile));
    const [eligibleSchemes, setEligibleSchemesRaw] = useState(() => loadFromStorage(SCHEMES_STORAGE_KEY, []));

    const [isLoadingProfile, setIsLoadingProfile] = useState(false);
    const { isAuthenticated, user } = useAuth();

    // The Cognito user ID (using email as a proxy)
    const userId = user?.email || localStorage.getItem('userEmail');

    // Ref to track the latest profile for debounced save
    const profileRef = useRef(citizenProfile);
    const schemesRef = useRef(eligibleSchemes);
    const dbSaveTimerRef = useRef(null);

    /* Wrap setEligibleSchemes to also persist */
    const setEligibleSchemes = useCallback((schemes) => {
        setEligibleSchemesRaw(schemes);
        schemesRef.current = schemes;
        saveToStorage(SCHEMES_STORAGE_KEY, schemes);
    }, []);

    /* ── Debounced save to DB (2s after last change) ──────────────────── */
    const scheduleDatabaseSave = useCallback((profile, schemes) => {
        const currentUserId = userId;
        if (!currentUserId) return;

        // Clear any pending timer
        if (dbSaveTimerRef.current) {
            clearTimeout(dbSaveTimerRef.current);
        }

        dbSaveTimerRef.current = setTimeout(async () => {
            try {
                const payload = { ...profile };
                if (schemes && schemes.length > 0) {
                    payload.matchedSchemes = schemes;
                    payload.totalAnnualBenefit = schemes.reduce((sum, s) => sum + (s.annualBenefit || 0), 0);
                }
                await saveCitizen(payload, currentUserId);
                console.log('[CitizenContext] ✅ Profile auto-saved to DB');
            } catch (err) {
                console.warn('[CitizenContext] Auto-save to DB failed (will retry on next update):', err);
            }
        }, 2000);
    }, [userId]);

    /* ── Load profile from DB on login ───────────────────────────────── */
    useEffect(() => {
        if (isAuthenticated && userId) {
            loadProfile();
        } else if (!isAuthenticated) {
            // On logout: clear local state but DB data stays intact
            setCitizenProfile(emptyProfile);
            setEligibleSchemesRaw([]);
            clearStorage();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated, userId]);

    // Cleanup timer on unmount
    useEffect(() => {
        return () => {
            if (dbSaveTimerRef.current) clearTimeout(dbSaveTimerRef.current);
        };
    }, []);

    const loadProfile = async () => {
        setIsLoadingProfile(true);
        try {
            const data = await getCitizenProfile(userId);
            if (data && data.citizenId) {
                // DB data takes priority — merge on top of defaults
                const merged = { ...emptyProfile, ...data };
                setCitizenProfile(merged);
                profileRef.current = merged;
                saveToStorage(PROFILE_STORAGE_KEY, merged);
                if (data.matchedSchemes && data.matchedSchemes.length > 0) {
                    setEligibleSchemes(data.matchedSchemes);
                }
                console.log('[CitizenContext] ✅ Profile loaded from DB for', userId);
            }
        } catch (error) {
            console.log('[CitizenContext] No existing profile in DB, using local/default:', error);
            // localStorage data is already loaded via useState initializer — nothing to do
        } finally {
            setIsLoadingProfile(false);
        }
    };

    const updateProfile = useCallback((updates) => {
        setCitizenProfile((prev) => {
            const next = { ...prev, ...updates };
            profileRef.current = next;
            saveToStorage(PROFILE_STORAGE_KEY, next);
            // Schedule a debounced save to DB
            scheduleDatabaseSave(next, schemesRef.current);
            return next;
        });
    }, [scheduleDatabaseSave]);

    const saveCurrentProfile = useCallback(async (matchedSchemes = []) => {
        if (!userId) return null;
        try {
            const payload = { ...profileRef.current };
            if (matchedSchemes.length > 0) {
                payload.matchedSchemes = matchedSchemes;
                const total = matchedSchemes.reduce((sum, s) => sum + (s.annualBenefit || 0), 0);
                payload.totalAnnualBenefit = total;
            }
            const res = await saveCitizen(payload, userId);
            console.log('[CitizenContext] ✅ Profile explicitly saved to DB');
            return res;
        } catch (error) {
            console.error('[CitizenContext] Failed to save profile:', error);
            throw error;
        }
    }, [userId]);

    const resetProfile = useCallback(() => {
        setCitizenProfile(emptyProfile);
        profileRef.current = emptyProfile;
        setEligibleSchemesRaw([]);
        schemesRef.current = [];
        clearStorage();
    }, []);

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
