/**
 * PanchayatContext — state management for the Panchayat Portal.
 * Only activates when userType === 'panchayat'.
 * Stores panchayat profile, citizen list, analytics, alerts, campaigns, grievances, applications.
 */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { getPanchayatStats } from '../utils/api';
import {
    mockAnalytics,
    mockCampaigns,
    mockGrievances,
    mockCalendarEvents,
    mockVillageProfile,
} from '../data/mockPanchayat';

const PanchayatContext = createContext();

export function usePanchayat() {
    return useContext(PanchayatContext);
}

const EMPTY_PROFILE = {
    panchayatId: '',
    panchayatName: '',
    district: '',
    state: '',
    lgdCode: '',
    officialName: '',
    role: 'sarpanch',
    villagesCovered: [],
    status: 'active',
    totalHouseholds: 0,
};

export function PanchayatProvider({ children }) {
    const { isAuthenticated, userType, user, isLoading: isAuthLoading } = useAuth();

    const [panchayatProfile, setPanchayatProfile] = useState(EMPTY_PROFILE);
    const [citizens, setCitizens] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [analyticsData, setAnalyticsData] = useState(null);
    const [campaigns, setCampaigns] = useState([]);
    const [grievances, setGrievances] = useState([]);
    const [calendarEvents, setCalendarEvents] = useState([]);
    const [villageProfile, setVillageProfile] = useState(null);
    const [applications, setApplications] = useState([]);

    const [isLoading, setIsLoading] = useState(false);
    const [lastFetched, setLastFetched] = useState(null);

    // Refresh all panchayat data from API + mock fallbacks
    const refreshData = useCallback(async () => {
        if (!isAuthenticated || userType !== 'panchayat') return;

        setIsLoading(true);
        const panchayatId = user?.panchayatId;
        
        try {
            // Try live API for core stats
            if (!panchayatId) throw new Error("No panchayat ID found in user token");

            const stats = await getPanchayatStats(panchayatId);

            setPanchayatProfile((prev) => ({
                ...prev,
                panchayatId: user.panchayatId || prev.panchayatId,
                panchayatName: user.panchayatName || prev.panchayatName,
                district: user.district || prev.district,
                state: user.state || prev.state,
                lgdCode: user.lgdCode || prev.lgdCode,
                role: user.role || prev.role,
                officialName: user.officialName || prev.officialName,
                mobileNumber: user.mobileNumber || prev.mobileNumber,
                totalHouseholds: stats.totalHouseholds || 0,
            }));

            // Use API citizens data or empty array
            const apiCitizens = stats.households || [];
            setCitizens(apiCitizens);
            setApplications(stats.applications || []);

            // Use API alerts or empty array
            const apiAlerts = stats.alerts || [];
            setAlerts(apiAlerts);
        } catch (err) {
            console.warn('[PanchayatContext] API fetch failed:', err.message);
            setCitizens([]);
            setApplications([]);
            setAlerts([]);
        }

        // Features without backend yet — always use mock data
        setAnalyticsData(mockAnalytics);
        setCampaigns(mockCampaigns);
        setGrievances(mockGrievances);
        setCalendarEvents(mockCalendarEvents);
        setVillageProfile(mockVillageProfile);

        setLastFetched(new Date());
        setIsLoading(false);
    }, [isAuthenticated, userType, panchayatProfile.panchayatId]);

    // Auto-fetch on login
    useEffect(() => {
        if (isAuthLoading) return;
        if (isAuthenticated && userType === 'panchayat') {
            refreshData();
        } else if (!isAuthenticated || userType !== 'panchayat') {
            // Reset state when logging out or switching to citizen
            setPanchayatProfile(EMPTY_PROFILE);
            setCitizens([]);
            setAlerts([]);
            setAnalyticsData(null);
            setCampaigns([]);
            setGrievances([]);
            setCalendarEvents([]);
            setVillageProfile(null);
            setApplications([]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated, isAuthLoading, userType]);

    // Helper: get a citizen by ID
    const getCitizenById = useCallback(
        (id) => citizens.find((c) => c.citizenId === id || c.name === id),
        [citizens]
    );

    // Helper: computed stats
    const stats = {
        totalHouseholds: citizens.length,
        enrolled: citizens.filter((c) => c.status === 'enrolled').length,
        eligible: citizens.filter((c) => c.status === 'eligible').length,
        zeroBenefit: citizens.filter((c) => c.status === 'none').length,
        totalBenefitDelivered: citizens.reduce(
            (sum, c) => sum + (c.enrolledSchemes?.length || 0) * 6000,
            0
        ),
        totalBenefitPotential: citizens.reduce(
            (sum, c) => sum + (c.totalAnnualBenefit || 0),
            0
        ),
    };
    stats.welfareGap = stats.totalBenefitPotential - stats.totalBenefitDelivered;
    stats.performanceScore = stats.totalHouseholds > 0
        ? Math.min(100, Math.round((stats.enrolled / stats.totalHouseholds) * 100))
        : 0;

    const value = {
        panchayatProfile,
        citizens,
        alerts,
        analyticsData,
        campaigns,
        grievances,
        calendarEvents,
        villageProfile,
        applications,
        stats,
        isLoading,
        lastFetched,
        refreshData,
        getCitizenById,
        setCampaigns,
        setGrievances,
        setApplications,
    };

    return (
        <PanchayatContext.Provider value={value}>
            {children}
        </PanchayatContext.Provider>
    );
}

export default PanchayatContext;
