import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { getCamps, checkInDonor } from '../services/api';

const statusStyles = {
    Scheduled: { background: '#E0F2FE', color: '#0C4A6E' },
    Approved: { background: '#DCFCE7', color: '#166534' },
    Completed: { background: '#F3E8FF', color: '#6B21A8' },
    Cancelled: { background: '#FEE2E2', color: '#991B1B' }
};

const Appointments = () => {
    const navigate = useNavigate();
    const { user, isAdmin, isDoctor } = useAuth();
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [updatingId, setUpdatingId] = useState(null);
    const [campRegistrations, setCampRegistrations] = useState([]);
    const [campLoading, setCampLoading] = useState(true);
    const [campError, setCampError] = useState(false);
    const [checkingInKey, setCheckingInKey] = useState(null);

    const fetchAppointments = () => {
        setLoading(true);
        const url = (isAdmin || isDoctor)
            ? 'http://localhost:8080/api/appointments'
            : `http://localhost:8080/api/appointments/donor/${user?.id || 1}`;
        axios.get(url)
            .then(res => {
                setAppointments(res.data || []);
                setLoading(false);
            })
            .catch(err => {
                console.error('Error fetching appointments', err);
                setError(true);
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchAppointments();
    }, [isAdmin, isDoctor, user?.id]);

    useEffect(() => {
        const loadCamps = async () => {
            setCampLoading(true);
            try {
                const res = await getCamps();
                const all = res.data || [];
                const uid = user?.id || 1;
                const rows = [];

                all.forEach(camp => {
                    const regs = Array.isArray(camp.registrations) ? camp.registrations : [];
                    regs.forEach(reg => {
                        const donorUserId = reg.donorUserId ?? reg.donorUserId === 0 ? reg.donorUserId : reg.donorUserId;
                        const isOwner = Number(donorUserId) === Number(uid);
                        if (isAdmin || isDoctor || isOwner) {
                            rows.push({
                                campId: camp.id,
                                campName: camp.name,
                                location: camp.location,
                                date: camp.date,
                                time: camp.time,
                                donorUserId,
                                donorName: reg.donorName,
                                checkedIn: !!reg.checkedIn
                            });
                        }
                    });
                });

                setCampRegistrations(rows);
                setCampError(false);
            } catch (e) {
                console.error('Error loading camp registrations', e);
                setCampError(true);
            } finally {
                setCampLoading(false);
            }
        };

        loadCamps();
    }, [isAdmin, isDoctor, user?.id]);

    const handleCancel = async (id) => {
        setUpdatingId(id);
        try {
            await axios.put(`http://localhost:8080/api/appointments/${id}/cancel`);
            fetchAppointments();
        } catch (error) {
            console.error(error);
            alert('Unable to cancel appointment.');
        } finally {
            setUpdatingId(null);
        }
    };

    const handleStatusUpdate = async (id, status) => {
        setUpdatingId(id);
        try {
            await axios.put(`http://localhost:8080/api/appointments/${id}/status`, { status });
            fetchAppointments();
        } catch (error) {
            console.error(error);
            alert('Unable to update status.');
        } finally {
            setUpdatingId(null);
        }
    };

    const handleCampCheckIn = async (campId, donorUserId) => {
        const key = `${campId}-${donorUserId}`;
        setCheckingInKey(key);
        try {
            await checkInDonor(campId, donorUserId);
            // refresh camp registrations
            const res = await getCamps();
            const all = res.data || [];
            const uid = user?.id || 1;
            const rows = [];
            all.forEach(camp => {
                const regs = Array.isArray(camp.registrations) ? camp.registrations : [];
                regs.forEach(reg => {
                    const regId = reg.donorUserId;
                    const isOwner = Number(regId) === Number(uid);
                    if (isAdmin || isDoctor || isOwner) {
                        rows.push({
                            campId: camp.id,
                            campName: camp.name,
                            location: camp.location,
                            date: camp.date,
                            time: camp.time,
                            donorUserId: regId,
                            donorName: reg.donorName,
                            checkedIn: !!reg.checkedIn
                        });
                    }
                });
            });
            setCampRegistrations(rows);
        } catch (e) {
            console.error(e);
            alert('Unable to check in donor.');
        } finally {
            setCheckingInKey(null);
        }
    };

    const sortedAppointments = useMemo(() => {
        return [...appointments].sort((a, b) => {
            const dateA = new Date(`${a.date}T${a.time || '00:00'}`).getTime();
            const dateB = new Date(`${b.date}T${b.time || '00:00'}`).getTime();
            return dateB - dateA;
        });
    }, [appointments]);

    return (
        <div className="container" style={{ padding: '2rem 1rem' }}>
            <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Scheduled Bookings</h1>
                    <p style={{ color: 'var(--text-muted)' }}>
                        {(isAdmin || isDoctor) ? 'Approve or finish donation appointments' : 'Manage your bookings'}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    {!isAdmin && !isDoctor && (
                        <button className="btn btn-primary" onClick={() => navigate('/appointments/book')}>
                            Book New
                        </button>
                    )}
                    <button className="btn" style={{ border: '1px solid #E2E8F0' }} onClick={() => navigate(-1)}>Back</button>
                </div>
            </header>

            <div className="glass-panel" style={{ padding: '1.5rem' }}>
                {loading && <div style={{ color: 'var(--text-muted)' }}>Loading appointments...</div>}
                {!loading && error && <div style={{ color: 'var(--text-muted)' }}>Unable to load appointments.</div>}
                {!loading && !error && sortedAppointments.length === 0 && (
                    <div style={{ color: 'var(--text-muted)' }}>No appointments found.</div>
                )}
                {!loading && !error && sortedAppointments.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {sortedAppointments.map(appt => {
                            const status = appt.status || 'Scheduled';
                            const style = statusStyles[status] || { background: '#E2E8F0', color: '#334155' };
                            return (
                                <div key={appt.id} className="glass-panel" style={{ padding: '1rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                                        <div>
                                            <div style={{ fontWeight: '600' }}>
                                                Appointment #{appt.id} • Hospital {appt.hospitalId}
                                            </div>
                                            {(isAdmin || isDoctor) && (
                                                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                                    Donor: {appt.donorName || 'Unknown'} • ID {appt.donorUserId || appt.donor?.id || 'N/A'}
                                                </div>
                                            )}
                                            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                                {appt.date} {appt.time || ''}
                                            </div>
                                        </div>
                                        <div style={{ padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '700', ...style }}>
                                            {status.toUpperCase()}
                                        </div>
                                    </div>

                                    <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                                        {!isAdmin && !isDoctor && status !== 'Cancelled' && status !== 'Completed' && (
                                            <button
                                                className="btn"
                                                style={{ border: '1px solid #FCA5A5', color: '#B91C1C' }}
                                                onClick={() => handleCancel(appt.id)}
                                                disabled={updatingId === appt.id}
                                            >
                                                {updatingId === appt.id ? 'Cancelling...' : 'Cancel Booking'}
                                            </button>
                                        )}
                                        {(isAdmin || isDoctor) && (
                                            <>
                                                <button
                                                    className="btn"
                                                    style={{ border: '1px solid #A7F3D0', color: '#065F46' }}
                                                    onClick={() => handleStatusUpdate(appt.id, 'Approved')}
                                                    disabled={updatingId === appt.id}
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    className="btn"
                                                    style={{ border: '1px solid #C4B5FD', color: '#5B21B6' }}
                                                    onClick={() => handleStatusUpdate(appt.id, 'Completed')}
                                                    disabled={updatingId === appt.id}
                                                >
                                                    Mark Finished
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
            <div className="glass-panel" style={{ padding: '1.5rem', marginTop: '1.5rem' }}>
                <h3 style={{ marginBottom: '1rem' }}>Camp Registrations</h3>
                {campLoading && <div style={{ color: 'var(--text-muted)' }}>Loading camp registrations...</div>}
                {!campLoading && campError && (
                    <div style={{ color: 'var(--text-muted)' }}>Unable to load camp registrations.</div>
                )}
                {!campLoading && !campError && campRegistrations.length === 0 && (
                    <div style={{ color: 'var(--text-muted)' }}>
                        {isAdmin || isDoctor ? 'No camp attendees found.' : 'You have no camp bookings yet.'}
                    </div>
                )}
                {!campLoading && !campError && campRegistrations.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {campRegistrations.map(reg => {
                            const key = `${reg.campId}-${reg.donorUserId}`;
                            const badgeStyle = reg.checkedIn
                                ? { background: '#DCFCE7', color: '#166534' }
                                : { background: '#FEF3C7', color: '#92400E' };
                            return (
                                <div key={key} className="glass-panel" style={{ padding: '0.75rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' }}>
                                        <div>
                                            <div style={{ fontWeight: 600 }}>
                                                {reg.campName} • {reg.location}
                                            </div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                                {reg.date} {reg.time || ''}
                                            </div>
                                            {(isAdmin || isDoctor) && (
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                    Donor: {reg.donorName || 'Unknown'} • ID {reg.donorUserId}
                                                </div>
                                            )}
                                        </div>
                                        <div style={{ padding: '0.15rem 0.6rem', borderRadius: '9999px', fontSize: '0.7rem', fontWeight: 700, ...badgeStyle }}>
                                            {reg.checkedIn ? 'CHECKED IN' : 'REGISTERED'}
                                        </div>
                                    </div>
                                    {(isAdmin || isDoctor) && !reg.checkedIn && (
                                        <div style={{ marginTop: '0.5rem' }}>
                                            <button
                                                className="btn"
                                                style={{ border: '1px solid #BBF7D0', color: '#166534', fontSize: '0.8rem', padding: '0.25rem 0.75rem' }}
                                                onClick={() => handleCampCheckIn(reg.campId, reg.donorUserId)}
                                                disabled={checkingInKey === key}
                                            >
                                                {checkingInKey === key ? 'Checking in...' : 'Check In'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Appointments;
