import { useEffect, useState } from "react";
import axios from "axios";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const API_URL = "http://localhost:5000/api";
const busStopIcon = L.divIcon({ html: "🚏", className: "custom-div-icon", iconSize: [30, 30] });

export default function PickupFinder() {
  const [stops, setStops] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [nearestStop, setNearestStop] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    axios
      .get(`${API_URL}/routes`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        const allStops = res.data.flatMap(r => r.stops);
        setStops(allStops);
      });

    navigator.geolocation.getCurrentPosition(
      pos => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => alert("Enable GPS to use Pickup Finder")
    );
  }, []);

  useEffect(() => {
    if (stops.length > 0 && userLocation) {
      const nearest = stops.reduce((a, b) => {
        const distA = Math.hypot(a.latitude - userLocation.lat, a.longitude - userLocation.lng);
        const distB = Math.hypot(b.latitude - userLocation.lat, b.longitude - userLocation.lng);
        return distA < distB ? a : b;
      });
      setNearestStop(nearest);
    }
  }, [stops, userLocation]);

  return (
    <div className="pickup-finder">
      <h1>🚏 Pickup Point Finder</h1>
      {userLocation && nearestStop ? (
        <>
          <p>
            Nearest Stop: <strong>{nearestStop.stopName}</strong> ({nearestStop.estimatedTime})
          </p>
          <MapContainer
            center={[userLocation.lat, userLocation.lng]}
            zoom={13}
            style={{ height: "500px", width: "100%", borderRadius: "12px" }}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Marker position={[userLocation.lat, userLocation.lng]}>
              <Popup>📍 You are here</Popup>
            </Marker>
            {nearestStop && (
              <Marker position={[nearestStop.latitude, nearestStop.longitude]} icon={busStopIcon}>
                <Popup>
                  🚏 <strong>{nearestStop.stopName}</strong><br />
                  🕒 {nearestStop.estimatedTime}
                </Popup>
              </Marker>
            )}
          </MapContainer>
        </>
      ) : (
        <p>Loading map and stops...</p>
      )}
    </div>
  );
}
