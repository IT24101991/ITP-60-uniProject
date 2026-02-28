import React, { useMemo, useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const InventoryDashboard = () => {
    const { isAdmin, isDoctor } = useAuth();
    const canDispatchEmergency = isAdmin || isDoctor;

    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);

    const [requests, setRequests] = useState([]);
    const [requestLoadError, setRequestLoadError] = useState('');
    const [sendingForRequest, setSendingForRequest] = useState({});
    const [dispatchLoading, setDispatchLoading] = useState(null);

    const fetchInventory = () => {
        setLoading(true);
        axios.get('http://localhost:8080/api/inventory')
            .then(res => {
                const all = res.data || [];
                // Lab-pending bags should stay in Lab Dashboard, not inventory stock table.
                setInventory(all.filter(item => (item.testStatus || '').toUpperCase() !== 'PENDING'));
                setLoading(false);
            })
            .catch(err => {
                console.error('Error fetching inventory', err);
                setLoading(false);
                setInventory([]);
            });
    };

    const mapDefaults = (data) => {
        const defaults = {};
        data.filter(r => (r.status || '').toUpperCase() !== 'FULFILLED').forEach(r => {
            const remaining = Math.max(0, (r.unitsRequested || 0) - (r.unitsFulfilled || 0));
            defaults[r.id] = String(Math.max(1, remaining));
        });
        setSendingForRequest(defaults);
    };

    const fetchEmergencyRequests = () => {
        if (!canDispatchEmergency) return;
        setRequestLoadError('');

        axios.get('http://localhost:8080/api/emergency/requests/all')
            .then(res => {
                const data = res.data || [];
                setRequests(data);
                mapDefaults(data);
            })
            .catch(err => {
                // Backward compatibility if backend wasn't restarted yet.
                if (err?.response?.status === 404) {
                    axios.get('http://localhost:8080/api/emergency/requests')
                        .then(res => {
                            const data = (res.data || []).map(r => ({ ...r, status: r.status || 'OPEN' }));
                            setRequests(data);
                            mapDefaults(data);
                        })
                        .catch(innerErr => {
                            console.error('Error fetching fallback emergency requests', innerErr);
                            setRequests([]);
                            setRequestLoadError('Unable to load emergency requests. Restart backend and try again.');
                        });
                } else {
                    console.error('Error fetching emergency requests', err);
                    setRequests([]);
                    setRequestLoadError('Unable to load emergency requests.');
                }
            });
    };

    useEffect(() => {
        fetchInventory();
        fetchEmergencyRequests();
    }, [canDispatchEmergency]);

    const getStatusStyle = (status, safetyFlag) => {
        if (safetyFlag === 'BIO-HAZARD' || status === 'DISCARD') {
            return { background: '#FECDD3', color: '#9F1239', border: '1px solid #FDA4AF' };
        }
        if (safetyFlag === 'SAFE' || status === 'AVAILABLE' || status === 'SAFE') {
            return { background: '#D1FAE5', color: '#065F46', border: '1px solid #6EE7B7' };
        }
        return { background: '#FEF3C7', color: '#92400E', border: '1px solid #FCD34D' };
    };

    const handleSendEmergency = async (requestId) => {
        const units = parseInt(sendingForRequest[requestId] || '0', 10);
        if (!units || units <= 0) {
            alert('Enter units to send.');
            return;
        }

        setDispatchLoading(requestId);
        try {
            await axios.put(`http://localhost:8080/api/emergency/requests/${requestId}/fulfill`, { units });
            fetchEmergencyRequests();
            fetchInventory();
        } catch (err) {
            console.error(err);
            alert(typeof err?.response?.data === 'string' ? err.response.data : 'Failed to dispatch blood.');
        } finally {
            setDispatchLoading(null);
        }
    };

    const bloodAnalytics = useMemo(() => {
        const data = {};
        inventory.forEach(item => {
            const status = String(item.status || '').toUpperCase();
            const safety = String(item.safetyFlag || '').toUpperCase();
            const isUsable = safety === 'SAFE' || status === 'SAFE' || status === 'AVAILABLE';
            if (!isUsable) return;
            const type = item.bloodType || 'Unknown';
            const qty = Number(item.quantity || 0);
            data[type] = (data[type] || 0) + qty;
        });
        return Object.entries(data)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([bloodType, units]) => ({ bloodType, units }));
    }, [inventory]);

    const activeRequests = requests.filter(r => (r.status || '').toUpperCase() !== 'FULFILLED');
    const fulfilledRequests = requests.filter(r => (r.status || '').toUpperCase() === 'FULFILLED');

    return (
        <div className="container" style={{ padding: '2rem 1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Inventory Management</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Real-time blood stock monitoring</p>
                </div>
                <button className="btn btn-primary" onClick={() => { fetchInventory(); fetchEmergencyRequests(); }}>
                    Refresh Data
                </button>
            </div>

            {isAdmin && (
                <div className="glass-panel" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Inventory Analytics (Admin)</h2>
                    {bloodAnalytics.length === 0 ? (
                        <div style={{ color: 'var(--text-muted)' }}>No usable blood units available.</div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.75rem' }}>
                            {bloodAnalytics.map(item => (
                                <div key={item.bloodType} className="glass-panel" style={{ padding: '0.75rem' }}>
                                    <div style={{ fontWeight: '700', fontSize: '1.1rem' }}>{item.bloodType}</div>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{item.units} units</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {canDispatchEmergency && (
                <div className="glass-panel" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Emergency Dispatch (Admin)</h2>
                    {requestLoadError && <div style={{ color: '#B91C1C', marginBottom: '0.75rem' }}>{requestLoadError}</div>}
                    {requests.length === 0 && <div style={{ color: 'var(--text-muted)' }}>No emergency requests found.</div>}

                    {requests.length > 0 && (
                        <div style={{ display: 'grid', gap: '1rem' }}>
                            <div>
                                <h3 style={{ marginBottom: '0.5rem', fontSize: '1rem' }}>Critical / Active</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {activeRequests.map(req => {
                                        const remaining = Math.max(0, (req.unitsRequested || 0) - (req.unitsFulfilled || 0));
                                        return (
                                            <div key={req.id} className="glass-panel" style={{ padding: '0.9rem' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                                                    <div style={{ fontWeight: '600' }}>#{req.id} • {req.hospital} • {req.bloodType} • {req.urgency}</div>
                                                    <div style={{
                                                        fontSize: '0.75rem',
                                                        fontWeight: '700',
                                                        padding: '0.2rem 0.6rem',
                                                        borderRadius: '9999px',
                                                        background: (req.status || '').toUpperCase() === 'PARTIAL' ? '#FEF3C7' : '#FEE2E2',
                                                        color: (req.status || '').toUpperCase() === 'PARTIAL' ? '#92400E' : '#991B1B'
                                                    }}>
                                                        {(req.status || 'OPEN').toUpperCase()}
                                                    </div>
                                                </div>
                                                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '0.25rem 0 0.6rem' }}>
                                                    Requested: {req.unitsRequested} • Fulfilled: {req.unitsFulfilled} • Remaining: {remaining}
                                                </div>
                                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        max={Math.max(1, remaining)}
                                                        className="input-field"
                                                        style={{ maxWidth: '120px' }}
                                                        value={sendingForRequest[req.id] || ''}
                                                        onChange={e => setSendingForRequest(prev => ({ ...prev, [req.id]: e.target.value }))}
                                                    />
                                                    <button
                                                        className="btn btn-primary"
                                                        onClick={() => handleSendEmergency(req.id)}
                                                        disabled={dispatchLoading === req.id}
                                                    >
                                                        {dispatchLoading === req.id ? 'Sending...' : 'Mark Sent'}
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {activeRequests.length === 0 && <div style={{ color: 'var(--text-muted)' }}>No active critical requests.</div>}
                                </div>
                            </div>

                            <div>
                                <h3 style={{ marginBottom: '0.5rem', fontSize: '1rem' }}>Fulfilled Orders</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {fulfilledRequests.map(req => (
                                        <div key={req.id} className="glass-panel" style={{ padding: '0.9rem', background: '#F0FDF4' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                                                <div style={{ fontWeight: '600' }}>#{req.id} • {req.hospital} • {req.bloodType} • {req.urgency}</div>
                                                <div style={{
                                                    fontSize: '0.75rem',
                                                    fontWeight: '700',
                                                    padding: '0.2rem 0.6rem',
                                                    borderRadius: '9999px',
                                                    background: '#DCFCE7',
                                                    color: '#166534'
                                                }}>
                                                    ORDER FULFILLED
                                                </div>
                                            </div>
                                            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                                Requested: {req.unitsRequested} • Fulfilled: {req.unitsFulfilled}
                                            </div>
                                        </div>
                                    ))}
                                    {fulfilledRequests.length === 0 && <div style={{ color: 'var(--text-muted)' }}>No fulfilled orders yet.</div>}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ background: 'rgba(0,0,0,0.02)', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                            <th style={{ padding: '1.25rem 1.5rem', fontWeight: '600', color: 'var(--secondary)' }}>ID</th>
                            <th style={{ padding: '1.25rem 1.5rem', fontWeight: '600', color: 'var(--secondary)' }}>Blood Type</th>
                            <th style={{ padding: '1.25rem 1.5rem', fontWeight: '600', color: 'var(--secondary)' }}>Quantity</th>
                            <th style={{ padding: '1.25rem 1.5rem', fontWeight: '600', color: 'var(--secondary)' }}>Expiry Date</th>
                            <th style={{ padding: '1.25rem 1.5rem', fontWeight: '600', color: 'var(--secondary)' }}>Safety Status</th>
                            <th style={{ padding: '1.25rem 1.5rem', fontWeight: '600', color: 'var(--secondary)' }}>Current State</th>
                        </tr>
                    </thead>
                    <tbody>
                        {inventory.map(item => {
                            const statusStyle = getStatusStyle(item.status, item.safetyFlag);
                            return (
                                <tr key={item.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                                    <td style={{ padding: '1.25rem 1.5rem', fontFamily: 'monospace' }}>#{item.id}</td>
                                    <td style={{ padding: '1.25rem 1.5rem', fontWeight: '700', fontSize: '1.1rem' }}>{item.bloodType}</td>
                                    <td style={{ padding: '1.25rem 1.5rem' }}>{item.quantity ?? 0}</td>
                                    <td style={{ padding: '1.25rem 1.5rem' }}>{item.expiryDate}</td>
                                    <td style={{ padding: '1.25rem 1.5rem' }}>
                                        <span style={{
                                            ...statusStyle,
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: '9999px',
                                            fontSize: '0.75rem',
                                            fontWeight: '600',
                                            textTransform: 'uppercase'
                                        }}>
                                            {item.safetyFlag || 'Pending'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1.25rem 1.5rem', fontWeight: '500' }}>{item.status}</td>
                                </tr>
                            );
                        })}
                        {inventory.length === 0 && !loading && (
                            <tr>
                                <td colSpan="6" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                    No inventory items found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default InventoryDashboard;
