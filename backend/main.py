from flask import Flask 
from flask_restful import Resource, Api
from src.routes.meteors import MeteorsResource, Simulation
from src.services.meteors_service import fetch_meteors
from src.models.meteors_model import format_response
from src.controllers.meteors_controller import meteors_bp
from flask_cors import CORS, cross_origin
import os

app = Flask(__name__)
api = Api(app)
frontend_url = ("https://nasa-project-front-gold.vercel.app")
CORS(app, resources={r"/api/*": {"origins": frontend_url}})

app.register_blueprint(meteors_bp)
api.add_resource(MeteorsResource, '/api/meteors')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=os.getenv("PORT"), debug=os.getenv("DEBUG"))