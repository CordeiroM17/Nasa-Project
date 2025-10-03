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
CACHE_TTL = 30 * 60  # 30 minutos

def fetch_meteors():
    api_key = os.getenv("NASA_API_KEY")
    if not api_key:
        print("[ERROR] No se encontró NASA_API_KEY")
        return pd.DataFrame(), 401

    page = random.randint(0, 10)
    url = f"https://api.nasa.gov/neo/rest/v1/neo/browse?api_key={api_key}&page={page}"
    print(f"[INFO] Consultando página {page}")

    try:
        with urllib.request.urlopen(url) as response:
            data = json.loads(response.read().decode())

        asteroids = data.get("near_earth_objects", [])
        meteoritos_data = []
        densities = {"Carbonaceous": 1500, "Stony": 2700, "Metallic": 7800}

        for asteroid in asteroids:
            close_approach_list = asteroid.get("close_approach_data", [])
            if not close_approach_list:
                continue

            velocidades = []
            for ca in close_approach_list:
                rel_vel = ca.get("relative_velocity", {})
                vel_str = rel_vel.get("kilometers_per_second")
                print(f"[DEBUG] vel_str: {vel_str}")
                if vel_str is not None:
                    try:
                        v = float(vel_str)
                        if not math.isnan(v):
                            velocidades.append(v)
                    except:
                        continue

            if not velocidades:
                continue  

            velocidad_max = max(velocidades)
            tipo = random.choice(list(densities.keys()))
            densidad_asumida = densities[tipo]
            orbited_planet = close_approach_list[0].get("orbiting_body", None)

            meteoritos_data.append({
                "id": asteroid.get("id"),
                "name": asteroid.get("name"),
                "type": tipo,
                "density": densidad_asumida,
                "orbited_planet": orbited_planet,
                "speed": velocidad_max
            })

        df = pd.DataFrame(meteoritos_data)
        print(f"[INFO] Se encontraron {len(df)} meteoritos con velocidad válida")
        return df, 200

    except Exception as e:
        print("[ERROR] Excepción al consultar la API:", e)
        return pd.DataFrame(), 500


def get_earth_meteors():
    now = time.time()
    if _cache["data"] is None or (now - _cache["timestamp"]) > CACHE_TTL:
        print("[CACHE] Consultando API de NASA...")
        df, code = fetch_meteors()
        _cache["data"] = (df, code)
        _cache["timestamp"] = now
    else:
        print("[CACHE] Usando caché")
    return _cache["data"]
