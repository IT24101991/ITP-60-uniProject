import React, { useMemo, useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const InventoryDashboard = () => {
    const {isAdmin, isDoctor} = useAuth();
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
                            const data = (res.data || []).map(r => ({...r, status: r.status || 'OPEN'}));
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

}