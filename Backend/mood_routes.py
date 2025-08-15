from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, MoodEntry

mood_bp = Blueprint('mood_bp', __name__)

# POST: Add new mood entry
@mood_bp.route('/api/mood', methods=['POST'])
@jwt_required()
def add_mood():
    user_email = get_jwt_identity()
    data = request.get_json()

    mood = data.get('mood')
    note = data.get('note')

    if not mood or not isinstance(mood, str) or not mood.strip():
        return jsonify({'msg': 'Mood is required and must be a non-empty string'}), 400

    try:
        entry = MoodEntry(user_email=user_email, mood=mood.strip(), note=note)
        db.session.add(entry)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({'msg': 'Failed to save mood entry', 'error': str(e)}), 500

    return jsonify({'msg': 'Mood entry saved'}), 201

# GET: Fetch all mood entries for the user
@mood_bp.route('/api/moods', methods=['GET'])
@jwt_required()
def get_moods():
    user_email = get_jwt_identity()
    try:
        entries = MoodEntry.query.filter_by(user_email=user_email).order_by(MoodEntry.timestamp.desc()).all()
    except Exception as e:
        return jsonify({'msg': 'Failed to fetch mood entries', 'error': str(e)}), 500

    result = [
        {
            'id': e.id,
            'timestamp': e.timestamp.isoformat(),
            'mood': e.mood,
            'note': e.note
        }
        for e in entries
    ]
    return jsonify(result), 200

# DELETE: Delete a mood entry by ID
@mood_bp.route('/api/mood/<int:entry_id>', methods=['DELETE'])
@jwt_required()
def delete_mood(entry_id):
    user_email = get_jwt_identity()
    
    entry = MoodEntry.query.filter_by(id=entry_id, user_email=user_email).first()
    
    if not entry:
        return jsonify({'msg': 'Mood entry not found or not authorized'}), 404

    try:
        db.session.delete(entry)
        db.session.commit()
        return jsonify({'msg': 'Mood entry deleted'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'msg': 'Failed to delete mood entry', 'error': str(e)}), 500
