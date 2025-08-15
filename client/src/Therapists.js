import React, { useState, useEffect } from "react";
import { FaCalendarAlt, FaClock, FaCheckCircle, FaTimesCircle, FaUserCircle } from "react-icons/fa";
import "./Therapists.css";

const Therapists = () => {
  const [therapists, setTherapists] = useState([]);
  const [bookedSlots, setBookedSlots] = useState({});
  const [selectedDays, setSelectedDays] = useState({});
  const [popupMessage, setPopupMessage] = useState("");
  const [popupType, setPopupType] = useState("success");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("http://localhost:5000/api/therapists")
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load therapists. Status: ${res.status}`);
        return res.json();
      })
      .then(setTherapists)
      .catch((err) => {
        console.error(err);
        setPopupType("error");
        setPopupMessage("Failed to load therapists.");
      });
  }, []);

  // Fetch user bookings on mount or after booking
  const fetchUserBookings = () => {
    fetch("http://localhost:5000/api/bookings", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load bookings. Status: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        const booked = {};
        data.forEach((b) => {
          // NOTE: your backend response must include therapist_id, day, slot
          booked[`${b.therapist_id}_${b.day}_${b.slot}`] = true;
        });
        setBookedSlots(booked);
      })
      .catch((err) => {
        console.error(err);
        setPopupType("error");
        setPopupMessage("Failed to load your bookings.");
      });
  };

  useEffect(() => {
    fetchUserBookings();
  }, []);

  const handleDayChange = (therapistId, day) => {
    setSelectedDays((prev) => ({ ...prev, [therapistId]: day }));
  };

  const handleBooking = async (therapistId, day, slot) => {
    if (!day) {
      setPopupType("error");
      setPopupMessage("Please select a day first!");
      return;
    }

    const key = `${therapistId}_${day}_${slot}`;
    if (bookedSlots[key]) {
      setPopupType("error");
      setPopupMessage("This slot is already booked!");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ therapistId: String(therapistId), day, slot }),
      });

      const data = await res.json();

      if (res.ok) {
        setBookedSlots((prev) => ({ ...prev, [key]: true }));
        setPopupType("success");
        setPopupMessage(`Successfully booked ${day} at ${slot}!`);
      } else {
        setPopupType("error");
        setPopupMessage(data.error || "Booking failed.");
      }
    } catch (err) {
      console.error(err);
      setPopupType("error");
      setPopupMessage("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const closePopup = () => setPopupMessage("");

  return (
    <div className="therapist-container">
      <h2>Therapist Directory</h2>
      {therapists.length === 0 && <p>Loading therapists...</p>}

      {therapists.map((therapist) => (
        <div key={therapist.id} className="therapist-card">
          <div className="avatar-circle" aria-label={`Avatar of ${therapist.name}`}>
            {therapist.photoUrl ? (
              <img src={therapist.photoUrl} alt={`${therapist.name} profile`} />
            ) : (
              <FaUserCircle size={50} color="#4CAF50" />
            )}
          </div>

          <div className="therapist-info">
            <h3>{therapist.name}</h3>
            <p>
              <FaCalendarAlt className="icon" /> <strong>Specialization:</strong>{" "}
              {therapist.specialization?.join(", ")}
            </p>
            <p>
              <FaCheckCircle className="icon" /> <strong>Qualifications:</strong>{" "}
              {therapist.qualifications}
            </p>
            <p>
              <strong>Contact:</strong> {therapist.contact}
            </p>
            <p>
              <strong>Location:</strong> {therapist.location}
            </p>

            <label className="day-select-label">
              <FaCalendarAlt className="icon" />
              <strong>Select Day:</strong>
              <select
                value={selectedDays[therapist.id] || ""}
                onChange={(e) => handleDayChange(therapist.id, e.target.value)}
              >
                <option value="" disabled>
                  -- Select Day --
                </option>
                {therapist.availability.map((a) => (
                  <option key={a.day} value={a.day}>
                    {a.day}
                  </option>
                ))}
              </select>
            </label>

            <div className="slots">
              {(selectedDays[therapist.id]
                ? therapist.availability.find((a) => a.day === selectedDays[therapist.id])?.slots || []
                : []
              ).map((slot) => {
                const key = `${therapist.id}_${selectedDays[therapist.id]}_${slot}`;
                const isBooked = bookedSlots[key];
                return (
                  <div
                    key={slot}
                    className={`slot ${isBooked ? "booked" : "available"}`}
                    title={isBooked ? "Already booked" : "Available"}
                  >
                    <FaClock className="icon" />
                    <span>{slot}</span>
                    {!isBooked ? (
                      <button
                        disabled={loading}
                        onClick={() => handleBooking(therapist.id, selectedDays[therapist.id], slot)}
                        aria-label={`Book slot at ${slot}`}
                      >
                        Book
                      </button>
                    ) : (
                      <FaTimesCircle className="booked-icon" title="Booked" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ))}

      {popupMessage && (
        <div
          className={`popup ${popupType === "success" ? "popup-success" : "popup-error"}`}
          onClick={closePopup}
          role="alert"
          aria-live="assertive"
          tabIndex={0}
        >
          <div className="popup-content">
            {popupType === "success" ? (
              <FaCheckCircle className="popup-icon success-icon" />
            ) : (
              <FaTimesCircle className="popup-icon error-icon" />
            )}
            <p>{popupMessage}</p>
            <button onClick={closePopup} aria-label="Close popup">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Therapists;
