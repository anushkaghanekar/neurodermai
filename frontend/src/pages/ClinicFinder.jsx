import { useState } from "react";

function getGoogleMapsUrl(lat, lng) {
  return `https://www.google.com/maps/search/dermatologist+skin+clinic/@${lat},${lng},13z`;
}

function getGoogleMapsDirectionsUrl(lat, lng, destLat, destLng) {
  return `https://www.google.com/maps/dir/${lat},${lng}/${destLat},${destLng}`;
}

const SPECIALTIES = [
  { label: "Dermatologist", query: "dermatologist", icon: "👨‍⚕️" },
  { label: "Skin Clinic", query: "skin+clinic", icon: "🏥" },
  { label: "Dermatology Hospital", query: "dermatology+hospital", icon: "🏨" },
  { label: "Skin Cancer Screening", query: "skin+cancer+screening+center", icon: "🔬" },
];

export default function ClinicFinder() {
  const [location, setLocation] = useState(null);
  const [locError, setLocError] = useState("");
  const [isLocating, setIsLocating] = useState(false);

  function requestLocation() {
    if (!navigator.geolocation) {
      setLocError("Geolocation is not supported by your browser.");
      return;
    }

    setIsLocating(true);
    setLocError("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setIsLocating(false);
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocError("Location access was denied. Please enable it in your browser settings.");
            break;
          case error.POSITION_UNAVAILABLE:
            setLocError("Location information is unavailable.");
            break;
          case error.TIMEOUT:
            setLocError("The location request timed out.");
            break;
          default:
            setLocError("An unknown error occurred while getting your location.");
        }
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  }

  function openSearch(query) {
    if (!location) return;
    const url = `https://www.google.com/maps/search/${query}/@${location.lat},${location.lng},13z`;
    window.open(url, "_blank", "noopener");
  }

  return (
    <div className="clinic-page">
      <header className="clinic-header">
        <h1 className="clinic-title">Find a Specialist</h1>
        <p className="brand-subtitle">
          Locate dermatologists and skin clinics near you for professional follow-up care.
        </p>
      </header>

      {/* Location Card */}
      <div className="glass-panel clinic-location-card">
        <div className="clinic-location-content">
          <div className="clinic-location-icon">📍</div>
          <div>
            <h3>Your Location</h3>
            {location ? (
              <p className="clinic-location-coords">
                Latitude: {location.lat.toFixed(4)}, Longitude: {location.lng.toFixed(4)}
              </p>
            ) : (
              <p className="clinic-location-hint">
                Allow location access to find nearby specialists.
              </p>
            )}
          </div>
        </div>
        {!location && (
          <button
            className={`btn btn-primary clinic-locate-btn ${isLocating ? "btn-loading" : ""}`}
            onClick={requestLocation}
            disabled={isLocating}
          >
            {isLocating ? "Locating..." : "📍 Share My Location"}
          </button>
        )}
        {locError && <p className="error-text">{locError}</p>}
      </div>

      {/* Specialty Cards Grid */}
      {location && (
        <div className="clinic-cards-grid fade-in">
          {SPECIALTIES.map((spec, i) => (
            <button
              key={i}
              className="clinic-specialty-card glass-panel"
              onClick={() => openSearch(spec.query)}
            >
              <span className="clinic-specialty-icon">{spec.icon}</span>
              <span className="clinic-specialty-label">{spec.label}</span>
              <span className="clinic-specialty-arrow">→</span>
            </button>
          ))}
        </div>
      )}

      {/* Quick Maps Link */}
      {location && (
        <div className="clinic-map-section fade-in">
          <a
            href={getGoogleMapsUrl(location.lat, location.lng)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary clinic-map-btn"
          >
            🗺️ Open Full Map Search
          </a>
        </div>
      )}

      {/* Info Cards */}
      <div className="clinic-info-section">
        <div className="glass-panel clinic-info-card">
          <h4>When to See a Dermatologist</h4>
          <ul className="clinic-info-list">
            <li>Any new or changing mole or skin growth</li>
            <li>Persistent skin rash lasting more than 2 weeks</li>
            <li>Skin lesions that bleed, itch, or don't heal</li>
            <li>Rapid changes in size, shape, or color of spots</li>
            <li>Family history of skin cancer</li>
          </ul>
        </div>
        <div className="glass-panel clinic-info-card">
          <h4>What to Bring to Your Appointment</h4>
          <ul className="clinic-info-list">
            <li>Your NeuroDermAI PDF screening report</li>
            <li>List of current medications and allergies</li>
            <li>Photos showing the condition over time</li>
            <li>Notes about symptoms (duration, triggers, pain)</li>
            <li>Insurance card and medical history</li>
          </ul>
        </div>
      </div>

      <footer className="disclaimer-footer" style={{ marginTop: "40px" }}>
        <p>
          <strong>Finding a Specialist</strong><br />
          This feature uses Google Maps to help you locate nearby dermatologists. 
          NeuroDermAI does not endorse or verify any specific healthcare provider. 
          Always verify credentials and reviews before scheduling an appointment.
        </p>
      </footer>
    </div>
  );
}
