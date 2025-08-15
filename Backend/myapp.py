from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from datetime import datetime, timedelta
import os
import requests  # For external API calls
import logging

# Models (including Resource and EmergencyContact)
from models import db, User, MoodEntry, Therapist, TherapistAvailability, Booking, Resource, EmergencyContact

# ---------------- App setup ----------------
app = Flask(__name__, static_folder='../client/build', static_url_path='/')
CORS(app)
bcrypt = Bcrypt(app)

# JWT config
app.config['JWT_SECRET_KEY'] = 'super-secret-key-change-this'  # Change this in production!
jwt = JWTManager(app)

# DB config
basedir = os.path.abspath(os.path.dirname(__file__))
db_path = os.path.join(basedir, 'users.db')
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)
migrate = Migrate(app, db)

# Logging basic
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Default external resources URL
EXTERNAL_RESOURCES_URL = "https://example.com/api/mental-health-resources"

# ---------------- React Frontend ----------------
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    """Serve React frontend"""
    if path != "" and os.path.exists(app.static_folder + '/' + path):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

# ---------------- Therapist APIs ----------------
@app.route('/api/therapists', methods=['GET'])
def get_therapists():
    therapists = Therapist.query.all()
    result = []
    for t in therapists:
        availability = TherapistAvailability.query.filter_by(therapist_id=t.id).all()
        availability_data = {}
        for a in availability:
            availability_data.setdefault(a.day, []).append(a.slot)
        result.append({
            "id": t.id,
            "name": t.name,
            "photoUrl": t.photo_url,
            "specialization": t.specialization.split(",") if t.specialization else [],
            "qualifications": t.qualifications,
            "contact": t.contact,
            "location": t.location,
            "availability": [{"day": day, "slots": slots} for day, slots in availability_data.items()]
        })
    return jsonify(result)

# ---------------- Booking APIs ----------------
@app.route('/api/bookings', methods=['POST'])
@jwt_required()
def create_booking():
    data = request.json
    therapist_id = data.get('therapistId')
    day = data.get('day')
    slot = data.get('slot')
    user_email = get_jwt_identity()

    if not all([therapist_id, day, slot]):
        return jsonify({"error": "therapistId, day, and slot are required"}), 400

    user = User.query.filter_by(email=user_email).first()
    if not user:
        return jsonify({"error": "User not found"}), 404

    therapist = Therapist.query.get(therapist_id)
    if not therapist:
        return jsonify({"error": "Therapist not found"}), 404

    availability = TherapistAvailability.query.filter_by(
        therapist_id=therapist_id, day=day, slot=slot).first()
    if not availability:
        return jsonify({"error": "Selected slot not available"}), 400

    existing_booking = Booking.query.filter_by(
        therapist_id=therapist_id, day=day, slot=slot).first()
    if existing_booking:
        return jsonify({"error": "Selected slot already booked"}), 409

    booking = Booking(user_id=user.id, therapist_id=therapist_id, day=day, slot=slot)
    db.session.add(booking)
    db.session.commit()

    return jsonify({"message": "Booking successful", "booking": {
        "id": booking.id,
        "therapist": therapist.name,
        "day": day,
        "slot": slot
    }}), 201

@app.route('/api/bookings', methods=['GET'])
@jwt_required()
def get_user_bookings():
    user_email = get_jwt_identity()
    user = User.query.filter_by(email=user_email).first()
    if not user:
        return jsonify({"error": "User not found"}), 404

    bookings = Booking.query.filter_by(user_id=user.id).all()
    data = []
    for b in bookings:
        therapist = Therapist.query.get(b.therapist_id)
        data.append({
            "id": b.id,
            "therapist": therapist.name if therapist else "Unknown",
            "day": b.day,
            "slot": b.slot,
            "created_at": b.created_at.isoformat() if b.created_at else None,
            "therapist_id": b.therapist_id
        })
    return jsonify(data)

@app.route('/api/bookings/<int:booking_id>', methods=['DELETE'])
@jwt_required()
def delete_booking(booking_id):
    user_email = get_jwt_identity()
    user = User.query.filter_by(email=user_email).first()
    if not user:
        return jsonify({"error": "User not found"}), 404

    booking = Booking.query.get(booking_id)
    if not booking or booking.user_id != user.id:
        return jsonify({"error": "Booking not found or access denied"}), 404

    db.session.delete(booking)
    db.session.commit()
    return jsonify({"message": "Booking cancelled successfully"}), 200

@app.route('/api/bookings/<int:booking_id>', methods=['PUT'])
@jwt_required()
def update_booking(booking_id):
    data = request.json
    day = data.get('day')
    slot = data.get('slot')

    if not all([day, slot]):
        return jsonify({"error": "day and slot are required"}), 400

    user_email = get_jwt_identity()
    user = User.query.filter_by(email=user_email).first()
    if not user:
        return jsonify({"error": "User not found"}), 404

    booking = Booking.query.get(booking_id)
    if not booking or booking.user_id != user.id:
        return jsonify({"error": "Booking not found or access denied"}), 404

    availability = TherapistAvailability.query.filter_by(
        therapist_id=booking.therapist_id, day=day, slot=slot).first()
    if not availability:
        return jsonify({"error": "Selected slot not available"}), 400

    existing_booking = Booking.query.filter_by(
        therapist_id=booking.therapist_id, day=day, slot=slot).first()
    if existing_booking and existing_booking.id != booking_id:
        return jsonify({"error": "Selected slot already booked"}), 409

    booking.day = day
    booking.slot = slot
    db.session.commit()

    return jsonify({"message": "Booking updated successfully"}), 200

# ---------------- Mood Entry APIs ----------------
@app.route('/api/mood', methods=['POST'])
@jwt_required()
def add_mood():
    user_email = get_jwt_identity()
    user = User.query.filter_by(email=user_email).first()
    if not user:
        return jsonify({"error": "User not found"}), 404

    data = request.get_json()
    mood = data.get('mood')
    note = data.get('note', '')

    if not mood:
        return jsonify({'error': 'Mood is required'}), 400

    entry = MoodEntry(user_id=user.id, mood=mood, note=note)
    db.session.add(entry)
    db.session.commit()

    return jsonify({'message': 'Mood entry saved'}), 201

@app.route('/api/moods', methods=['GET'])
@jwt_required()
def get_moods():
    user_email = get_jwt_identity()
    user = User.query.filter_by(email=user_email).first()
    if not user:
        return jsonify([]), 200

    moods = MoodEntry.query.filter_by(user_id=user.id).order_by(MoodEntry.timestamp.desc()).all()

    result = [{
        'id': mood.id,
        'timestamp': mood.timestamp.isoformat() if mood.timestamp else None,
        'mood': mood.mood,
        'note': mood.note
    } for mood in moods]

    return jsonify(result), 200

@app.route('/api/mood/<int:mood_id>', methods=['DELETE'])
@jwt_required()
def delete_mood(mood_id):
    user_email = get_jwt_identity()
    user = User.query.filter_by(email=user_email).first()
    if not user:
        return jsonify({'error': 'User not found'}), 404

    mood_entry = MoodEntry.query.get(mood_id)
    if not mood_entry or mood_entry.user_id != user.id:
        return jsonify({'error': 'Mood entry not found or access denied'}), 404

    db.session.delete(mood_entry)
    db.session.commit()
    return jsonify({'message': 'Mood entry deleted'}), 200

@app.route('/api/mood/<int:mood_id>', methods=['PUT'])
@jwt_required()
def update_mood(mood_id):
    user_email = get_jwt_identity()
    user = User.query.filter_by(email=user_email).first()
    if not user:
        return jsonify({'error': 'User not found'}), 404

    mood_entry = MoodEntry.query.get(mood_id)
    if not mood_entry or mood_entry.user_id != user.id:
        return jsonify({'error': 'Mood entry not found or access denied'}), 404

    data = request.get_json()
    mood = data.get('mood')
    note = data.get('note')

    if mood:
        mood_entry.mood = mood
    if note is not None:
        mood_entry.note = note

    db.session.commit()
    return jsonify({'message': 'Mood entry updated'}), 200

# ---------------- User Auth ----------------
@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')

    if User.query.filter_by(email=email).first():
        return jsonify({'msg': 'User already exists'}), 400

    pw_hash = bcrypt.generate_password_hash(password).decode('utf-8')
    new_user = User(username=username, email=email, password=pw_hash)
    db.session.add(new_user)
    db.session.commit()

    return jsonify({'msg': 'User registered successfully'}), 201

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    user = User.query.filter_by(email=email).first()
    if not user or not bcrypt.check_password_hash(user.password, password):
        return jsonify({'msg': 'Invalid email or password'}), 401

    access_token = create_access_token(identity=email, expires_delta=timedelta(hours=1))
    return jsonify({'access_token': access_token}), 200

@app.route('/protected', methods=['GET'])
@jwt_required()
def protected():
    current_user = get_jwt_identity()
    return jsonify(logged_in_as=current_user), 200

# ---------------- Resource Library APIs ----------------
@app.route('/api/resources', methods=['GET'])
def get_resources():
    resources = Resource.query.order_by(Resource.created_at.desc()).all()
    return jsonify([r.to_dict() for r in resources]), 200

@app.route('/api/resources', methods=['POST'])
@jwt_required()
def add_resource():
    data = request.get_json()
    if not data.get('title') or not data.get('url'):
        return jsonify({"error": "title and url are required"}), 400

    tags_field = data.get('tags')
    if isinstance(tags_field, list):
        tags_csv = ",".join([str(t).strip() for t in tags_field if str(t).strip()])
    else:
        tags_csv = tags_field or ""

    published_at = None
    if data.get('published_at'):
        try:
            published_at = datetime.fromisoformat(data['published_at'])
        except Exception:
            published_at = None

    resource = Resource(
        title=data['title'],
        summary=data.get('summary', ''),
        url=data['url'],
        source=data.get('source', ''),
        resource_type=data.get('resource_type', 'article'),
        tags=tags_csv,
        published_at=published_at,
        verified=bool(data.get('verified', False))
    )
    db.session.add(resource)
    db.session.commit()

    return jsonify({"message": "Resource added successfully", "id": resource.id}), 201

# ---------------- Run App ----------------
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
