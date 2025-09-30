from flask import Blueprint, jsonify
from src.models.meteors_model import get_earth_meteors

meteors_bp = Blueprint('meteors', __name__)

@meteors_bp.route('/api/meteors', methods=['GET'])
def meteors():
    data = get_earth_meteors()
    return jsonify(data)
@meteors_bp.route('/api/simulate-impact', methods=['POST'])
def impact():
    pass