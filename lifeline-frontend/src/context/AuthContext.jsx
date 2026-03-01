import React, { createContext, useState, useContext, useEffect } from 'react';

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

    const login = (email, password) => {
        // Mock Login Logic based on email domain/pattern
        let userData = null;

        if (email.includes('admin')) {
            userData = { id: 1, name: 'System Administrator', email, role: 'ADMIN' };
        } else if (email.includes('doctor')) {
            userData = { id: 2, name: 'Dr. Sarah Smith', email, role: 'DOCTOR' };
        } else {
            userData = { id: 101, name: 'John Doe', email, role: 'USER' };
        }

        setUser(userData);
        localStorage.setItem('lifeline_user', JSON.stringify(userData));
        return Promise.resolve(userData);
    };

    const register = (data) => {
        // Mock Registration Logic
        const newUser = {
            id: Math.floor(Math.random() * 1000),
            name: data.fullName,
            email: data.email,
            role: 'USER',
            location: data.location
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
        isDoctor: user?.role === 'DOCTOR' || user?.role === 'ADMIN'
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
