from flask_restful import Resource
from flask import request
from src.services.meteors_service import  get_earth_meteors
from src.models.meteors_model import format_response
from src.services.impact_service import calculate_full_impact
from src.models.impact_model import format_impact_result

class MeteorsResource(Resource):
    def get(self):
        page = int(request.args.get("page", 1))
        per_page = int(request.args.get("per_page", 20))


        df, status_code = get_earth_meteors()
        result = format_response(df, status_code, page=page, per_page=per_page)
        return result, status_code
    
class Simulation(Resource):
    def post(self):
        data = request.get_json()
        print("Datos recibidos en /api/simulate-impact:", data)

        payload = {
            "diameter_km": float(data.get("size", 0)) / 1000.0,  # convertir metros a km
            "density_kg_m3": float(data.get("density", 3000.0)),
            "velocity_kms": float(data.get("speed", 0)),
            "impact_angle_deg": float(data.get("angle", 45)),
            "latitude": float(data.get("latitude", 0)),
            "longitude": float(data.get("longitude", 0)),
            "target_type": "auto"
        }

        raw_result = calculate_full_impact(payload)
        formatted = format_impact_result(raw_result)
        return formatted, 200

