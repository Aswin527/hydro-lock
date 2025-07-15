import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Droplets, TrendingUp, Calendar, Clock, Database, Wifi, WifiOff } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, orderBy, limit } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB2GBCPSA8RXD-PJkvhcM4sXgwE9vgRGe0",
  authDomain: "hydro-lock-e7810.firebaseapp.com",
  databaseURL: "https://hydro-lock-e7810-default-rtdb.firebaseio.com",
  projectId: "hydro-lock-e7810",
  storageBucket: "hydro-lock-e7810.firebasestorage.app",
  messagingSenderId: "933472743392",
  appId: "1:933472743392:web:2d782d0cc7a9559d460585",
  measurementId: "G-C8VSY8Q4YJ"
};

// Initialize Firebase outside of component
let app;
let db;

const WaterUsageDashboard = () => {
  const [activeView, setActiveView] = useState('daily');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);
  const [rawFirestoreData, setRawFirestoreData] = useState([]);

  // Simulated Firestore data based on your screenshot
  const simulatedFirestoreData = [
    { id: '1004055', flowRate: 0, timestamp: new Date('2025-07-11T11:27:03'), totalLiters: 0.481 },
    { id: '1008561', flowRate: 2.1, timestamp: new Date('2025-07-10T10:30:00'), totalLiters: 125.7 },
    { id: '1014296', flowRate: 2.4, timestamp: new Date('2025-07-09T09:15:00'), totalLiters: 140.8 },
    { id: '1019824', flowRate: 2.2, timestamp: new Date('2025-07-08T08:45:00'), totalLiters: 130.4 },
    { id: '1023200', flowRate: 2.5, timestamp: new Date('2025-07-07T07:20:00'), totalLiters: 145.1 },
    { id: '1025150', flowRate: 1.9, timestamp: new Date('2025-07-06T06:30:00'), totalLiters: 110.8 },
    { id: '1031295', flowRate: 2.3, timestamp: new Date('2025-07-05T05:45:00'), totalLiters: 135.2 },
  ];

  // Function to initialize Firebase
  const initializeFirebase = () => {
    try {
      if (!app) {
        app = initializeApp(firebaseConfig);
        db = getFirestore(app);
      }
      return true;
    } catch (error) {
      console.error('Firebase initialization error:', error);
      return false;
    }
  };

  // Function to connect to Firestore
  const connectToFirestore = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Initialize Firebase if not already done
      const initialized = initializeFirebase();
      if (!initialized) {
        throw new Error('Failed to initialize Firebase');
      }

      // Simulate connection delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setConnected(true);
      setRawFirestoreData(simulatedFirestoreData);
      
    } catch (err) {
      setError('Failed to connect to Firestore: ' + err.message);
      console.error('Firestore connection error:', err);
      setConnected(false);
    }
    
    setLoading(false);
  };

  // Function to fetch and process Firestore data
  const fetchWaterData = async (period) => {
    // Ensure Firebase is initialized and connected
    if (!connected || !db) {
      await connectToFirestore();
    }
    
    // If still not connected, use simulated data
    if (!connected || !db) {
      const processedData = processFirestoreData(simulatedFirestoreData, period);
      setData(processedData);
      return;
    }
    
    setLoading(true);
    
    try {
      const q = query(
        collection(db, 'waterData'),
        orderBy('timestamp', 'desc'),
        limit(30)
      );
      const querySnapshot = await getDocs(q);
      const firestoreData = [];
      querySnapshot.forEach((doc) => {
        firestoreData.push({ id: doc.id, ...doc.data() });
      });

      const processedData = processFirestoreData(firestoreData, period);
      setData(processedData);
      setRawFirestoreData(firestoreData);
      
    } catch (error) {
      setError('Failed to fetch water data: ' + error.message);
      console.error('Error fetching water data:', error);
      
      // Fallback to simulated data
      const processedData = processFirestoreData(simulatedFirestoreData, period);
      setData(processedData);
    }
    
    setLoading(false);
  };

  // Function to process Firestore data based on the view period
  const processFirestoreData = (firestoreData, period) => {
    const sortedData = firestoreData.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    switch(period) {
      case 'daily':
        return sortedData.map(item => {
          const timestamp = item.timestamp?.toDate ? item.timestamp.toDate() : new Date(item.timestamp);
          return {
            date: timestamp.toISOString().split('T')[0],
            usage: item.totalLiters || 0,
            target: 150,
            flowRate: item.flowRate || 0,
            timestamp
          };
        });
        
      case 'weekly':
        const weeklyData = {};
        sortedData.forEach(item => {
          const timestamp = item.timestamp?.toDate?.() || new Date(item.timestamp);
          if (isNaN(timestamp)) return; // skip invalid

          const weekStart = getWeekStart(timestamp);
          const weekKey = `Week ${Math.ceil(weekStart.getDate() / 7)}`;

          if (!weeklyData[weekKey]) {
            weeklyData[weekKey] = {
              week: weekKey,
              usage: 0,
              target: 1050,
              flowRate: 0,
              count: 0
            };
          }

          weeklyData[weekKey].usage += item.totalLiters || 0;
          weeklyData[weekKey].flowRate += item.flowRate || 0;
          weeklyData[weekKey].count++;
        });

        return Object.values(weeklyData).map(week => ({
          ...week,
          flowRate: week.count ? week.flowRate / week.count : 0
        }));

      case 'monthly':
        const monthlyData = {};
        sortedData.forEach(item => {
          const timestamp = item.timestamp?.toDate?.() || new Date(item.timestamp);
          if (isNaN(timestamp)) return; // skip invalid

          const monthKey = timestamp.toLocaleDateString('en-US', { month: 'short' });

          if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = {
              month: monthKey,
              usage: 0,
              target: 4500,
              flowRate: 0,
              count: 0
            };
          }

          monthlyData[monthKey].usage += item.totalLiters || 0;
          monthlyData[monthKey].flowRate += item.flowRate || 0;
          monthlyData[monthKey].count++;
        });

        return Object.values(monthlyData).map(month => ({
          ...month,
          flowRate: month.count ? month.flowRate / month.count : 0
        }));
        
      default:
        return sortedData;
    }
  };

  const getWeekStart = (date) => {
    const start = new Date(date);
    start.setDate(start.getDate() - start.getDay());
    return start;
  };

  useEffect(() => {
    fetchWaterData(activeView);
  }, [activeView]);

  const getCurrentFlowRate = () => {
    if (data.length === 0) return 0;
    return data[data.length - 1].flowRate || 0;
  };

  const getCurrentUsage = () => {
    if (data.length === 0) return 0;
    return data[data.length - 1].usage.toFixed(2);
  };

  const getAverageUsage = () => {
    if (data.length === 0) return 0;
    const total = data.reduce((sum, item) => sum + item.usage, 0);
    return (total / data.length).toFixed(2);
  };

  const getUsageStatus = () => {
    const current = getCurrentUsage();
    const target = data.length > 0 ? data[data.length - 1].target : 0;
    const percentage = target > 0 ? ((current / target) * 100).toFixed(1) : 0;
    
    if (percentage <= 80) return { status: 'Low', color: '#10b981', bgColor: '#d1fae5' };
    if (percentage <= 95) return { status: 'Normal', color: '#3b82f6', bgColor: '#dbeafe' };
    return { status: 'High', color: '#ef4444', bgColor: '#fee2e2' };
  };

  const usageStatus = getUsageStatus();

  const formatXAxisLabel = (value) => {
    switch(activeView) {
      case 'daily':
        return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      case 'weekly':
        return value;
      case 'monthly':
        return value;
      default:
        return value;
    }
  };

  const containerStyle = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #e0f2fe 0%, #e0f7fa 100%)',
    padding: '24px',
    fontFamily: 'system-ui, -apple-system, sans-serif'
  };

  const maxWidthStyle = {
    maxWidth: '1200px',
    margin: '0 auto'
  };

  const headerStyle = {
    marginBottom: '32px'
  };

  const titleStyle = {
    fontSize: '2.5rem',
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  };

  const subtitleStyle = {
    color: '#6b7280',
    fontSize: '1.1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  };

  const connectionStatusStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    borderRadius: '20px',
    fontSize: '0.875rem',
    fontWeight: '500',
    backgroundColor: connected ? '#d1fae5' : '#fee2e2',
    color: connected ? '#065f46' : '#991b1b',
    marginTop: '8px'
  };

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '24px',
    marginBottom: '32px'
  };

  const cardStyle = {
    backgroundColor: 'white',
    borderRadius: '16px',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
    padding: '24px',
    border: '1px solid #e5e7eb'
  };

  const cardHeaderStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '16px'
  };

  const cardTitleStyle = {
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#6b7280',
    marginBottom: '4px'
  };

  const cardValueStyle = {
    fontSize: '2rem',
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: '4px'
  };

  const cardUnitStyle = {
    fontSize: '0.875rem',
    color: '#9ca3af'
  };

  const iconContainerStyle = {
    padding: '12px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  const statusBadgeStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '0.75rem',
    fontWeight: '500',
    backgroundColor: usageStatus.bgColor,
    color: usageStatus.color
  };

  const buttonContainerStyle = {
    display: 'flex',
    gap: '8px',
    marginBottom: '24px',
    flexWrap: 'wrap'
  };

  const buttonStyle = {
    padding: '8px 16px',
    borderRadius: '8px',
    fontWeight: '500',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontSize: '0.875rem'
  };

  const activeButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#2563eb',
    color: 'white',
    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.4)'
  };

  const inactiveButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#f3f4f6',
    color: '#374151'
  };

  const connectButtonStyle = {
    ...buttonStyle,
    backgroundColor: connected ? '#10b981' : '#2563eb',
    color: 'white',
    marginRight: '16px'
  };

  const chartContainerStyle = {
    height: '400px',
    marginTop: '24px'
  };

  const loadingStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%'
  };

  const spinnerStyle = {
    width: '48px',
    height: '48px',
    border: '4px solid #e5e7eb',
    borderTop: '4px solid #2563eb',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  };

  const errorStyle = {
    color: '#dc2626',
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '8px',
    padding: '12px',
    marginBottom: '16px'
  };

  const debugStyle = {
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '16px',
    marginTop: '24px'
  };

  const debugTitleStyle = {
    fontWeight: '600',
    marginBottom: '8px',
    color: '#1f2937'
  };

  const debugContentStyle = {
    fontSize: '0.875rem',
    color: '#6b7280',
    fontFamily: 'monospace',
    backgroundColor: '#f1f5f9',
    padding: '8px',
    borderRadius: '4px',
    maxHeight: '200px',
    overflowY: 'auto'
  };

  return (
    <div style={containerStyle}>
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
      
      <div style={maxWidthStyle}>
        <div style={headerStyle}>
          <h1 style={titleStyle}>
            <Droplets color="#2563eb" size={40} />
            Water Usage Dashboard
          </h1>
          <p style={subtitleStyle}>
            <Database color="#6b7280" size={20} />
            Connected to Firestore Database
          </p>
          <div style={connectionStatusStyle}>
            {connected ? <Wifi size={16} /> : <WifiOff size={16} />}
            {connected ? 'Connected to Firestore' : 'Disconnected'}
          </div>
        </div>

        {error && (
          <div style={errorStyle}>
            <strong>Error:</strong> {error}
          </div>
        )}

        <div style={gridStyle}>
          <div style={cardStyle}>
            <div style={cardHeaderStyle}>
              <div>
                <p style={cardTitleStyle}>Current Usage</p>
                <p style={cardValueStyle}>{getCurrentUsage()}</p>
                <p style={cardUnitStyle}>liters</p>
              </div>
              <div style={{...iconContainerStyle, backgroundColor: usageStatus.bgColor}}>
                <Droplets color={usageStatus.color} size={24} />
              </div>
            </div>
            <div style={statusBadgeStyle}>
              {usageStatus.status}
            </div>
          </div>

          <div style={cardStyle}>
            <div style={cardHeaderStyle}>
              <div>
                <p style={cardTitleStyle}>Flow Rate</p>
                <p style={cardValueStyle}>{getCurrentFlowRate().toFixed(1)}</p>
                <p style={cardUnitStyle}>L/min</p>
              </div>
              <div style={{...iconContainerStyle, backgroundColor: '#f3e8ff'}}>
                <TrendingUp color="#8b5cf6" size={24} />
              </div>
            </div>
          </div>

          <div style={cardStyle}>
            <div style={cardHeaderStyle}>
              <div>
                <p style={cardTitleStyle}>Average Usage</p>
                <p style={cardValueStyle}>{getAverageUsage()}</p>
                <p style={cardUnitStyle}>liters</p>
              </div>
              <div style={{...iconContainerStyle, backgroundColor: '#dbeafe'}}>
                <TrendingUp color="#3b82f6" size={24} />
              </div>
            </div>
          </div>

          <div style={cardStyle}>
            <div style={cardHeaderStyle}>
              <div>
                <p style={cardTitleStyle}>Data Points</p>
                <p style={cardValueStyle}>{rawFirestoreData.length}</p>
                <p style={cardUnitStyle}>records</p>
              </div>
              <div style={{...iconContainerStyle, backgroundColor: '#d1fae5'}}>
                <Database color="#10b981" size={24} />
              </div>
            </div>
          </div>
        </div>

        <div style={cardStyle}>
          <div style={buttonContainerStyle}>
            <button
              onClick={() => connectToFirestore()}
              style={connectButtonStyle}
              disabled={loading}
            >
              {loading ? 'Connecting...' : connected ? 'Reconnect' : 'Connect to Firestore'}
            </button>
            
            {['daily', 'weekly', 'monthly'].map((period) => (
              <button
                key={period}
                onClick={() => setActiveView(period)}
                style={activeView === period ? activeButtonStyle : inactiveButtonStyle}
                disabled={loading}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
            ))}
          </div>

          <div style={chartContainerStyle}>
            {loading ? (
              <div style={loadingStyle}>
                <div style={spinnerStyle}></div>
              </div>
            ) : data.length === 0 ? (
              <div style={loadingStyle}>
                <p style={{color: '#6b7280'}}>No data available. Please connect to Firestore.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                {activeView === 'daily' ? (
                  <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={formatXAxisLabel}
                      stroke="#666"
                    />
                    <YAxis stroke="#666" />
                    <Tooltip 
                      labelFormatter={(value) => formatXAxisLabel(value)}
                      formatter={(value, name) => [
                        `${value} L`,
                        name === 'usage' ? 'Water Usage' : 'Target'
                      ]}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="usage" 
                      stroke="#2563eb" 
                      strokeWidth={3}
                      dot={{ fill: '#2563eb', strokeWidth: 2, r: 4 }}
                      name="Usage"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="target" 
                      stroke="#dc2626" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={{ fill: '#dc2626', strokeWidth: 2, r: 3 }}
                      name="Target"
                    />
                  </LineChart>
                ) : (
                  <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey={activeView === 'weekly' ? 'week' : 'month'}
                      stroke="#666"
                    />
                    <YAxis stroke="#666" />
                    <Tooltip 
                      formatter={(value, name) => [value.toFixed(1) + ' L', name === 'usage' ? 'Usage' : 'Target']}
                    />
                    <Legend />
                    <Bar dataKey="usage" fill="#2563eb" radius={[4, 4, 0, 0]} name="Usage" />
                    <Bar dataKey="target" fill="#dc2626" radius={[4, 4, 0, 0]} name="Target" />
                  </BarChart>
                )}
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div style={debugStyle}>
          <h4 style={debugTitleStyle}>Debug: Raw Firestore Data</h4>
          <div style={debugContentStyle}>
            {JSON.stringify(rawFirestoreData, null, 2)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WaterUsageDashboard;