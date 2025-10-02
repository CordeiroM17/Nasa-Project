import pandas as pd
import urllib.request
import json
import math
import random
import os
import time

_cache = {
    "data": None,
    "timestamp": 0
}
CACHE_TTL = 30*60  # 30 minutos en segundos

def fetch_meteors():
    """
    Se conecta a la API de NASA, procesa los asteroides y devuelve un DataFrame de meteoritos cercanos a la Tierra y el código HTTP.
    """

    api_key = os.getenv("NASA_API_KEY")
    page = random.randint(0, 10)
    url = f"https://api.nasa.gov/neo/rest/v1/neo/browse?api_key={api_key}&page={page}"
    print(f"consultando pagina nro {page}")
    
    try:
        with urllib.request.urlopen(url) as response:
            data = json.loads(response.read().decode())
        asteroids = data['near_earth_objects']
        meteoritos_data = []
        densities = {
            "Carbonaceous": 1500,
            "Stony": 2700,
            "Metallic": 7800
        }
        for asteroid in asteroids:
            close_approach_list = asteroid.get('close_approach_data', [])
            orbited_planet = close_approach_list[0]['orbiting_body'] if close_approach_list else None
            d_min = asteroid.get('estimated_diameter', {}).get('meters', {}).get('estimated_diameter_min')
            d_max = asteroid.get('estimated_diameter', {}).get('meters', {}).get('estimated_diameter_max')
            if d_min and d_max:
                d_avg = (d_min + d_max) / 2
                volume = (math.pi / 6) * d_avg**3
            else:
                d_avg = None
                volume = None
            tipo = random.choice(list(densities.keys()))
            densidad_asumida = densities[tipo]
            mass_est = volume * densidad_asumida if volume else None
            meteoritos_data.append({
                'id': asteroid.get('id'),
                'name': asteroid.get('name'),
                'diameter_min_m': d_min,
                'diameter_max_m': d_max,
                'diameter_avg_m': d_avg,
                'volume_m3': volume,
                'type': tipo,
                'estimated_density_kg_m3': densidad_asumida,
                'mass_kg': mass_est,
                'orbited_planet': orbited_planet
            })
        df = pd.DataFrame(meteoritos_data)
        return df, 200
    except Exception as e:
        return pd.DataFrame(), 500
    

    
def get_earth_meteors():
    """
    Devuelve los meteoritos cercanos a la Tierra.
    Usa cache por 30 minutos para evitar llamar siempre a la API.
    """
    now = time.time()
    if _cache["data"] is None or (now - _cache["timestamp"]) > CACHE_TTL:
        print("[CACHE] Consultando la API de la NASA...")
        df, status_code = fetch_meteors()
        _cache["data"] = (df, status_code)
        _cache["timestamp"] = now
    else:
        print("[CACHE] Usando datos en caché.")
    return _cache["data"]