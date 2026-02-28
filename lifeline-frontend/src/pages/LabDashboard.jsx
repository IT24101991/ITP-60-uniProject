import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const LabDashboard = () => {
    const navigate = useNavigate();
    const [pendingBags, setPendingBags] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);

    const fetchPendingBags = () => {
        setLoading(true);
        axios.get('http://localhost:8080/api/inventory') // Changed from /lab/pending to all
            .then(res => {
                setPendingBags(res.data || []);
                setLoading(false);
            })
            .catch(err => {
                console.error('Error fetching inventory', err);
                setPendingBags([]);
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchPendingBags();
    }, []);

    const sortedBags = useMemo(() => {
        return [...pendingBags].sort((a, b) => {
            const ta = a.collectedAt ? new Date(a.collectedAt).getTime() : 0;
            const tb = b.collectedAt ? new Date(b.collectedAt).getTime() : 0;
            return tb - ta;
        });
    }, [pendingBags]);

    const handleMarkResult = async (bagId, isPositive) => {
        let reason = "";
        if (isPositive) {
            reason = window.prompt("Please enter the reason for the positive result (e.g., HIV found, Hepatitis):");
            if (reason === null) return; // Cancelled
        }

        setProcessingId(bagId);
        try {
            await axios.put(`http://localhost:8080/api/inventory/${bagId}/test`, {
                hiv: isPositive,
                hep: false,
                malaria: false,
                reason: reason
            });
            fetchPendingBags();
        } catch (err) {
            console.error(err);
            alert('Failed to update lab result.');
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <div className="container" style={{ padding: '2rem 1rem' }}>
            <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Lab Dashboard</h1>
                    <p style={{ color: 'var(--text-muted)' }}>
                        Completed donations arrive here first for lab screening before entering inventory.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button className="btn btn-primary" onClick={fetchPendingBags}>Refresh</button>
                    <button className="btn" style={{ border: '1px solid #E2E8F0' }} onClick={() => navigate(-1)}>Back</button>
                </div>
            </header>

            <div className="glass-panel" style={{ padding: '1.5rem' }}>
                {loading && <div style={{ color: 'var(--text-muted)' }}>Loading lab queue...</div>}
                {!loading && sortedBags.length === 0 && (
                    <div style={{ color: 'var(--text-muted)' }}>No pending blood bags in lab queue.</div>
                )}

                {!loading && sortedBags.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {sortedBags.map((bag) => (
                            <div key={bag.id} className="glass-panel" style={{ padding: '1rem', borderLeft: bag.testStatus === 'PENDING' ? '4px solid #3B82F6' : (bag.testStatus === 'TESTED_SAFE' ? '4px solid #10B981' : '4px solid #EF4444') }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                                    <div>
                                        <div style={{ fontWeight: '600' }}>
                                            Bag #{bag.id} • {bag.bloodType} 
                                            <span style={{ 
                                                marginLeft: '0.5rem', 
                                                fontSize: '0.75rem', 
                                                padding: '0.1rem 0.4rem', 
                                                borderRadius: '4px',
                                                background: bag.testStatus === 'PENDING' ? '#DBEAFE' : (bag.testStatus === 'TESTED_SAFE' ? '#D1FAE5' : '#FEE2E2'),
                                                color: bag.testStatus === 'PENDING' ? '#1E40AF' : (bag.testStatus === 'TESTED_SAFE' ? '#065F46' : '#991B1B')
                                            }}>
                                                {bag.testStatus}
                                            </span>
                                        </div>
                                        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                            Donor: {bag.donorName || 'Unknown'} • Collected: {bag.collectedAt ? new Date(bag.collectedAt).toLocaleString() : 'Unknown'}
                                        </div>
                                    </div>
                                    {bag.testStatus === 'PENDING' && (
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button
                                                className="btn"
                                                style={{ border: '1px solid #A7F3D0', color: '#065F46' }}
                                                disabled={processingId === bag.id}
                                                onClick={() => handleMarkResult(bag.id, false)}
                                            >
                                                {processingId === bag.id ? 'Processing...' : 'Mark SAFE'}
                                            </button>
                                            <button
                                                className="btn"
                                                style={{ border: '1px solid #FCA5A5', color: '#B91C1C' }}
                                                disabled={processingId === bag.id}
                                                onClick={() => handleMarkResult(bag.id, true)}
                                            >
                                                {processingId === bag.id ? 'Processing...' : 'Mark POSITIVE'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default LabDashboard;
