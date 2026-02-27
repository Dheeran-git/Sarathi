import { createContext, useContext, useState } from 'react';

const CitizenContext = createContext();

const emptyProfile = {
    name: '',
    age: null,
    state: '',
    income: null,
    category: '',
    gender: '',
    isWidow: false,
    hasDisability: false,
    occupation: '',
    familySize: null,
    isFarmer: false,
    hasLand: false,
    hasDaughters: false,
};

export function CitizenProvider({ children }) {
    const [citizenProfile, setCitizenProfile] = useState(emptyProfile);
    const [eligibleSchemes, setEligibleSchemes] = useState([]);

    const updateProfile = (updates) => {
        setCitizenProfile((prev) => ({ ...prev, ...updates }));
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
                updateProfile,
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
