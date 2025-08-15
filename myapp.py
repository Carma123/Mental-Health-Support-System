from flask import Flask, request, jsonify
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
app = Flask(__name__)
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

# Default external resources URL (replace with a real provider if you have one)
EXTERNAL_RESOURCES_URL = "https://example.com/api/mental-health-resources"


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
        return jsonify([]), 200  # Or 404 if preferred

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


# ---------------- Resource Library APIs (updated & extended) ----------------

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

    # convert tags array -> csv if necessary
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


@app.route('/api/resources/fetch', methods=['POST'])
@jwt_required()
def fetch_and_store_resources():
    """
    Fetch resources from a third-party API (URL provided in JSON body 'url' or fallback to EXTERNAL_RESOURCES_URL).
    For each item returned (expects array of resource-like objects), we attempt to insert into Resource table
    if no resource with same URL exists.
    """
    body = request.get_json(silent=True) or {}
    external_url = body.get('url') or EXTERNAL_RESOURCES_URL
    max_items = int(body.get('max_items', 50))

    try:
        resp = requests.get(external_url, timeout=10)
    except Exception as e:
        logger.exception("External fetch failed")
        return jsonify({"error": "Failed to fetch external resources", "details": str(e)}), 500

    if resp.status_code != 200:
        return jsonify({"error": "External API returned non-200", "status": resp.status_code}), 502

    try:
        items = resp.json()
    except Exception as e:
        logger.exception("Failed parsing external JSON")
        return jsonify({"error": "Invalid JSON from external API", "details": str(e)}), 502

    if not isinstance(items, list):
        # If provider returns a dict with a list under key like 'data', try that
        if isinstance(items, dict) and 'data' in items and isinstance(items['data'], list):
            items = items['data']
        else:
            return jsonify({"error": "External API did not return a list of resources"}), 502

    created = []
    skipped = []
    processed = 0

    for it in items:
        if processed >= max_items:
            break
        processed += 1

        # Map expected fields from external item to our Resource fields (best-effort)
        title = it.get('title') or it.get('headline') or it.get('name')
        url = it.get('url') or it.get('link')
        if not url or not title:
            skipped.append({"reason": "missing title or url", "item": it})
            continue

        # check existing by url
        existing = Resource.query.filter_by(url=url).first()
        if existing:
            skipped.append({"url": url, "reason": "exists"})
            continue

        summary = it.get('summary') or it.get('description') or it.get('excerpt') or ""
        source = it.get('source') or it.get('publisher') or ""
        resource_type = it.get('resource_type') or it.get('type') or "article"

        tags_field = it.get('tags') or it.get('keywords') or []
        if isinstance(tags_field, list):
            tags_csv = ",".join([str(t).strip() for t in tags_field if str(t).strip()])
        else:
            tags_csv = str(tags_field or "")

        published_at = None
        if it.get('published_at'):
            try:
                published_at = datetime.fromisoformat(it['published_at'])
            except Exception:
                published_at = None

        # Create Resource
        try:
            r = Resource(
                title=title,
                summary=summary,
                url=url,
                source=source,
                resource_type=resource_type,
                tags=tags_csv,
                published_at=published_at,
                verified=False
            )
            db.session.add(r)
            db.session.flush()  # get id without commit
            created.append({"id": r.id, "url": url})
        except Exception as e:
            logger.exception("Failed to create Resource row")
            skipped.append({"url": url, "reason": f"db error: {str(e)}"})
            db.session.rollback()
            continue

    # commit all created rows
    try:
        db.session.commit()
    except Exception as e:
        logger.exception("Final commit failed")
        db.session.rollback()
        return jsonify({"error": "Failed to save fetched resources", "details": str(e)}), 500

    return jsonify({
        "message": "Fetch complete",
        "processed": processed,
        "created_count": len(created),
        "created": created,
        "skipped": skipped
    }), 200

# Get all emergency contacts for current user
@app.route('/api/emergency-contacts', methods=['GET'])
@jwt_required()
def get_emergency_contacts():
    user_email = get_jwt_identity()
    user = User.query.filter_by(email=user_email).first()
    if not user:
        return jsonify({"error": "User not found"}), 404

    contacts = EmergencyContact.query.filter_by(user_id=user.id).all()
    return jsonify([{
        "id": c.id,
        "name": c.name,
        "phone": c.phone,
        "email": c.email,
        "relationship": c.relationship
    } for c in contacts])

# Add a new emergency contact
@app.route('/api/emergency-contacts', methods=['POST'])
@jwt_required()
def add_emergency_contact():
    user_email = get_jwt_identity()
    user = User.query.filter_by(email=user_email).first()
    if not user:
        return jsonify({"error": "User not found"}), 404

    data = request.json
    name = data.get("name")
    phone = data.get("phone")
    email = data.get("email")
    relationship = data.get("relationship")

    if not name or not phone:
        return jsonify({"error": "Name and phone are required"}), 400

    contact = EmergencyContact(
        user_id=user.id,
        name=name,
        phone=phone,
        email=email,
        relationship=relationship,
    )
    db.session.add(contact)
    db.session.commit()
    return jsonify({"msg": "Emergency contact added", "id": contact.id}), 201

# Delete an emergency contact
@app.route('/api/emergency-contacts/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_emergency_contact(id):
    user_email = get_jwt_identity()
    user = User.query.filter_by(email=user_email).first()
    if not user:
        return jsonify({"error": "User not found"}), 404

    contact = EmergencyContact.query.filter_by(id=id, user_id=user.id).first()
    if not contact:
        return jsonify({"error": "Contact not found"}), 404

    db.session.delete(contact)
    db.session.commit()
    return jsonify({"msg": "Emergency contact deleted"}), 200

# Send SOS alert
@app.route("/api/sos", methods=["POST"])
@jwt_required()
def send_sos():
    user_email = get_jwt_identity()

    # fetch emergency contacts for this user
    user = User.query.filter_by(email=user_email).first()
    contacts = []
    if user:
        contacts = EmergencyContact.query.filter_by(user_id=user.id).all()

    # For now, just simulate sending SOS and return list of contacts we would notify
    sos_message = {
        "status": "success",
        "message": f"SOS alert sent for {user_email}!",
        "timestamp": datetime.utcnow().isoformat(),
        "notified_contacts": [{"name": c.name, "phone": c.phone, "email": c.email} for c in contacts]
    }

    # TODO: integrate real notification channels (SMS/email/push) here

    return jsonify(sos_message), 200


# ---------------- Run App ----------------

if __name__ == '__main__':
    app.run(debug=True)
