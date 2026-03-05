/**
 * PanchayatContext — state management for the Panchayat Portal.
 * Only activates when userType === 'panchayat'.
 * Stores panchayat profile, citizen list, analytics, alerts, campaigns, grievances, applications.
 */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { getPanchayatStats } from '../utils/api';
import {
    households as mockHouseholds,
    alerts as mockAlerts,
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
        try {
            // Try live API for core stats
            const panchayatId = user.panchayatId;
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

            // Use API citizens data if available, else mock
            const apiCitizens = stats.households || [];
            setCitizens(apiCitizens.length > 0 ? apiCitizens : mockHouseholds);

            // Use API alerts if present, else mock
            const apiAlerts = stats.alerts || [];
            setAlerts(apiAlerts.length > 0 ? apiAlerts : mockAlerts);
        } catch (err) {
            console.warn('[PanchayatContext] API fetch failed, using mock data:', err.message);
            setCitizens(mockHouseholds);
            setAlerts(mockAlerts);
        }

        // Features without backend yet — always use mock data
        setAnalyticsData(mockAnalytics);
        setCampaigns(mockCampaigns);
        setGrievances(mockGrievances);
        setCalendarEvents(mockCalendarEvents);
        setVillageProfile(mockVillageProfile);

        // Generate mock applications from citizens
        const mockApps = citizens.slice(0, 15).map((c, i) => ({
            applicationId: `APP-${String(i + 1).padStart(3, '0')}`,
            citizenId: c.citizenId || c.name?.toLowerCase().replace(/\s/g, '-') || `citizen-${i}`,
            citizenName: c.name || 'Unknown',
            schemeId: ['pm-kisan', 'pmay-g', 'ayushman-bharat', 'mgnregs', 'pm-ujjwala'][i % 5],
            schemeName: ['PM-KISAN', 'PMAY-G', 'Ayushman Bharat', 'MGNREGS', 'PM Ujjwala'][i % 5],
            status: ['submitted', 'pending', 'approved', 'rejected', 'submitted'][i % 5],
            documentsChecked: i % 3 === 0 ? ['Aadhaar', 'Bank Passbook'] : ['Aadhaar'],
            createdAt: new Date(Date.now() - i * 86400000 * 3).toISOString(),
            updatedAt: new Date(Date.now() - i * 86400000).toISOString(),
        }));
        setApplications(mockApps);

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
