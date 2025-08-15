import React, { useEffect, useState } from "react";

const API_URL = "http://localhost:5000/api/resources";

export default function Resources() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch resources from backend
  useEffect(() => {
    fetch(API_URL)
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch resources");
        return res.json();
      })
      .then(data => {
        setResources(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading)
    return <p style={{ fontStyle: "italic", color: "#666" }}>Loading resources...</p>;

  if (error)
    return <p style={{ color: "crimson", fontWeight: "bold" }}>Error: {error}</p>;

  if (resources.length === 0)
    return <p style={{ fontStyle: "italic" }}>No resources available.</p>;

  return (
    <section style={{ maxWidth: 900, margin: "1rem auto", padding: "0 1rem" }}>
      <h2 style={{ textAlign: "center", marginBottom: "1.5rem", color: "#333" }}>
        📚 Resource Library
      </h2>

      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {resources.map(resource => (
          <li
            key={resource.id}
            style={{
              marginBottom: 24,
              padding: 20,
              borderRadius: 8,
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              backgroundColor: "#fff",
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = "scale(1.02)";
              e.currentTarget.style.boxShadow = "0 4px 14px rgba(0,0,0,0.15)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
            }}
            tabIndex={0}
            aria-label={`Resource titled ${resource.title}`}
          >
            <h3 style={{ marginTop: 0, marginBottom: 8, color: "#0056b3" }}>
              {resource.title}
            </h3>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "10px",
                marginBottom: 12,
                fontSize: 14,
                color: "#555",
              }}
            >
              <span
                style={{
                  backgroundColor: "#e0f0ff",
                  color: "#007acc",
                  padding: "3px 8px",
                  borderRadius: 12,
                  fontWeight: "600",
                }}
              >
                {resource.resource_type?.toUpperCase() || "UNKNOWN"}
              </span>

              <span
                style={{
                  backgroundColor: "#f0f4f8",
                  color: "#555",
                  padding: "3px 8px",
                  borderRadius: 12,
                }}
              >
                Source: {resource.source || "Unknown"}
              </span>

              {resource.verified && (
                <span
                  style={{
                    backgroundColor: "#d4edda",
                    color: "#155724",
                    padding: "3px 8px",
                    borderRadius: 12,
                    fontWeight: "600",
                  }}
                  aria-label="Verified resource"
                  title="Verified resource"
                >
                  ✔ Verified
                </span>
              )}
            </div>

            <p
              style={{
                lineHeight: 1.5,
                color: "#333",
                marginBottom: 16,
                minHeight: 60,
              }}
            >
              {resource.summary || resource.description || "No description available."}
            </p>

            {resource.tags && resource.tags.length > 0 && (
              <p style={{ marginBottom: 16, fontSize: 14, color: "#666" }}>
                <strong>Tags:</strong>{" "}
                {resource.tags.map((tag, i) => (
                  <span
                    key={tag}
                    style={{
                      backgroundColor: "#eef6fb",
                      color: "#007acc",
                      padding: "3px 8px",
                      borderRadius: 12,
                      marginRight: 6,
                      fontWeight: 500,
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </p>
            )}

            {resource.url && (
              <a
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-block",
                  padding: "8px 14px",
                  backgroundColor: "#007acc",
                  color: "white",
                  textDecoration: "none",
                  borderRadius: 6,
                  fontWeight: "600",
                  boxShadow: "0 2px 6px rgba(0, 122, 204, 0.5)",
                  transition: "background-color 0.3s ease",
                }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#005fa3")}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = "#007acc")}
                aria-label={`Open resource titled ${resource.title} in a new tab`}
              >
                🔗 View Resource
              </a>
            )}

            {resource.published_at && (
              <p
                style={{
                  marginTop: 12,
                  fontSize: 12,
                  color: "#888",
                  fontStyle: "italic",
                }}
              >
                Published on: {new Date(resource.published_at).toLocaleDateString()}
              </p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
