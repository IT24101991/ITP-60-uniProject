import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const EmergencyRequests = () => {
    const navigate = useNavigate();
    const [request, setRequest] = useState({
        bloodType: 'A+',
        units: 1,
        hospital: 'Colombo National Hospital',
        urgency: 'CRITICAL'
    });
    const [status, setStatus] = useState('idle'); // idle, sending, success, error

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('sending');
        try {
            await axios.post('http://localhost:8080/api/emergency/request', {
                bloodType: request.bloodType,
                units: request.units,
                hospital: request.hospital,
                urgency: request.urgency
            });
            setStatus('success');
        } catch (error) {
            console.error(error);
            setStatus('error');
        }
    };

    if (status === 'success') {
        return (
            <div className="container flex-center" style={{ minHeight: '80vh' }}>
                <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', maxWidth: '500px' }}>
                    <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🚑</div>
                    <h2 style={{ color: 'var(--primary)', marginBottom: '1rem' }}>Emergency Broadcast Sent!</h2>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
                        All nearby donors with blood type {request.bloodType} have been notified via SMS and App Notification.
                    </p>
                    <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>Return to Dashboard</button>
                </div>
            </div>
        );
    }

    return (
        <div className="container flex-center" style={{ minHeight: '80vh' }}>
            <div className="glass-panel animate-fade-in" style={{ padding: '2.5rem', width: '100%', maxWidth: '600px', borderLeft: '4px solid var(--primary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#FECDD3', color: '#BE123C', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>📢</div>
                    <div>
                        <h2 style={{ fontSize: '1.5rem', color: '#BE123C' }}>Emergency Blood Request</h2>
                        <p style={{ color: 'var(--text-muted)' }}>Broadcast urgent need to local donor network</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                        <div className="input-group">
                            <label className="input-label">Blood Type Needed</label>
                            <select
                                className="input-field"
                                value={request.bloodType}
                                onChange={e => setRequest({ ...request, bloodType: e.target.value })}
                            >
                                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(type => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                        </div>
                        <div className="input-group">
                            <label className="input-label">Units Required</label>
                            <input
                                type="number"
                                min="1"
                                max="20"
                                className="input-field"
                                value={request.units}
                                onChange={e => setRequest({ ...request, units: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label className="input-label">Medical Center</label>
                        <input
                            type="text"
                            className="input-field"
                            value={request.hospital}
                            readOnly
                            style={{ background: '#F1F5F9' }}
                        />
                    </div>

                    <div style={{ padding: '1rem', background: '#FFF1F2', borderRadius: 'var(--radius-md)', marginBottom: '2rem' }}>
                        <p style={{ color: '#BE123C', fontSize: '0.875rem', fontWeight: '500' }}>
                            ⚠️ This will trigger immediate alerts to verified donors. Only use for critical shortages or mass casualty events.
                        </p>
                    </div>

                    <button
                        type="submit"
                        className="btn"
                        style={{ width: '100%', background: '#BE123C', color: 'white', fontWeight: 'bold', padding: '1rem' }}
                        disabled={status === 'sending'}
                    >
                        {status === 'sending' ? 'Broadcasting...' : 'BROADCAST ALERT'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default EmergencyRequests;
