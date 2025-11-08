// src/components/LiveTracker.jsx
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './LiveTracker.css';

const API_URL = 'http://localhost:5000/api';

// small helper to recenter / fit markers
function FitBounds({ positions }) {
  const map = useMap();
  useEffect(() => {
    if (!map || positions.length === 0) return;
    const bounds = L.latLngBounds(positions);
    map.fitBounds(bounds, { padding: [60, 60] });
  }, [map, positions]);
  return null;
}

// custom icons (use any URL or keep emoji marker approach)
const busIcon = L.divIcon({ html: '🚌', className: 'custom-div-icon', iconSize: [30, 30] });
const userIcon = L.divIcon({ html: '📍', className: 'custom-div-icon', iconSize: [26, 26] });
const destIcon = L.divIcon({ html: '🎯', className: 'custom-div-icon', iconSize: [26, 26] });

export default function LiveTracker({ onNavigate }) {
  const [buses, setBuses] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedBus, setSelectedBus] = useState(null);
  const [trackingData, setTrackingData] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const positionsRef = useRef([]); // for FitBounds

  useEffect(() => {
    fetchInitialData();
    getUserLocation();
    // Optional: auto refresh tracking every X seconds when trackingData exists
    // const id = setInterval(() => { if (selectedBus) handleBusClick(selectedBus, false); }, 10000);
    // return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (selectedCity) fetchBusesByCity();
    else fetchAllBuses();
  }, [selectedCity]);

  const fetchInitialData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const citiesRes = await axios.get(`${API_URL}/cities`, { headers });
      setCities(citiesRes.data);
      fetchAllBuses();
    } catch (err) {
      setError('Failed to fetch data');
    }
  };

  const fetchAllBuses = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get(`${API_URL}/buses`, { headers });
      setBuses(res.data);
    } catch {
      setError('Failed to fetch buses');
    }
  };

  const fetchBusesByCity = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get(`${API_URL}/buses`, { headers });
      setBuses(res.data.filter(b => b.fromCity === selectedCity));
    } catch {
      setError('Failed to fetch city buses');
    }
  };

  const getUserLocation = () => {
    if (!navigator.geolocation) {
      setUserLocation({ latitude: 16.4419, longitude: 80.5189 });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => setUserLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      () => setUserLocation({ latitude: 16.4419, longitude: 80.5189 })
    );
  };

  const handleBusClick = async (bus, showLoader = true) => {
    if (!userLocation) {
      setError('Enable location services to track bus.');
      return;
    }
    if (showLoader) setLoading(true);
    setError('');
    setSelectedBus(bus);

    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.post(`${API_URL}/buses/track`, {
        busNumber: bus.busNumber,
        userLatitude: userLocation.latitude,
        userLongitude: userLocation.longitude
      }, { headers });

      setTrackingData(res.data);

      // update positionsRef for map fit bounds
      const pnts = [];
      if (res.data.bus?.currentLocation) pnts.push([res.data.bus.currentLocation.latitude, res.data.bus.currentLocation.longitude]);
      if (res.data.userLocation) pnts.push([res.data.userLocation.latitude, res.data.userLocation.longitude]);
      if (res.data.bus?.destination) pnts.push([res.data.bus.destination.latitude, res.data.bus.destination.longitude]);
      positionsRef.current = pnts;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to track bus');
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  const getStatusColor = (speed) => (speed === 0 ? '#e74c3c' : speed < 30 ? '#f39c12' : '#2ecc71');
  const getStatusText = (speed) => (speed === 0 ? 'Stopped' : speed < 30 ? 'Slow' : 'Moving');

  return (
    <div className="live-tracker">
      <div className="tracker-header">
        <h1>🚌 Live Bus Tracker</h1>
        <p>Track buses from different cities in real-time</p>
      </div>

      <div className="tracker-main">
        <div className="tracker-sidebar">
          <div className="filter-section">
            <h3>Filter by City</h3>
            <select
              value={selectedCity}
              onChange={(e) => { setSelectedCity(e.target.value); setSelectedBus(null); setTrackingData(null); }}
              className="city-filter"
            >
              <option value="">All Cities ({buses.length} buses)</option>
              {cities.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="buses-list">
            <h3>Available Buses</h3>
            {error && <div className="error-message">{error}</div>}
            {buses.length === 0 ? <div className="no-buses">No buses available</div> : (
              <div className="bus-cards">
                {buses.map(bus => (
                  <div key={bus._id} className={`bus-card ${selectedBus?.busNumber === bus.busNumber ? 'selected' : ''}`} onClick={() => handleBusClick(bus)}>
                    <div className="bus-card-header">
                      <div className="bus-number-badge">{bus.busNumber}</div>
                      <div className="bus-status" style={{ backgroundColor: getStatusColor(bus.currentSpeed) }}>
                        {getStatusText(bus.currentSpeed)}
                      </div>
                    </div>
                    <div className="bus-card-body">
                      <div className="bus-route"><span className="route-icon">📍</span>{bus.fromCity} → {bus.toCity}</div>
                      <div className="bus-info-row"><span className="info-label">Route:</span><span className="info-value">{bus.route}</span></div>
                      <div className="bus-info-row"><span className="info-label">Speed:</span><span className="info-value">{bus.currentSpeed} km/h</span></div>
                      <div className="bus-info-row"><span className="info-label">Driver:</span><span className="info-value">{bus.driverName}</span></div>
                    </div>
                    <div className="bus-card-footer"><small>Last updated: {new Date(bus.lastUpdated).toLocaleTimeString()}</small></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="tracker-content">
          {loading ? (
            <div className="loading-state"><div className="spinner">🔄</div><p>Tracking bus...</p></div>
          ) : trackingData ? (
            <>
              <div className="tracking-details">
                <h2>🎯 Tracking: {trackingData.bus.busNumber}</h2>

                <div className="detail-cards">
                  <div className="detail-card primary">
                    <div className="card-icon">🚌</div>
                    <div className="card-content">
                      <h3>Bus Information</h3>
                      <div className="info-grid">
                        <div className="info-item"><span className="label">Route:</span><span className="value">{trackingData.bus.route}</span></div>
                        <div className="info-item"><span className="label">From:</span><span className="value">{trackingData.bus.fromCity}</span></div>
                        <div className="info-item"><span className="label">To:</span><span className="value">{trackingData.bus.toCity}</span></div>
                        <div className="info-item"><span className="label">Speed:</span><span className="value">{trackingData.bus.currentSpeed} km/h</span></div>
                      </div>
                    </div>
                  </div>

                  <div className="detail-card">
                    <div className="card-icon">👨‍✈️</div>
                    <div className="card-content">
                      <h3>Driver Details</h3>
                      <div className="info-grid">
                        <div className="info-item"><span className="label">Name:</span><span className="value">{trackingData.bus.driverName}</span></div>
                        <div className="info-item"><span className="label">Contact:</span><span className="value">{trackingData.bus.driverPhone}</span></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="distance-cards">
                  <div className="distance-card arrival">
                    <div className="distance-icon">⏱️</div>
                    <div className="distance-info">
                      <h4>Arrival Time to You</h4>
                      <div className="distance-value">{trackingData.estimatedArrivalToUser} mins</div>
                      <p className="distance-label">{trackingData.distanceFromUser} km away</p>
                    </div>
                  </div>

                  <div className="distance-card destination">
                    <div className="distance-icon">🎯</div>
                    <div className="distance-info">
                      <h4>Arrival to Destination</h4>
                      <div className="distance-value">{trackingData.estimatedArrivalToDestination} mins</div>
                      <p className="distance-label">{trackingData.distanceToDestination} km remaining</p>
                    </div>
                  </div>
                </div>

                <div className="map-visualization">
                  <h3>🗺️ Interactive Map View</h3>

                  {/* LEAFLET MAP */}
                  <div style={{ width: '100%', borderRadius: 12, overflow: 'hidden' }}>
                    <MapContainer
                      center={[
                        trackingData.bus.currentLocation.latitude,
                        trackingData.bus.currentLocation.longitude
                      ]}
                      zoom={13}
                      style={{ height: 420, width: '100%' }}
                      scrollWheelZoom={true}
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />

                      {/* markers */}
                      <Marker
                        position={[trackingData.bus.currentLocation.latitude, trackingData.bus.currentLocation.longitude]}
                        icon={busIcon}
                      >
                        <Popup>
                          <strong>{trackingData.bus.busNumber}</strong><br />
                          {trackingData.bus.route}
                        </Popup>
                      </Marker>

                      {trackingData.userLocation && (
                        <Marker position={[trackingData.userLocation.latitude, trackingData.userLocation.longitude]} icon={userIcon}>
                          <Popup>Your location</Popup>
                        </Marker>
                      )}

                      {trackingData.bus.destination && (
                        <Marker position={[trackingData.bus.destination.latitude, trackingData.bus.destination.longitude]} icon={destIcon}>
                          <Popup>Destination</Popup>
                        </Marker>
                      )}

                      {/* Fit bounds to markers */}
                      <FitBounds positions={positionsRef.current.length ? positionsRef.current : [
                        [trackingData.bus.currentLocation.latitude, trackingData.bus.currentLocation.longitude],
                        trackingData.userLocation ? [trackingData.userLocation.latitude, trackingData.userLocation.longitude] : [],
                        trackingData.bus.destination ? [trackingData.bus.destination.latitude, trackingData.bus.destination.longitude] : []
                      ].filter(Boolean)} />
                    </MapContainer>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="no-selection">
              <div className="no-selection-icon">🚌</div>
              <h3>Select a Bus to Track</h3>
              <p>Click on any bus from the list to see its live location and estimated arrival time</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
