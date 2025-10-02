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
