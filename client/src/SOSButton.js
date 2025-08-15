import React, { useState } from "react";

export default function SOSButton() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const token = localStorage.getItem("token");

  const sendSOS = () => {
    if (!window.confirm("Are you sure you want to send an SOS alert?")) return;

    if (!navigator.geolocation) {
      alert("Geolocation not supported by your browser.");
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;

        fetch("http://localhost:5000/api/sos",{
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ location: `Lat: ${latitude}, Long: ${longitude}` }),
        })
          .then((res) => res.json())
          .then((data) => setMessage(data.msg || "SOS sent!"))
          .catch(() => setMessage("Failed to send SOS."))
          .finally(() => setLoading(false));
      },
      () => {
        alert("Unable to get your location.");
        setLoading(false);
      }
    );
  };

  const styles = {
    container: {
      position: "fixed",
      bottom: 30,
      right: 30,
      textAlign: "center",
      zIndex: 1000,
    },
    button: {
      fontSize: "1.5rem",
      padding: "1rem 2rem",
      backgroundColor: "crimson",
      color: "white",
      border: "none",
      borderRadius: "12px",
      cursor: loading ? "not-allowed" : "pointer",
      boxShadow: "0 4px 12px rgba(220,20,60,0.7)",
      transition: "transform 0.2s ease, box-shadow 0.2s ease",
      userSelect: "none",
    },
    buttonHover: {
      transform: "scale(1.05)",
      boxShadow: "0 6px 16px rgba(220,20,60,0.9)",
    },
    message: {
      marginTop: "0.75rem",
      fontWeight: "600",
      color: "#b22222",
      textShadow: "0 0 5px rgba(255, 0, 0, 0.7)",
    },
  };

  const [hover, setHover] = useState(false);

  return (
    <div style={styles.container}>
      <button
        onClick={sendSOS}
        disabled={loading}
        style={{ ...styles.button, ...(hover ? styles.buttonHover : {}) }}
        aria-label="Send emergency SOS alert"
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        {loading ? "Sending SOS..." : "🚨 Send SOS"}
      </button>
      {message && <p style={styles.message}>{message}</p>}
    </div>
  );
}
