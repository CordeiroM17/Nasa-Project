from flask import Flask 
from flask_restful import Resource, Api
from src.routes.meteors import MeteorsResource, Simulation
from src.services.meteors_service import fetch_meteors
from src.models.meteors_model import format_response
from flask_cors import CORS, cross_origin
import os

app = Flask(__name__)
api = Api(app)
frontend_url = os.getenv("FRONT_URL")
CORS(app, resources={r"/api/*": {"origins": frontend_url}})

api.add_resource(MeteorsResource, '/api/meteors')
api.add_resource(Simulation, '/api/simulate-impact')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=os.getenv("PORT"), debug=os.getenv("DEBUG"))