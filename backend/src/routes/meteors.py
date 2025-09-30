from flask_restful import Resource
from src.services.meteors_service import fetch_meteors
from src.models.meteors_model import format_response

class MeteorsResource(Resource):
    def get(self):
        df, status_code = fetch_meteors()
        result = format_response(df, status_code)
        return result, status_code
