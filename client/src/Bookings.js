import React, { useState, useEffect } from "react";
import { FaTrash, FaEdit, FaSave, FaTimes } from "react-icons/fa";
import "./Bookings.css";

const Bookings = () => {
  const [bookings, setBookings] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editedDay, setEditedDay] = useState("");
  const [editedSlot, setEditedSlot] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const fetchBookings = () => {
    setLoadingBookings(true);
    fetch("http://localhost:5000/api/bookings", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to fetch");
        }
        return res.json();
      })
      .then((data) => {
        console.log("Bookings data from backend:", data);
        if (Array.isArray(data)) {
          setBookings(data);
          setErrorMsg("");
        } else {
          throw new Error("Invalid data format");
        }
      })
      .catch((err) => {
        console.error(err);
        setErrorMsg("Failed to load bookings.");
        setSuccessMsg("");
      })
      .finally(() => setLoadingBookings(false));
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleDelete = async (bookingId) => {
    if (!window.confirm("Are you sure you want to cancel this booking?")) return;
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/bookings/${bookingId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (res.ok) {
        setSuccessMsg("Booking cancelled successfully.");
        setErrorMsg("");
        fetchBookings();
      } else {
        setErrorMsg("Failed to cancel booking.");
        setSuccessMsg("");
      }
    } catch {
      setErrorMsg("Network error.");
      setSuccessMsg("");
    }
    setLoading(false);
  };

  const startEditing = (booking) => {
    setEditingId(booking.id);
    setEditedDay(booking.day);
    setEditedSlot(booking.slot);
    setErrorMsg("");
    setSuccessMsg("");
  };

  const cancelEditing = () => {
    setEditingId(null);
    setErrorMsg("");
    setSuccessMsg("");
  };

  const saveChanges = async (bookingId) => {
    if (!editedDay.trim() || !editedSlot.trim()) {
      setErrorMsg("Day and Slot cannot be empty.");
      setSuccessMsg("");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/bookings/${bookingId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ day: editedDay.trim(), slot: editedSlot.trim() }),
      });
      if (res.ok) {
        setSuccessMsg("Booking updated successfully.");
        setErrorMsg("");
        setEditingId(null);
        fetchBookings();
      } else {
        const data = await res.json();
        setErrorMsg(data.error || "Failed to update booking.");
        setSuccessMsg("");
      }
    } catch {
      setErrorMsg("Network error.");
      setSuccessMsg("");
    }
    setLoading(false);
  };

  return (
    <div className="bookings-container">
      <h2 className="heading">Your Bookings</h2>

      {loadingBookings && <p>Loading your bookings...</p>}

      {errorMsg && <div className="message error">{errorMsg}</div>}
      {successMsg && <div className="message success">{successMsg}</div>}

      {!loadingBookings && Array.isArray(bookings) && bookings.length === 0 && (
        <p className="no-bookings">You have no bookings.</p>
      )}

      <ul className="booking-list">
        {Array.isArray(bookings) &&
          bookings.map((booking) => (
            <li key={booking.id} className="booking-item">
              {editingId === booking.id ? (
                <div className="booking-editing">
                  <input
                    type="text"
                    value={editedDay}
                    onChange={(e) => setEditedDay(e.target.value)}
                    placeholder="Day"
                    className="edit-input"
                    disabled={loading}
                  />
                  <input
                    type="text"
                    value={editedSlot}
                    onChange={(e) => setEditedSlot(e.target.value)}
                    placeholder="Slot (e.g. 10:00)"
                    className="edit-input"
                    disabled={loading}
                  />
                  <div className="button-group">
                    <button
                      className="btn save-btn"
                      onClick={() => saveChanges(booking.id)}
                      disabled={loading}
                      title="Save changes"
                    >
                      <FaSave />
                    </button>
                    <button
                      className="btn cancel-btn"
                      onClick={cancelEditing}
                      disabled={loading}
                      title="Cancel editing"
                    >
                      <FaTimes />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="booking-info">
                    <span>
                      Therapist: <strong>{booking.therapist}</strong>
                    </span>
                    <span>
                      Day: <strong>{booking.day}</strong>
                    </span>
                    <span>
                      Slot: <strong>{booking.slot}</strong>
                    </span>
                  </div>
                  <div className="booking-actions">
                    <button
                      className="btn edit-btn"
                      onClick={() => startEditing(booking)}
                      aria-label="Edit booking"
                      title="Edit booking"
                    >
                      <FaEdit />
                    </button>
                    <button
                      className="btn delete-btn"
                      onClick={() => handleDelete(booking.id)}
                      aria-label="Cancel booking"
                      disabled={loading}
                      title="Cancel booking"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
      </ul>
    </div>
  );
};

export default Bookings;
