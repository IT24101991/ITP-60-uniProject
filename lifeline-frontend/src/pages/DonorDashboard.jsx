import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const DonorDashboard = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [eligibility, setEligibility] = useState(null);
    const [donorId] = useState(user?.id || 1);
    const [appointments, setAppointments] = useState([]);

    // Check Eligibility on Load
    useEffect(() => {
        axios.get(`http://localhost:8080/api/donors/${donorId}/eligibility`)
            .then(res => setEligibility(res.data))
            .catch(err => {
                console.error("Error checking eligibility", err);
                // Mock for demo
                setEligibility(true);
            });
    }, [donorId]);

    useEffect(() => {
        axios.get(`http://localhost:8080/api/appointments/donor/${donorId}`)
            .then(res => setAppointments(res.data || []))
            .catch(err => {
                console.error("Error fetching appointments", err);
                setAppointments([]);
            });
    }, [donorId]);

    const completedCount = appointments.filter(a => (a.status || '').toLowerCase() === 'completed').length;
    const totalVolume = completedCount * 0.5;

    return (
        <div className="container" style={{ padding: '2rem 1rem' }}>
            <header style={{ marginBottom: '3rem' }}>
                <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Donor Portal</h1>
                <p style={{ color: 'var(--text-muted)' }}>Welcome back, Hero.</p>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>

                {/* Eligibility Status Card */}
                <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span>🩸</span> Donation Status
                    </h2>

                    {eligibility === null ? (
                        <div style={{ color: 'var(--text-muted)' }}>Checking eligibility...</div>
                    ) : (
                        <div style={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            textAlign: 'center',
                            gap: '1rem'
                        }}>
                            <div style={{
                                width: '80px',
                                height: '80px',
                                borderRadius: '50%',
                                background: eligibility ? '#ECFDF5' : '#FEF2F2',
                                color: eligibility ? '#059669' : '#DC2626',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '2rem'
                            }}>
                                {eligibility ? '✓' : '✕'}
                            </div>
                            <div>
                                <h3 style={{ fontSize: '1.5rem', color: eligibility ? '#059669' : '#DC2626', marginBottom: '0.5rem' }}>
                                    {eligibility ? 'You are Eligible!' : 'Not Eligible Yet'}
                                </h3>
                                <p style={{ color: 'var(--text-muted)' }}>
                                    {eligibility
                                        ? 'Your last donation was sufficient time ago. You can save a life today.'
                                        : 'Please wait a few more days before your next donation for your safety.'}
                                </p>
                            </div>

                            {eligibility && (
                                <button
                                    className="btn btn-primary"
                                    style={{ marginTop: '1rem', width: '100%' }}
                                    onClick={() => navigate('/appointments/book')}
                                >
                                    Book Appointment Now
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* History / Quick Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="glass-panel" style={{ padding: '2rem' }}>
                        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Your Impact</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div style={{ background: 'rgba(255,255,255,0.5)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                                <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--primary)' }}>{completedCount}</div>
                                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Lives Saved</div>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.5)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                                <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--accent)' }}>{totalVolume.toFixed(1)}L</div>
                                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Volume Donated</div>
                            </div>
                        </div>
                    </div>

                    <div className="glass-panel" style={{ padding: '2rem' }}>
                        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Next Camp Nearby</h2>
                        <div style={{ marginBottom: '1rem' }}>
                            <div style={{ fontWeight: '600' }}>City Centre Drive</div>
                            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Tomorrow • 9:00 AM</div>
                        </div>
                        <button
                            className="btn"
                            style={{ width: '100%', border: '1px solid var(--primary)', color: 'var(--primary)' }}
                            onClick={() => navigate('/camps')}
                        >
                            View All Camps
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DonorDashboard;
