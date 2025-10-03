from flask_restful import Resource
from flask import request
from src.services.meteors_service import fetch_meteors, get_earth_meteors
from src.models.meteors_model import format_response

class MeteorsResource(Resource):
    def get(self):
        page = int(request.args.get("page", 1))
        per_page = int(request.args.get("per_page", 5))


        df, status_code = get_earth_meteors()
        result = format_response(df, status_code, page=page, per_page=per_page)
        return result, status_code
    
class Simulation(Resource):
    def post(self):
        data = request.get_json()
        size = data.get("size")  # tamaño en metros
        speed = data.get("speed")  # velocidad en km/s
        angle = data.get("angle")  # ángulo en grados
        latitude = data.get("latitude")  # latitud del impacto
        longitude = data.get("longitude")  # longitud del impacto

        print("Datos recibidos en /api/simulate-impact:", data)
        print(f"size={size}, speed={speed}, angle={angle}, latitude={latitude}, longitude={longitude}")
        return "OK", 200

