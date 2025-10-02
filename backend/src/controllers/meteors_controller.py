from flask import Blueprint, jsonify,request
from src.models.meteors_model import format_response
from src.services.meteors_service import get_earth_meteors

meteors_bp = Blueprint('meteors', __name__)

@meteors_bp.route('/api/meteors', methods=['GET'])
def meteors():
    # Leer query params
    page = int(request.args.get("page", 1))       # si no pasa page → 1
    per_page = int(request.args.get("per_page", 5))  # si no pasa per_page → 5

    df, status_code = get_earth_meteors()
    result = format_response(df, status_code, page=page, per_page=per_page)
    return jsonify(result), status_code
@meteors_bp.route('/api/simulate-impact', methods=['POST'])
def impact():
    pass