import React, { useEffect, useState } from "react";

export default function EmergencyContacts() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ name: "", phone: "", email: "", relationship: "" });
  const token = localStorage.getItem("token");

  const API_BASE_URL = "http://localhost:5000";

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/emergency-contacts`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch contacts");
        const data = await res.json();
        setContacts(data);
      } catch (err) {
        console.error(err);
        setError("Failed to load contacts");
      } finally {
        setLoading(false);
      }
    };

    fetchContacts();
  }, [token]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE_URL}/api/emergency-contacts`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to add contact");
      await res.json();

      setForm({ name: "", phone: "", email: "", relationship: "" });

      const updatedRes = await fetch(`${API_BASE_URL}/api/emergency-contacts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const updatedData = await updatedRes.json();
      setContacts(updatedData);
    } catch (err) {
      console.error(err);
      setError("Failed to add contact");
    }
  }

  async function handleDelete(id) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/emergency-contacts/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to delete contact");

      const updatedRes = await fetch(`${API_BASE_URL}/api/emergency-contacts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const updatedData = await updatedRes.json();
      setContacts(updatedData);
    } catch (err) {
      console.error(err);
      setError("Failed to delete contact");
    }
  }

  if (loading) return <p>Loading contacts...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Emergency Contacts</h2>

      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          type="text"
          name="name"
          placeholder="Name *"
          value={form.name}
          onChange={handleChange}
          required
          style={styles.input}
        />
        <input
          type="tel"
          name="phone"
          placeholder="Phone *"
          value={form.phone}
          onChange={handleChange}
          required
          style={styles.input}
        />
        <input
          type="email"
          name="email"
          placeholder="Email (optional)"
          value={form.email}
          onChange={handleChange}
          style={styles.input}
        />
        <input
          type="text"
          name="relationship"
          placeholder="Relationship (optional)"
          value={form.relationship}
          onChange={handleChange}
          style={styles.input}
        />
        <button type="submit" style={styles.addButton}>Add Contact</button>
      </form>

      <ul style={styles.list}>
        {contacts.map((c) => (
          <li key={c.id} style={styles.listItem}>
            <div>
              <strong>{c.name}</strong> ({c.relationship || "No relation"}) - {c.phone}{" "}
              {c.email && <span>&lt;{c.email}&gt;</span>}
            </div>
            <button
              onClick={() => handleDelete(c.id)}
              aria-label={`Delete contact ${c.name}`}
              style={styles.deleteButton}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: 600,
    margin: "20px auto",
    padding: 20,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  },
  heading: {
    textAlign: "center",
    color: "#333",
  },
  form: {
    display: "flex",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 20,
    justifyContent: "space-between",
  },
  input: {
    flex: "1 1 45%",
    padding: "10px 12px",
    fontSize: 16,
    borderRadius: 4,
    border: "1px solid #ccc",
  },
  addButton: {
    flex: "1 1 100%",
    padding: "12px 0",
    backgroundColor: "#007bff",
    color: "white",
    border: "none",
    borderRadius: 4,
    cursor: "pointer",
    fontSize: 18,
    fontWeight: "600",
    transition: "background-color 0.3s ease",
  },
  list: {
    listStyleType: "none",
    paddingLeft: 0,
  },
  listItem: {
    display: "flex",
    justifyContent: "space-between",
    padding: "12px 16px",
    marginBottom: 8,
    backgroundColor: "#fff",
    borderRadius: 4,
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    alignItems: "center",
  },
  deleteButton: {
    backgroundColor: "#dc3545",
    border: "none",
    color: "white",
    padding: "6px 12px",
    borderRadius: 4,
    cursor: "pointer",
    fontWeight: "600",
    fontSize: 14,
  },
};
