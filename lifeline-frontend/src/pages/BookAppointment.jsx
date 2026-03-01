import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getCamps, registerForCamp } from '../services/api';

const BookAppointment = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        hospitalId: '1',
        date: '',
        time: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const [camp, setCamp] = useState(null);
    const [loadingCamp, setLoadingCamp] = useState(false);
    const [campError, setCampError] = useState(false);

    const campIdFromState = location.state?.campId || null;

    useEffect(() => {
        const loadCamp = async () => {
            if (!campIdFromState) return;
            setLoadingCamp(true);
            try {
                const res = await getCamps();
                const all = res.data || [];
                const found = all.find(c => Number(c.id) === Number(campIdFromState));
                if (found) {
                    setCamp(found);
                } else {
                    setCampError(true);
                }
            } catch (e) {
                console.error('Error loading camp details', e);
                setCampError(true);
            } finally {
                setLoadingCamp(false);
            }
        };
        loadCamp();
    }, [campIdFromState]);

    const getAvailableSlots = (c) => {
        const capacity = Number(c?.capacity || 0);
        const registrations = Array.isArray(c?.registrations) ? c.registrations.length : 0;
        if (!capacity) return null;
        const remaining = capacity - registrations;
        return remaining >= 0 ? { remaining, capacity } : { remaining: 0, capacity };
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            if (camp) {
                const slots = getAvailableSlots(camp);
                if (slots && slots.remaining === 0) {
                    alert('This camp is already fully booked.');
                    return;
                }
                await registerForCamp(camp.id, {
                    donorUserId: user?.id || 1,
                    donorName: user?.name || 'Unknown User'
                });
                alert('Your slot has been reserved for this camp!');
                navigate('/appointments');
            } else {
                const isoDateTime = new Date(`${formData.date}T${formData.time}`).toISOString();
                const response = await fetch('http://localhost:8080/api/appointments/book', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        donorId: user?.id || 1,
                        donorUserId: user?.id || 1,
                        donorName: user?.name || 'Unknown User',
                        hospitalId: parseInt(formData.hospitalId, 10),
                        date: isoDateTime
                    })
                });
                if (!response.ok) {
                    throw new Error('Failed to book appointment');
                }
                alert('Appointment scheduled successfully!');
                navigate('/donors');
            }
        } catch (error) {
            console.error(error);
            alert('Failed to book. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="container flex-center" style={{ minHeight: '80vh' }}>
            <div className="glass-panel animate-fade-in" style={{ padding: '2.5rem', width: '100%', maxWidth: '540px' }}>
                <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
                    {camp ? 'Reserve Camp Slot' : 'Schedule Donation'}
                </h2>

                {loadingCamp && (
                    <div style={{ marginBottom: '1rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                        Loading camp details...
                    </div>
                )}
                {campError && (
                    <div style={{ marginBottom: '1rem', color: '#B91C1C', textAlign: 'center' }}>
                        Unable to load camp details. You can still schedule a standard donation below.
                    </div>
                )}
                {camp && !campError && (
                    <div className="glass-panel" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
                        <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>{camp.name}</div>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                            📍 {camp.location}
                        </div>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                            📅 {camp.date} • ⏰ {camp.time || 'TBD'}
                        </div>
                        {Array.isArray(camp.requiredBloodTypes) && camp.requiredBloodTypes.length > 0 && (
                            <div style={{ fontSize: '0.9rem', color: 'var(--secondary)', marginBottom: '0.25rem' }}>
                                Needed types: {camp.requiredBloodTypes.join(', ')}
                            </div>
                        )}
                        {(() => {
                            const slots = getAvailableSlots(camp);
                            if (!slots) return null;
                            const full = slots.remaining === 0;
                            return (
                                <div style={{ fontSize: '0.9rem', color: full ? '#B91C1C' : 'var(--secondary)' }}>
                                    {full
                                        ? 'This camp is fully booked.'
                                        : `Available slots: ${slots.remaining} / ${slots.capacity}`}
                                </div>
                            );
                        })()}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    {!camp && (
                        <>
                            <div className="input-group">
                                <label className="input-label">Select Center</label>
                                <select
                                    className="input-field"
                                    value={formData.hospitalId}
                                    onChange={e => setFormData({ ...formData, hospitalId: e.target.value })}
                                >
                                    <option value="1">Colombo National Hospital</option>
                                    <option value="2">Kandy General Hospital</option>
                                    <option value="3">Galle Teaching Hospital</option>
                                </select>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="input-group">
                                    <label className="input-label">Date</label>
                                    <input
                                        type="date"
                                        className="input-field"
                                        required
                                        value={formData.date}
                                        onChange={e => setFormData({ ...formData, date: e.target.value })}
                                    />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Time</label>
                                    <input
                                        type="time"
                                        className="input-field"
                                        required
                                        value={formData.time}
                                        onChange={e => setFormData({ ...formData, time: e.target.value })}
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    {camp && (
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                            By confirming, you reserve a donation slot at this camp under your profile.
                        </p>
                    )}

                    <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
                        <button
                            type="button"
                            className="btn"
                            style={{ flex: 1, border: '1px solid #E2E8F0' }}
                            onClick={() => navigate(-1)}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            style={{ flex: 1 }}
                            disabled={submitting || (camp && (() => {
                                const slots = getAvailableSlots(camp);
                                return slots && slots.remaining === 0;
                            })())}
                        >
                            {submitting
                                ? 'Confirming...'
                                : camp
                                    ? 'Confirm Camp Reservation'
                                    : 'Confirm Booking'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default BookAppointment;
