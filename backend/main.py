from flask import Flask
import pandas as pd
import urllib.request
import json
import math
import random
from flask import Flask, jsonify

app = Flask(__name__)

@app.route("/api/meteors")
def meteors():
    data = get_earth_meteors()
    return jsonify(data)


def get_earth_meteors(api_key="pvuBRvSTJptTkhndzQKyAfIM6cmCud9gjPZauPr9"):
    url = f"https://api.nasa.gov/neo/rest/v1/neo/browse?api_key={api_key}"

    with urllib.request.urlopen(url) as response:
        data = json.loads(response.read().decode())

    asteroids = data['near_earth_objects']
    meteoritos_data = []

    # Densidades tipicas
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

        # Diámetro promedio y volumen
        if d_min and d_max:
            d_avg = (d_min + d_max) / 2
            volume = (math.pi / 6) * d_avg**3
        else:
            d_avg = None
            volume = None

        
        tipo = random.choice(list(densities.keys()))
        densidad_asumida = densities[tipo]

        # Masa estimada
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
    df_tierra = df[df['orbited_planet'] == "Earth"]

    
    return df_tierra.to_dict(orient="records")


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)