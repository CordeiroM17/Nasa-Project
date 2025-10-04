
from flask import Blueprint, jsonify, request
from src.models.meteors_model import format_response
from src.services.meteors_service import get_earth_meteors
from src.models.impact_model import format_impact_result
from src.services.impact_service import calculate_full_impact

meteors_bp = Blueprint('meteors', __name__, url_prefix='/api')

@meteors_bp.route("/")
def ok():
    return("ok")


@meteors_bp.route('/meteors', methods=['GET'])
def meteors():
    # Leer query params
    page = int(request.args.get("page", 1))       # si no pasa page → 1
    per_page = int(request.args.get("per_page", 20)) 

    df, status_code = get_earth_meteors()
    print(f"DEBUG: DataFrame size before formatting: {len(df)}") 
    
    result = format_response(df, status_code, page=page, per_page=per_page)
    print(f"DEBUG: Data size being sent in JSON: {len(result.get('data', []))}") 
    
    return jsonify(result), status_code

@meteors_bp.route('/simulate-impact', methods=['POST', 'OPTIONS'])
def impact():
    data = request.get_json()
    print("Datos recibidos en /api/simulate-impact:", data)

    payload = {  
        "diameter_m": float(data.get("size", 0)),
        "density_kg_m3": float(data.get("density", 3000.0)),
        "velocity_kms": float(data.get("speed", 0)),
        "impact_angle_deg": float(data.get("angle", 45)),
        "latitude": float(data.get("latitude", 0)),
        "longitude": float(data.get("longitude", 0)),
        "target_type": "auto"
    }

    raw_result = calculate_full_impact(payload)
    formatted = format_impact_result(raw_result)
    return jsonify(formatted), 200

