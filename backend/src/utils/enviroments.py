import os
from dotenv import load_dotenv


def getenviroments():
    load_dotenv()
    API_URL = os.getenv("API_URL")
    FRONT_URL = os.getenv("FRONT_URL")
    NASA_API_KEY = os.getenv("NASA_API_KEY")
    