import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DonorEligibility from './DonorEligibility';
import {
    PROVINCES,
    getDefaultLocationSelection,
    getDistrictsByProvince,
    getHospitalsByProvinceAndDistrict
} from '../constants/locationData';

const Register = () => {
    const navigate = useNavigate();
    const { register } = useAuth();
    const defaults = getDefaultLocationSelection();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        bloodType: '',
        province: defaults.province,
        district: defaults.district,
        nearestHospital: defaults.nearestHospital,
        isEligible: false
    });

    const provinces = PROVINCES;
    const districts = getDistrictsByProvince(formData.province);
    const hospitals = getHospitalsByProvinceAndDistrict(formData.province, formData.district);

    const handleInfoSubmit = (e) => {
        e.preventDefault();
        setStep(2);
    };

    const handleEligibilityComplete = (isEligible, healthData) => {
        // We capture health data here if needed for backend
        if (isEligible) {
            setFormData(prev => ({ 
                ...prev, 
                isEligible: true,
                bloodType: healthData?.bloodType || prev.bloodType 
            }));
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
                            <label className="input-label">Province</label>
                            <select
                                className="input-field"
                                required
                                value={formData.province}
                                onChange={e => {
                                    const province = e.target.value;
                                    const firstDistrict = getDistrictsByProvince(province)[0];
                                    const firstHospital = getHospitalsByProvinceAndDistrict(province, firstDistrict)[0];
                                    setFormData({
                                        ...formData,
                                        province,
                                        district: firstDistrict,
                                        nearestHospital: firstHospital
                                    });
                                }}
                            >
                                {provinces.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>

                        <div className="input-group">
                            <label className="input-label">District</label>
                            <select
                                className="input-field"
                                required
                                value={formData.district}
                                onChange={e => {
                                    const district = e.target.value;
                                    const firstHospital = getHospitalsByProvinceAndDistrict(formData.province, district)[0];
                                    setFormData({ ...formData, district, nearestHospital: firstHospital });
                                }}
                            >
                                {districts.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>

                        <div className="input-group">
                            <label className="input-label">Nearest Hospital</label>
                            <select
                                className="input-field"
                                required
                                value={formData.nearestHospital}
                                onChange={e => setFormData({ ...formData, nearestHospital: e.target.value })}
                            >
                                {hospitals.map(h => <option key={h} value={h}>{h}</option>)}
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
