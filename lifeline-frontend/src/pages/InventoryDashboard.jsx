import React, { useState, useEffect } from 'react';
import axios from 'axios';
import LabTestModal from './LabTestModal';
import { useAuth } from '../context/AuthContext';

const InventoryDashboard = () => {
    const { isDoctor, user } = useAuth();
    const [inventory, setInventory] = useState([]);
    const [selectedBag, setSelectedBag] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchInventory = () => {
        setLoading(true);
        axios.get('http://localhost:8080/api/inventory')
            .then(res => {
                setInventory(res.data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Error fetching inventory", err);
                setLoading(false);
                // Mock data for presentation if server fails
                setInventory([
                    { id: 1, bloodType: 'A+', expiryDate: '2026-04-12', status: 'AVAILABLE', safetyFlag: 'SAFE' },
                    { id: 2, bloodType: 'O-', expiryDate: '2026-04-10', status: 'UNTESTED', safetyFlag: null },
                    { id: 3, bloodType: 'AB+', expiryDate: '2026-04-15', status: 'DISCARD', safetyFlag: 'BIO-HAZARD' },
                ]);
            });
    };

    useEffect(() => {
        fetchInventory();
    }, []);

    const getStatusStyle = (status, safetyFlag) => {
        if (safetyFlag === 'BIO-HAZARD' || status === 'DISCARD') {
            return { background: '#FECDD3', color: '#9F1239', border: '1px solid #FDA4AF' }; // Red
        }
        if (safetyFlag === 'SAFE' || status === 'AVAILABLE') {
            return { background: '#D1FAE5', color: '#065F46', border: '1px solid #6EE7B7' }; // Green
        }
        return { background: '#FEF3C7', color: '#92400E', border: '1px solid #FCD34D' }; // Yellow/Warning
    };

    const handleTestComplete = () => {
        setSelectedBag(null);
        fetchInventory();
    };

    return (
        <div className="container" style={{ padding: '2rem 1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Inventory Management</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Real-time blood stock monitoring</p>
                </div>
                <button
                    className="btn btn-primary"
                    onClick={() => fetchInventory()}
                >
                    Refresh Data
                </button>
            </div>

            <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ background: 'rgba(0,0,0,0.02)', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                            <th style={{ padding: '1.25rem 1.5rem', fontWeight: '600', color: 'var(--secondary)' }}>ID</th>
                            <th style={{ padding: '1.25rem 1.5rem', fontWeight: '600', color: 'var(--secondary)' }}>Blood Type</th>
                            <th style={{ padding: '1.25rem 1.5rem', fontWeight: '600', color: 'var(--secondary)' }}>Expiry Date</th>
                            <th style={{ padding: '1.25rem 1.5rem', fontWeight: '600', color: 'var(--secondary)' }}>Safety Status</th>
                            <th style={{ padding: '1.25rem 1.5rem', fontWeight: '600', color: 'var(--secondary)' }}>Current State</th>
                            <th style={{ padding: '1.25rem 1.5rem', fontWeight: '600', color: 'var(--secondary)', textAlign: 'center' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {inventory.map(item => {
                            const statusStyle = getStatusStyle(item.status, item.safetyFlag);
                            return (
                                <tr key={item.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                                    <td style={{ padding: '1.25rem 1.5rem', fontFamily: 'monospace' }}>#{item.id}</td>
                                    <td style={{ padding: '1.25rem 1.5rem', fontWeight: '700', fontSize: '1.1rem' }}>{item.bloodType}</td>
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
                                    <td style={{ padding: '1.25rem 1.5rem', textAlign: 'center' }}>
                                        {isDoctor && (item.status === 'UNTESTED' || !item.safetyFlag) && (
                                            <button
                                                onClick={() => setSelectedBag(item)}
                                                style={{
                                                    background: 'var(--accent)',
                                                    color: 'white',
                                                    padding: '0.5rem 1rem',
                                                    borderRadius: 'var(--radius-md)',
                                                    fontSize: '0.875rem',
                                                    fontWeight: '600'
                                                }}
                                            >
                                                Validate
                                            </button>
                                        )}
                                        {!isDoctor && <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>View Only</span>}
                                    </td>
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

            {selectedBag && (
                <LabTestModal
                    bagId={selectedBag.id}
                    onClose={() => setSelectedBag(null)}
                    onSubmit={handleTestComplete}
                />
            )}
        </div>
    );
};

export default InventoryDashboard;
