import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { getCitizenProfile, saveCitizen, getApplications } from '../utils/api';
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
    district: '',
    block: '',
    village: '',
    villageCode: '',
    panchayatCode: '',
    panchayatName: '',
    panchayatId: '',
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

    // B5: Applications state
    const [applications, setApplications] = useState([]);
    const [isLoadingApplications, setIsLoadingApplications] = useState(false);

    const [isLoadingProfile, setIsLoadingProfile] = useState(false);
    const { isAuthenticated, isLoading: isAuthLoading, user, userType } = useAuth();

    const userId = user?.email || localStorage.getItem('userEmail');

    const profileRef = useRef(citizenProfile);
    const schemesRef = useRef(eligibleSchemes);
    const dbSaveTimerRef = useRef(null);

    const setEligibleSchemes = useCallback((schemes) => {
        setEligibleSchemesRaw(schemes);
        schemesRef.current = schemes;
        saveToStorage(SCHEMES_STORAGE_KEY, schemes);
    }, []);

    /* ── Debounced save to DB ─────────────────────────────────────────── */
    const scheduleDatabaseSave = useCallback((profile, schemes) => {
        const currentUserId = userId;
        if (!currentUserId) return;

        if (dbSaveTimerRef.current) clearTimeout(dbSaveTimerRef.current);

        dbSaveTimerRef.current = setTimeout(async () => {
            try {
                const payload = { ...profile };
                if (schemes && schemes.length > 0) {
                    payload.matchedSchemes = schemes;
                    payload.totalAnnualBenefit = schemes.reduce((sum, s) => sum + (s.annualBenefit || 0), 0);
                }
                await saveCitizen(payload, currentUserId);
                console.log('[CitizenContext] Profile auto-saved to DB');
            } catch (err) {
                console.warn('[CitizenContext] Auto-save failed (will retry):', err);
            }
        }, 2000);
    }, [userId]);

    /* ── Load profile + applications from DB on login ─────────────────── */
    useEffect(() => {
        // Don't do anything while auth state is still being determined
        if (isAuthLoading) return;

        // Only load citizen profile/applications for citizen users, NOT panchayat
        if (isAuthenticated && userId && userType === 'citizen') {
            loadProfile();
            loadApplications(userId);
        } else if (!isAuthenticated) {
            setCitizenProfile(emptyProfile);
            setEligibleSchemesRaw([]);
            setApplications([]);
            clearStorage();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated, isAuthLoading, userId, userType]);

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
                const merged = { ...emptyProfile, ...data };
                setCitizenProfile(merged);
                profileRef.current = merged;
                saveToStorage(PROFILE_STORAGE_KEY, merged);
                if (data.matchedSchemes && data.matchedSchemes.length > 0) {
                    setEligibleSchemes(data.matchedSchemes);
                }
                console.log('[CitizenContext] Profile loaded from DB');
            } else {
                // No profile in DB — keep whatever is in localStorage
                console.log('[CitizenContext] No profile in DB, keeping local data');
            }
        } catch (error) {
            // DB fetch failed — keep localStorage data, don't wipe it
            console.log('[CitizenContext] DB fetch failed, keeping local data:', error.message);
        } finally {
            setIsLoadingProfile(false);
        }
    };

    // B5: Load applications
    const loadApplications = useCallback(async (uid) => {
        if (!uid) return;
        setIsLoadingApplications(true);
        try {
            const data = await getApplications(uid);
            setApplications(data?.applications || []);
        } catch {
            setApplications([]);
        } finally {
            setIsLoadingApplications(false);
        }
    }, []);

    const refreshApplications = useCallback(() => {
        if (userId) loadApplications(userId);
    }, [userId, loadApplications]);

    const updateProfile = useCallback((updates) => {
        setCitizenProfile((prev) => {
            const next = { ...prev, ...updates };
            profileRef.current = next;
            saveToStorage(PROFILE_STORAGE_KEY, next);
            scheduleDatabaseSave(next, schemesRef.current);
            return next;
        });
    }, [scheduleDatabaseSave]);

    const saveCurrentProfile = useCallback(async (matchedSchemes = [], extraFields = {}) => {
        if (!userId) return null;
        try {
            const payload = { ...profileRef.current, ...extraFields };
            if (matchedSchemes.length > 0) {
                payload.matchedSchemes = matchedSchemes;
                payload.totalAnnualBenefit = matchedSchemes.reduce((sum, s) => sum + (s.annualBenefit || 0), 0);
            }
            const res = await saveCitizen(payload, userId);
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
        setApplications([]);
        clearStorage();
    }, []);

    const hasLocation = !!(citizenProfile.village && citizenProfile.state && citizenProfile.district);

    return (
        <CitizenContext.Provider
            value={{
                citizenProfile,
                eligibleSchemes,
                isLoadingProfile,
                hasLocation,
                updateProfile,
                saveCurrentProfile,
                setEligibleSchemes,
                resetProfile,
                // B5: applications
                applications,
                isLoadingApplications,
                refreshApplications,
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
