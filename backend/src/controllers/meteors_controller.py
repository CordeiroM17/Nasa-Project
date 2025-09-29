from flask import Blueprint, jsonify
from src.models.meteors import get_earth_meteors

meteors_bp = Blueprint('meteors', __name__)

@meteors_bp.route('/api/meteors')
def meteors():
    data = get_earth_meteors()
    return jsonify(data)
