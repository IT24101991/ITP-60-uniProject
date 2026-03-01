import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DonorEligibility from './DonorEligibility';

const Register = () => {
    const navigate = useNavigate();
    const { register } = useAuth();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        bloodType: '',
        location: 'Colombo',
        isEligible: false
    });

    const handleInfoSubmit = (e) => {
        e.preventDefault();
        setStep(2);
    };

    const handleEligibilityComplete = (isEligible, healthData) => {
        // We capture health data here if needed for backend
        if (isEligible) {
            setFormData(prev => ({ ...prev, isEligible: true }));
            // Add a small delay for UX
            setTimeout(() => setStep(3), 800);
        } else {
            // If not eligible, maybe warn them but let them register as user anyway? 
            // Requirement says "ask eligibility", usually if not eligible, they can't donate but can have account.
            // We'll proceed but mark as ineligible for donation.
            setFormData(prev => ({ ...prev, isEligible: false }));
            setTimeout(() => setStep(3), 1500);
        }
    };

    const handleFinalSubmit = async (e) => {
        e.preventDefault();
        try {
            await register(formData);
            navigate('/dashboard');
        } catch (error) {
            alert('Registration failed');
        }
    };

    return (
        <div className="container flex-center" style={{ minHeight: '100vh', padding: '2rem 0' }}>
            <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '600px', padding: '2.5rem' }}>
                <header style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Join LifeLine</h1>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1rem' }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: step >= 1 ? 'var(--primary)' : '#E2E8F0' }}></div>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: step >= 2 ? 'var(--primary)' : '#E2E8F0' }}></div>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: step >= 3 ? 'var(--primary)' : '#E2E8F0' }}></div>
                    </div>
                </header>

                {step === 1 && (
                    <form onSubmit={handleInfoSubmit}>
                        <h2 style={{ marginBottom: '1.5rem' }}>Personal Information</h2>
                        <div className="input-group">
                            <label className="input-label">User Name</label>
                            <input
                                className="input-field"
                                required
                                value={formData.fullName}
                                onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                            />
                        </div>
                        <div className="input-group">
                            <label className="input-label">Email</label>
                            <input
                                type="email"
                                className="input-field"
                                required
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                        <div className="input-group">
                            <label className="input-label">Password</label>
                            <input
                                type="password"
                                className="input-field"
                                required
                                value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                            />
                        </div>

                        <div className="input-group">
                            <label className="input-label">Blood Type (Optional)</label>
                            <select
                                className="input-field"
                                value={formData.bloodType}
                                onChange={e => setFormData({ ...formData, bloodType: e.target.value })}
                            >
                                <option value="">Unknown</option>
                                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(type => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                        </div>

                        <button className="btn btn-primary" style={{ width: '100%' }}>Next: Check Eligibility</button>
                    </form>
                )}

                {step === 2 && (
                    <div>
                        <DonorEligibility onComplete={handleEligibilityComplete} />
                    </div>
                )}

                {step === 3 && (
                    <form onSubmit={handleFinalSubmit}>
                        <h2 style={{ marginBottom: '1.5rem' }}>Final Step: Location</h2>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                            We need your location to find the nearest hospital in case of emergency or donation camps.
                        </p>

                        <div className="input-group">
                            <label className="input-label">Nearest City / Hospital</label>
                            <select
                                className="input-field"
                                required
                                value={formData.location}
                                onChange={e => setFormData({ ...formData, location: e.target.value })}
                            >
                                <option value="Colombo">Colombo (National Hospital)</option>
                                <option value="Kandy">Kandy (General Hospital)</option>
                                <option value="Galle">Galle (Teaching Hospital)</option>
                                <option value="Jaffna">Jaffna (General Hospital)</option>
                            </select>
                        </div>

                        <button className="btn btn-primary" style={{ width: '100%' }}>Create Account</button>
                    </form>
                )}

                <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.875rem' }}>
                    Already have an account? <Link to="/" style={{ color: 'var(--primary)', fontWeight: '600', textDecoration: 'none' }}>Login</Link>
                </div>
            </div>
        </div>
    );
};

export default Register;
