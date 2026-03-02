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

}
