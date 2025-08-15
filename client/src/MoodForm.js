import React, { useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from './AuthContext';

const MoodForm = () => {
  const { authToken } = useContext(AuthContext);
  const [mood, setMood] = useState('');
  const [note, setNote] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState(false);
  const [selectFocused, setSelectFocused] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError(false);

    try {
      await axios.post(
        'http://localhost:5000/api/mood',
        { mood, note },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      setMessage('Mood logged successfully!');
      setMood('');
      setNote('');
    } catch {
      setMessage('Error logging mood.');
      setError(true);
    }
  };

  const styles = {
    container: {
      maxWidth: 400,
      margin: '40px auto',
      padding: 20,
      borderRadius: 10,
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      backgroundColor: '#fff',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      color: '#333',
    },
    heading: {
      textAlign: 'center',
      color: '#1abc9c',
      marginBottom: 20,
    },
    label: {
      display: 'block',
      marginBottom: 6,
      fontWeight: '600',
    },
    select: {
      width: '100%',
      padding: '10px 40px 10px 12px',
      borderRadius: 6,
      border: '1.5px solid #ccc',
      fontSize: 16,
      marginBottom: 20,
      boxSizing: 'border-box',
      fontFamily: 'inherit',
      color: '#333',
      backgroundColor: '#fff',
      appearance: 'none',
      WebkitAppearance: 'none',
      MozAppearance: 'none',
      backgroundImage: `url("data:image/svg+xml;utf8,<svg fill='%23333' height='20' viewBox='0 0 24 24' width='20' xmlns='http://www.w3.org/2000/svg'><path d='M7 10l5 5 5-5z'/></svg>")`,
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'right 12px center',
      backgroundSize: '20px 20px',
      backgroundClip: 'padding-box',
      cursor: 'pointer',
      transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
      outline: 'none',
      ...(selectFocused
        ? {
            borderColor: '#1abc9c',
            boxShadow: '0 0 5px rgba(26, 188, 156, 0.5)',
          }
        : {}),
    },
    textarea: {
      width: '100%',
      padding: 10,
      borderRadius: 6,
      border: '1.5px solid #ccc',
      fontSize: 16,
      minHeight: 80,
      resize: 'vertical',
      marginBottom: 20,
      boxSizing: 'border-box',
      fontFamily: 'inherit',
      transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
      outline: 'none',
    },
    textareaFocused: {
      borderColor: '#1abc9c',
      boxShadow: '0 0 5px rgba(26, 188, 156, 0.5)',
    },
    button: {
      width: '100%',
      padding: '12px',
      backgroundColor: '#1abc9c',
      color: 'white',
      border: 'none',
      borderRadius: 6,
      fontSize: 18,
      cursor: 'pointer',
      fontWeight: '700',
      transition: 'background-color 0.3s ease',
    },
    message: {
      marginTop: 20,
      fontWeight: '600',
      color: error ? '#e74c3c' : '#2ecc71',
      textAlign: 'center',
      userSelect: 'none',
    },
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Log Your Mood</h2>
      <form onSubmit={handleSubmit}>
        <label style={styles.label}>Mood:</label>
        <select
          style={styles.select}
          value={mood}
          onChange={(e) => setMood(e.target.value)}
          onFocus={() => setSelectFocused(true)}
          onBlur={() => setSelectFocused(false)}
          required
        >
          <option value="">Select mood</option>
          <option value="happy">😊 Happy</option>
          <option value="sad">😢 Sad</option>
          <option value="angry">😠 Angry</option>
          <option value="anxious">😰 Anxious</option>
          <option value="neutral">😐 Neutral</option>
        </select>

        <label style={styles.label}>Note:</label>
        <textarea
          style={{
            ...styles.textarea,
            ...(note ? styles.textareaFocused : {}),
          }}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Write something..."
          onFocus={() => setSelectFocused(true)}
          onBlur={() => setSelectFocused(false)}
        />

        <button
          type="submit"
          style={styles.button}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#149d89')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#1abc9c')}
        >
          Submit
        </button>

        {message && <p style={styles.message}>{message}</p>}
      </form>
    </div>
  );
};

export default MoodForm;
