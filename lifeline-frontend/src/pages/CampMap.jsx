import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getCamps, createCamp } from '../services/api';

const CampMap = () => {
    const navigate = useNavigate();
    const { isAdmin } = useAuth();
    const [camps, setCamps] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [newCamp, setNewCamp] = useState({
        name: '',
        location: '',
        date: '',
        time: '',
        capacity: '',
        requiredBloodTypes: ''
    });
    const [formErrors, setFormErrors] = useState({});
    const [selectedCamp, setSelectedCamp] = useState(null);
    const [submittingCamp, setSubmittingCamp] = useState(false);
    const [filterDate, setFilterDate] = useState('');
    const [filterLocation, setFilterLocation] = useState('');

    const fetchCamps = async () => {
        setLoading(true);
        try {
            const res = await getCamps();
            setCamps(res.data || []);
        } catch (err) {
            console.error('Error fetching camps', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCamps();
    }, []);

    const validateCampForm = () => {
        const errors = {};
        if (!newCamp.name.trim()) errors.name = 'Camp name is required';
        if (!newCamp.location.trim()) errors.location = 'Location is required';
        if (!newCamp.date) errors.date = 'Date is required';
        if (!newCamp.time) errors.time = 'Time is required';

        if (!newCamp.capacity) {
            errors.capacity = 'Capacity is required';
        } else {
            const cap = Number(newCamp.capacity);
            if (!Number.isFinite(cap) || cap <= 0) {
                errors.capacity = 'Capacity must be a positive number';
            }
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleCreateCamp = async (e) => {
        e.preventDefault();
        if (!validateCampForm()) return;
        setSubmittingCamp(true);
        try {
            const requiredBloodTypes = newCamp.requiredBloodTypes
                .split(',')
                .map(v => v.trim())
                .filter(Boolean);

            await createCamp({
                name: newCamp.name.trim(),
                location: newCamp.location.trim(),
                date: newCamp.date,
                time: newCamp.time,
                capacity: Number(newCamp.capacity),
                requiredBloodTypes
            });
            setShowModal(false);
            setNewCamp({
                name: '',
                location: '',
                date: '',
                time: '',
                capacity: '',
                requiredBloodTypes: ''
            });
            setFormErrors({});
            fetchCamps();
            alert('Camp created successfully!');
        } catch (error) {
            console.error(error);
            alert('Failed to create camp. Please try again.');
        } finally {
            setSubmittingCamp(false);
        }
    };

    const todayIso = new Date().toISOString().split('T')[0];

    const filteredCamps = useMemo(() => {
        const upcoming = camps.filter(c => {
            if (!c.date) return true;
            return c.date >= todayIso;
        });

        return upcoming.filter(camp => {
            if (filterDate && camp.date !== filterDate) return false;
            if (filterLocation) {
                const query = filterLocation.toLowerCase();
                const name = (camp.name || '').toLowerCase();
                const location = (camp.location || '').toLowerCase();
                if (!name.includes(query) && !location.includes(query)) return false;
            }
            return true;
        });
    }, [camps, filterDate, filterLocation, todayIso]);

    const getAvailableSlots = (camp) => {
        const capacity = Number(camp.capacity || 0);
        const registrations = Array.isArray(camp.registrations) ? camp.registrations.length : 0;
        if (!capacity) return null;
        const remaining = capacity - registrations;
        return remaining >= 0 ? { remaining, capacity } : { remaining: 0, capacity };
    };

    return (
        <div className="container" style={{ padding: '2rem 1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Donation Camps</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Find a donation event near you</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    {isAdmin && (
                        <button
                            className="btn btn-primary"
                            onClick={() => setShowModal(true)}
                        >
                            + Add New Camp
                        </button>
                    )}
                    <button className="btn" style={{ border: '1px solid #E2E8F0' }} onClick={() => navigate(-1)}>Back</button>
                </div>
            </div>

            <motion.div
                className="glass-panel"
                style={{ padding: '1rem', marginBottom: '1.5rem', borderRadius: '1rem' }}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
            >
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                    <div className="input-group" style={{ minWidth: '200px' }}>
                        <label className="input-label">Filter by Date</label>
                        <input
                            type="date"
                            className="input-field"
                            value={filterDate}
                            onChange={e => setFilterDate(e.target.value)}
                        />
                    </div>
                    <div className="input-group" style={{ minWidth: '220px' }}>
                        <label className="input-label">Filter by Location or Name</label>
                        <input
                            className="input-field"
                            placeholder="e.g. Colombo, Kandy..."
                            value={filterLocation}
                            onChange={e => setFilterLocation(e.target.value)}
                        />
                    </div>
                </div>
            </motion.div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                {loading && filteredCamps.length === 0 && (
                    <>
                        {[1, 2].map(i => (
                            <div key={i} className="glass-panel" style={{ padding: '1.75rem', borderRadius: '1.25rem', opacity: 0.7 }}>
                                <div style={{ height: '10px', width: '40%', background: '#E5E7EB', borderRadius: '999px', marginBottom: '1rem' }} />
                                <div style={{ height: '8px', width: '70%', background: '#E5E7EB', borderRadius: '999px', marginBottom: '0.75rem' }} />
                                <div style={{ height: '8px', width: '55%', background: '#E5E7EB', borderRadius: '999px', marginBottom: '0.75rem' }} />
                                <div style={{ height: '36px', width: '40%', background: '#E5E7EB', borderRadius: '999px', marginTop: '1.25rem' }} />
                            </div>
                        ))}
                    </>
                )}
                {filteredCamps.map(camp => {
                    const slots = getAvailableSlots(camp);
                    const isFull = slots && slots.remaining === 0;
                    return (
                    <motion.div
                        key={camp.id}
                        className="glass-panel"
                        style={{ padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column', borderRadius: '1.25rem' }}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.22 }}
                        whileHover={{ y: -4 }}
                    >
                        <div style={{ height: '8px', width: '100%', background: 'linear-gradient(90deg, var(--primary) 0%, var(--accent) 100%)' }} />
                        <div style={{ padding: '1.85rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                                <h3 style={{ fontSize: '1.25rem' }}>{camp.name}</h3>
                                <div style={{
                                    padding: '0.25rem 0.75rem',
                                    background: '#F1F5F9',
                                    borderRadius: '9999px',
                                    fontSize: '0.75rem',
                                    fontWeight: '600',
                                    color: 'var(--secondary)'
                                }}>
                                    UPCOMING
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem', color: 'var(--text-muted)' }}>
                                <span>📍</span>
                                <span>{camp.location}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem', color: 'var(--text-muted)' }}>
                                <span>📅</span>
                                <span>{new Date(camp.date).toLocaleDateString()}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem', color: 'var(--text-muted)' }}>
                                <span>⏰</span>
                                <span>{camp.time || 'TBD'}</span>
                            </div>
                            {Array.isArray(camp.requiredBloodTypes) && camp.requiredBloodTypes.length > 0 && (
                                <div style={{ marginBottom: '0.75rem', fontSize: '0.85rem', color: 'var(--secondary)' }}>
                                    Needed types: {camp.requiredBloodTypes.join(', ')}
                                </div>
                            )}
                            {slots && (
                                <div style={{ marginBottom: '1rem', fontSize: '0.875rem', color: isFull ? '#B91C1C' : 'var(--secondary)' }}>
                                    {isFull
                                        ? 'No slots available'
                                        : `Available slots: ${slots.remaining} / ${slots.capacity}`}
                                </div>
                            )}

                            <div style={{ marginTop: 'auto' }}>
                                <button className="btn" style={{
                                    width: '100%',
                                    background: isFull ? '#F1F5F9' : '#FFF1F2',
                                    color: isFull ? '#6B7280' : 'var(--primary)',
                                    fontWeight: '600',
                                    cursor: isFull ? 'not-allowed' : 'pointer',
                                    opacity: isFull ? 0.8 : 1
                                }} onClick={() => !isFull && setSelectedCamp(camp)} disabled={isFull}>
                                    View Details
                                </button>
                            </div>
                        </div>
                    </motion.div>
                );})}

                {filteredCamps.length === 0 && !loading && (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                        No camps found at the moment.
                    </div>
                )}
            </div>

            {/* Admin Add Camp Modal */}
            {showModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div className="glass-panel" style={{ background: 'white', padding: '2rem', width: '100%', maxWidth: '500px' }}>
                        <h2 style={{ marginBottom: '1.5rem' }}>Add New Donation Camp</h2>
                        <form onSubmit={handleCreateCamp}>
                            <div className="input-group">
                                <label className="input-label">Camp Name</label>
                                <input
                                    className="input-field"
                                    required
                                    value={newCamp.name}
                                    onChange={e => setNewCamp({ ...newCamp, name: e.target.value })}
                                />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Location</label>
                                <input
                                    className="input-field"
                                    required
                                    value={newCamp.location}
                                    onChange={e => setNewCamp({ ...newCamp, location: e.target.value })}
                                />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Date</label>
                                <input
                                    type="date"
                                    className="input-field"
                                    required
                                    value={newCamp.date}
                                    onChange={e => setNewCamp({ ...newCamp, date: e.target.value })}
                                />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Time</label>
                                <input
                                    type="time"
                                    className="input-field"
                                    required
                                    value={newCamp.time}
                                    onChange={e => setNewCamp({ ...newCamp, time: e.target.value })}
                                />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Capacity</label>
                                <input
                                    type="number"
                                    className="input-field"
                                    min={1}
                                    required
                                    value={newCamp.capacity}
                                    onChange={e => setNewCamp({ ...newCamp, capacity: e.target.value })}
                                />
                                {formErrors.capacity && (
                                    <div style={{ color: '#B91C1C', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                                        {formErrors.capacity}
                                    </div>
                                )}
                            </div>
                            <div className="input-group">
                                <label className="input-label">Required Blood Types</label>
                                <input
                                    className="input-field"
                                    placeholder="e.g. O+, A+, B- (comma separated)"
                                    value={newCamp.requiredBloodTypes}
                                    onChange={e => setNewCamp({ ...newCamp, requiredBloodTypes: e.target.value })}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                                <button type="button" className="btn" onClick={() => setShowModal(false)} style={{ flex: 1, border: '1px solid #E2E8F0' }}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={submittingCamp}>
                                    {submittingCamp ? 'Creating...' : 'Create Camp'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {selectedCamp && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div className="glass-panel" style={{ background: 'white', padding: '2rem', width: '100%', maxWidth: '520px' }}>
                        <h2 style={{ marginBottom: '1rem' }}>{selectedCamp.name}</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem', color: 'var(--secondary)' }}>
                            <div>📍 {selectedCamp.location}</div>
                            <div>📅 {new Date(selectedCamp.date).toLocaleDateString()}</div>
                            <div>⏰ {selectedCamp.time || 'TBD'}</div>
                            {Array.isArray(selectedCamp.requiredBloodTypes) && selectedCamp.requiredBloodTypes.length > 0 && (
                                <div>Needed types: {selectedCamp.requiredBloodTypes.join(', ')}</div>
                            )}
                            {(() => {
                                const slots = getAvailableSlots(selectedCamp);
                                if (!slots) return null;
                                const full = slots.remaining === 0;
                                return (
                                    <div style={{ color: full ? '#B91C1C' : 'var(--secondary)', fontSize: '0.9rem' }}>
                                        {full
                                            ? 'This camp is fully booked.'
                                            : `Available slots: ${slots.remaining} / ${slots.capacity}`}
                                    </div>
                                );
                            })()}
                            <a
                                href={
                                    selectedCamp.lat && selectedCamp.lng
                                        ? `https://www.google.com/maps?q=${selectedCamp.lat},${selectedCamp.lng}`
                                        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedCamp.location)}`
                                }
                                target="_blank"
                                rel="noreferrer"
                                style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: '600' }}
                            >
                                Open in Google Maps
                            </a>
                            {isAdmin && (
                                <div style={{ fontSize: '0.875rem' }}>Interested: {selectedCamp.interestCount || 0}</div>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button type="button" className="btn" onClick={() => setSelectedCamp(null)} style={{ flex: 1, border: '1px solid #E2E8F0' }}>
                                Close
                            </button>
                            {!isAdmin && (
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    style={{ flex: 1 }}
                                    onClick={() => {
                                        const slots = getAvailableSlots(selectedCamp);
                                        if (slots && slots.remaining === 0) {
                                            return;
                                        }
                                        navigate('/appointments/book', { state: { campId: selectedCamp.id } });
                                    }}
                                >
                                    Reserve Slot
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CampMap;
