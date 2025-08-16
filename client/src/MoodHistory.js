import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer
} from 'recharts';

// Use environment variable or fallback to localhost
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Mood scale to assign importance or severity level
const moodScale = {
  angry: 1,
  sad: 2,
  neutral: 3,
  good: 4,
  happy: 5
};

// Mood colors for visual indicators
const moodColors = {
  angry: { bg: '#FDEDEC', text: '#C0392B' },
  sad: { bg: '#EBF5FB', text: '#2980B9' },
  neutral: { bg: '#F4F6F6', text: '#7F8C8D' },
  good: { bg: '#E8F8F5', text: '#27AE60' },
  happy: { bg: '#FEF9E7', text: '#F1C40F' },
  default: { bg: '#F0F0F0', text: '#333' }
};

// Mood emojis for UX
const moodIcons = {
  happy: '😊',
  good: '🙂',
  neutral: '😐',
  sad: '😢',
  angry: '😠',
};

// Format date for display
const formatDate = (ts) =>
  new Date(ts).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

// CSS spinner style
const spinnerStyle = {
  border: '6px solid #f3f3f3',
  borderTop: '6px solid #4F46E5',
  borderRadius: '50%',
  width: 40,
  height: 40,
  animation: 'spin 1s linear infinite',
  margin: '40px auto',
};

// Inject spinner keyframes once
if (typeof window !== 'undefined' && !document.getElementById('spinner-keyframes')) {
  const style = document.createElement('style');
  style.id = 'spinner-keyframes';
  style.innerHTML = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
}

const MoodHistory = () => {
  const [moods, setMoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [openIndex, setOpenIndex] = useState(null);

  const fetchMoods = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/moods`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const converted = response.data.map(mood => {
        const parsedDate = new Date(mood.timestamp || mood.date);
        return {
          ...mood,
          moodValue: moodScale[mood.mood.toLowerCase()] || 0,
          date: parsedDate.getTime() || Date.now()
        };
      });

      converted.sort((a, b) => a.date - b.date);
      setMoods(converted);
    } catch (err) {
      console.error('Error fetching moods:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMoods();
  }, []);

  const deleteMood = async (id) => {
    if (!window.confirm('Are you sure you want to delete this mood entry?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/api/mood/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMoods(prev => prev.filter(entry => entry.id !== id));
    } catch (err) {
      console.error('Failed to delete mood entry:', err);
      alert('Failed to delete mood entry.');
    }
  };

  const filteredMoods = useMemo(() => {
    return moods.filter(mood => {
      if (!dateFrom && !dateTo) return true;
      if (dateFrom && mood.date < new Date(dateFrom).getTime()) return false;
      if (dateTo && mood.date > new Date(dateTo).getTime()) return false;
      return true;
    });
  }, [moods, dateFrom, dateTo]);

  const toggleOpen = (idx) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  if (loading) {
    return <div style={spinnerStyle} />;
  }

  if (moods.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 40, color: '#6B7280', fontStyle: 'italic' }}>
        <span role="img" aria-label="empty" style={{ fontSize: 30, marginRight: 8 }}>😔</span> No moods logged yet. Start by adding one!
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: 800,
      margin: '0 auto',
      padding: 20,
      fontFamily: 'Arial, sans-serif',
      boxSizing: 'border-box',
      width: '95%',
      minWidth: 320
    }}>
      <h2 style={{ color: '#4F46E5', fontWeight: '800', fontSize: 32, marginBottom: 20 }}>
        Your Mood History
      </h2>

      {/* Date Filters */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <div>
          <label htmlFor="dateFrom" style={{ fontWeight: 600 }}>From:</label><br />
          <input
            type="date"
            id="dateFrom"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            style={{ padding: 6, borderRadius: 4, border: '1px solid #ccc' }}
          />
        </div>
        <div>
          <label htmlFor="dateTo" style={{ fontWeight: 600 }}>To:</label><br />
          <input
            type="date"
            id="dateTo"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            style={{ padding: 6, borderRadius: 4, border: '1px solid #ccc' }}
          />
        </div>
      </div>

      {/* Mood History Accordion */}
      <div>
        {filteredMoods.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#9CA3AF', fontStyle: 'italic' }}>
            No moods for this date range.
          </div>
        ) : (
          filteredMoods.map((mood, idx) => {
            const lowerMood = mood.mood.toLowerCase();
            const colors = moodColors[lowerMood] || moodColors.default;
            const isOpen = openIndex === idx;

            return (
              <div
                key={mood.id}
                onClick={() => toggleOpen(idx)}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') toggleOpen(idx); }}
                role="button"
                tabIndex={0}
                style={{
                  backgroundColor: colors.bg,
                  color: colors.text,
                  marginBottom: 15,
                  borderRadius: 10,
                  boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                  padding: 15,
                  cursor: 'pointer',
                  userSelect: 'none',
                  border: isOpen ? '2px solid #4F46E5' : '2px solid transparent',
                  transition: 'border-color 0.3s ease',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: '700', fontSize: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 24 }}>{moodIcons[lowerMood] || '❓'}</span>
                    <span>{mood.mood.charAt(0).toUpperCase() + mood.mood.slice(1)}</span>
                  </div>
                  <div style={{ fontSize: 14, opacity: 0.75 }}>{formatDate(mood.date)}</div>
                </div>
                {isOpen && (
                  <div
                    style={{
                      marginTop: 10,
                      fontSize: 14,
                      color: '#374151',
                      borderTop: `1px solid ${colors.text}`,
                      paddingTop: 10,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 10
                    }}
                  >
                    <div>
                      {mood.note ? mood.note : <span style={{ color: '#9CA3AF' }}>No note provided.</span>}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // prevent accordion toggle
                        deleteMood(mood.id);
                      }}
                      style={{
                        alignSelf: 'flex-start',
                        backgroundColor: '#DC2626',
                        color: 'white',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: 13
                      }}
                      onMouseOver={e => e.currentTarget.style.backgroundColor = '#B91C1C'}
                      onMouseOut={e => e.currentTarget.style.backgroundColor = '#DC2626'}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Mood Trend Chart */}
      <h3 style={{ marginTop: 50, marginBottom: 20, fontSize: 24, color: '#4F46E5' }}>
        Mood Trend Chart
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={filteredMoods}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tickFormatter={(tick) =>
              new Date(tick).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric'
              })
            }
          />
          <YAxis
            dataKey="moodValue"
            domain={[1, 5]}
            ticks={[1, 2, 3, 4, 5]}
            tickFormatter={(val) => {
              const entry = Object.entries(moodScale).find(([_, v]) => v === val);
              return entry ? entry[0] : '';
            }}
          />
          <Tooltip
            formatter={(value, name) => {
              if (name === 'moodValue') {
                const moodName = Object.entries(moodScale).find(([_, v]) => v === value)?.[0] || '';
                return [moodName.charAt(0).toUpperCase() + moodName.slice(1), 'Mood'];
              }
              return [value, name];
            }}
            labelFormatter={(label) =>
              new Date(label).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })
            }
          />
          <Line
            type="monotone"
            dataKey="moodValue"
            stroke="#4F46E5"
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MoodHistory;
