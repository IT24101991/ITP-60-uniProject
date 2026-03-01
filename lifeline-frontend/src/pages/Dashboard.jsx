import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import ChatWidget from '../components/ChatWidget';

const cardVariants = {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 }
};

const hoverScale = { scale: 1.02 };

const Dashboard = () => {
    const navigate = useNavigate();
    const { isAdmin, isDoctor } = useAuth();
    const [recentActivity, setRecentActivity] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [activityLoading, setActivityLoading] = useState(true);
    const [inventoryLoading, setInventoryLoading] = useState(true);
    const [activityError, setActivityError] = useState(false);
    const [inventoryError, setInventoryError] = useState(false);

    const modules = [
        ...(isAdmin || isDoctor ? [{ title: 'Inventory', desc: 'Manage blood stock & safety', path: '/inventory', color: 'var(--primary)', icon: '📦' }] : []),
        { title: 'Donors', desc: 'Register & track donors', path: '/donors', color: '#10B981', icon: '❤️' },
        { title: 'Appointments', desc: 'Schedule and manage bookings', path: '/appointments', color: '#0EA5E9', icon: '🗓️' },
        { title: 'Camps', desc: 'Find donation events', path: '/camps', color: '#F59E0B', icon: '📅' },
        ...(isAdmin || isDoctor ? [{ title: 'Emergency', desc: 'Broadcast critical alerts', path: '/emergency', color: '#DC2626', icon: '🚨' }] : []),
    ];

    useEffect(() => {
        setActivityLoading(true);
        axios.get('http://localhost:8080/api/activity/recent')
            .then(res => {
                setRecentActivity(res.data || []);
                setActivityLoading(false);
            })
            .catch(err => {
                console.error('Error fetching recent activity', err);
                setActivityError(true);
                setActivityLoading(false);
            });
    }, []);

    useEffect(() => {
        if (!(isAdmin || isDoctor)) {
            setInventoryLoading(false);
            return;
        }
        setInventoryLoading(true);
        axios.get('http://localhost:8080/api/inventory')
            .then(res => {
                setInventory(res.data || []);
                setInventoryLoading(false);
            })
            .catch(err => {
                console.error('Error fetching inventory', err);
                setInventoryError(true);
                setInventoryLoading(false);
            });
    }, [isAdmin, isDoctor]);

    const formatTimeAgo = (timestamp) => {
        if (!timestamp) return 'Just now';
        const date = new Date(timestamp);
        if (Number.isNaN(date.getTime())) return 'Just now';
        const diffMs = Date.now() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} mins ago`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours} hrs ago`;
        const diffDays = Math.floor(diffHours / 24);
        return `${diffDays} days ago`;
    };

    const criticalAlerts = useMemo(() => {
        const alerts = [];
        inventory.forEach(item => {
            const status = (item.status || '').toUpperCase();
            const safety = (item.safetyFlag || '').toUpperCase();
            const qty = typeof item.quantity === 'number' ? item.quantity : null;
            const lowByQty = qty !== null && qty <= 2;
            const lowByStatus = status.includes('LOW') || status.includes('CRITICAL');
            const unsafe = safety.includes('BIO') || status.includes('DISCARD');
            if (lowByQty || lowByStatus || unsafe) {
                alerts.push(item);
            }
        });
        return alerts;
    }, [inventory]);

    const emergencyAlerts = useMemo(() => {
        return recentActivity.filter(item => {
            const type = (item.activityType || '').toUpperCase();
            const desc = (item.description || '').toLowerCase();
            return type.includes('EMERGENCY') || desc.includes('emergency alert');
        });
    }, [recentActivity]);

    return (
        <div className="container" style={{ padding: '2.25rem 1rem 3.5rem', position: 'relative', minHeight: '100vh' }}>
            <header className="page-header" style={{ marginBottom: '2.5rem' }}>
                <div>
                    <h1 className="page-header-title">Dashboard</h1>
                    <p className="page-header-subtitle">Welcome to LifeLine Control Center</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div className="pill-badge">
                        <span className="pill-badge-dot" aria-hidden="true" />
                        <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>System Operational</span>
                    </div>
                </div>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.75rem' }}>
                {modules.map((mod, idx) => (
                    <motion.div
                        key={idx}
                        onClick={() => navigate(mod.path)}
                        className="stat-card"
                        variants={cardVariants}
                        initial="initial"
                        animate="animate"
                        transition={{ duration: 0.28, delay: idx * 0.04 }}
                        whileHover={hoverScale}
                        whileTap={{ scale: 0.98 }}
                        style={{
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.9rem',
                            outline: 'none'
                        }}
                        tabIndex={0}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                navigate(mod.path);
                            }
                        }}
                    >
                        <div
                            className="stat-card-icon"
                            style={{
                                background: `${mod.color}1a`,
                                color: mod.color
                            }}
                        >
                            {mod.icon}
                        </div>
                        <div>
                            <h3 className="stat-card-title">{mod.title}</h3>
                            <p className="stat-card-subtitle">{mod.desc}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div style={{ marginTop: '3rem', display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: '1.75rem', alignItems: 'stretch' }}>
                <motion.div
                    className="glass-panel"
                    variants={cardVariants}
                    initial="initial"
                    animate="animate"
                    transition={{ duration: 0.25, delay: 0.12 }}
                    style={{ padding: '1.75rem 1.6rem', borderRadius: '1.25rem', display: 'flex', flexDirection: 'column' }}
                >
                    <h3 style={{ marginBottom: '1rem' }}>Recent Activity</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {activityLoading && (
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Loading activity...</div>
                        )}
                        {!activityLoading && activityError && (
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Unable to load activity.</div>
                        )}
                        {!activityLoading && !activityError && recentActivity.length === 0 && (
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                                No recent activity in the last 24 hours. New actions such as bookings, stock changes, or alerts will appear here.
                            </div>
                        )}
                        {!activityLoading && !activityError && recentActivity.map(item => (
                            <div key={item.id} style={{ display: 'flex', gap: '1rem', alignItems: 'center', fontSize: '0.875rem' }}>
                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--text-muted)' }}></div>
                                <span style={{ color: 'var(--text-muted)' }}>{formatTimeAgo(item.timestamp)}</span>
                                <span>{item.description}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>
                <motion.div
                    className="glass-panel"
                    variants={cardVariants}
                    initial="initial"
                    animate="animate"
                    transition={{ duration: 0.25, delay: 0.18 }}
                    style={{
                        padding: '1.9rem 1.7rem',
                        borderRadius: '1.4rem',
                        background: 'linear-gradient(145deg, #1e293b, #0f172a)',
                        color: 'white',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between'
                    }}
                >
                    <div>
                        <h3 style={{ color: 'white', marginBottom: '0.35rem' }}>Critical Alerts</h3>
                        <p style={{ fontSize: '0.8rem', opacity: 0.85, marginBottom: '0.85rem' }}>
                            {(isAdmin || isDoctor)
                                ? 'Live snapshot of risky blood stock.'
                                : 'Emergency alerts requiring quick action.'}
                        </p>
                    </div>
                    <div style={{ fontSize: '2.75rem', fontWeight: '700', letterSpacing: '-0.04em' }}>
                        {(isAdmin || isDoctor)
                            ? (inventoryLoading ? '...' : criticalAlerts.length)
                            : emergencyAlerts.length}
                    </div>
                    <p style={{ opacity: 0.9 }}>
                        {(isAdmin || isDoctor) && inventoryLoading && 'Checking stock levels...'}
                        {(isAdmin || isDoctor) && !inventoryLoading && criticalAlerts.length === 0 && 'No critical inventory alerts.'}
                        {(isAdmin || isDoctor) && !inventoryLoading && criticalAlerts.length > 0 && `Inventory alerts: ${criticalAlerts.length} item(s)`}
                        {!(isAdmin || isDoctor) && (emergencyAlerts.length > 0 ? `Emergency alerts: ${emergencyAlerts.length}` : 'No emergency alerts.')}
                        {emergencyAlerts.length > 0 && (isAdmin || isDoctor) && ` • Emergency alerts: ${emergencyAlerts.length}`}
                    </p>
                    <button
                        className="btn btn-primary"
                        style={{
                            marginTop: '1.25rem',
                            paddingInline: '1.25rem',
                            alignSelf: 'flex-start',
                            background: 'white',
                            color: 'var(--primary)'
                        }}
                        onClick={() => navigate((isAdmin || isDoctor) ? '/inventory' : '/emergency/alerts')}
                    >
                        {(isAdmin || isDoctor) ? 'View Inventory' : 'View Alerts'}
                    </button>
                </motion.div>
            </div>
            <ChatWidget />
        </div>
    );
};

export default Dashboard;
