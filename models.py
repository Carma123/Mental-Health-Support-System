from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

# -----------------------
# User Model
# -----------------------
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(128), nullable=False)

    # Relationships
    moods = db.relationship("MoodEntry", backref="user", lazy=True)
    bookings = db.relationship("Booking", backref="user", lazy=True)

    def __repr__(self):
        return f"<User {self.email}>"


# -----------------------
# Mood Entry Model
# -----------------------
class MoodEntry(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    mood = db.Column(db.String(50), nullable=False)
    note = db.Column(db.Text, nullable=True)

    def __repr__(self):
        return f"<MoodEntry User:{self.user_id} @ {self.timestamp} - Mood: {self.mood}>"


# -----------------------
# Therapist Model
# -----------------------
class Therapist(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False)
    photo_url = db.Column(db.String(300))
    specialization = db.Column(db.String(300))  # e.g. "Anxiety, Depression"
    qualifications = db.Column(db.String(300))
    contact = db.Column(db.String(150))
    location = db.Column(db.String(150))

    # Relationships
    availabilities = db.relationship("TherapistAvailability", backref="therapist", lazy=True)
    bookings = db.relationship("Booking", backref="therapist", lazy=True)

    def __repr__(self):
        return f"<Therapist {self.name}>"


# -----------------------
# Therapist Availability Model
# -----------------------
class TherapistAvailability(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    therapist_id = db.Column(db.Integer, db.ForeignKey("therapist.id"), nullable=False)
    day = db.Column(db.String(20), nullable=False)  # e.g. "Monday"
    slot = db.Column(db.String(10), nullable=False)  # e.g. "09:00"

    def __repr__(self):
        return f"<Availability Therapist:{self.therapist_id} {self.day} {self.slot}>"


# -----------------------
# Booking Model
# -----------------------
class Booking(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    therapist_id = db.Column(db.Integer, db.ForeignKey("therapist.id"), nullable=False)
    day = db.Column(db.String(20), nullable=False)
    slot = db.Column(db.String(10), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<Booking User:{self.user_id} Therapist:{self.therapist_id} {self.day} {self.slot}>"


# -----------------------
# Resource Model
# -----------------------
class Resource(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(300), nullable=False)
    summary = db.Column(db.Text)
    url = db.Column(db.String(1000))
    source = db.Column(db.String(100))  # e.g. "YouTube", "MedlinePlus"
    resource_type = db.Column(db.String(20))  # "article" or "video"
    tags = db.Column(db.String(300))  # comma separated
    published_at = db.Column(db.DateTime, nullable=True)
    verified = db.Column(db.Boolean, default=False)  # admin flag
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "summary": self.summary,
            "url": self.url,
            "source": self.source,
            "resource_type": self.resource_type,
            "tags": [t.strip() for t in (self.tags or "").split(",") if t.strip()],
            "published_at": self.published_at.isoformat() if self.published_at else None,
            "verified": self.verified
        }

class EmergencyContact(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.String(20), nullable=False)
    email = db.Column(db.String(120), nullable=True)
    relationship = db.Column(db.String(50), nullable=True)

    def __repr__(self):
        return f"<EmergencyContact {self.name} ({self.relationship})>"

