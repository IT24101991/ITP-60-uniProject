import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check local storage for persistent login (mock)
        const storedUser = localStorage.getItem('lifeline_user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        const response = await api.post('/api/auth/login', { email, password });
        const payload = response?.data || {};

        const userData = {
            id: payload.userId,
            userId: payload.userId,
            name: payload.name,
            email: payload.email,
            role: payload.role
        };

        setUser(userData);
        localStorage.setItem('lifeline_user', JSON.stringify(userData));
        return userData;
    };

    const register = (data) => {
        // Mock Registration Logic
        const newUser = {
            id: Math.floor(Math.random() * 1000),
            name: data.fullName,
            email: data.email,
            role: 'DONOR',
            province: data.province,
            district: data.district,
            nearestHospital: data.nearestHospital
        };
        setUser(newUser);
        localStorage.setItem('lifeline_user', JSON.stringify(newUser));
        return Promise.resolve(newUser);
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('lifeline_user');
    };

    const value = {
        user,
        login,
        register,
        logout,
        loading,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'ADMIN',
        isDoctor: user?.role === 'DOCTOR' || user?.role === 'HOSPITAL' || user?.role === 'ADMIN'
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
