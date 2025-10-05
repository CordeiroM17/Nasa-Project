import math
import os
import requests
import rasterio

G = 9.81  # gravedad en m/s^2
JOULES_PER_KG_TNT = 4184.0
AIR_DENSITY_SEA_LEVEL = 1.225  # kg/m^3


def sphere_volume_m3(radius_m):
    return 4.0/3.0 * math.pi * radius_m**3

def kinetic_energy_j(diameter_km, density_kg_m3, velocity_kms):
    r_m = (diameter_km * 1000.0) / 2.0
    mass = density_kg_m3 * (4.0/3.0 * math.pi * r_m**3)
    v_m_s = velocity_kms * 1000.0
    return 0.5 * mass * v_m_s**2, mass

def energy_to_gigatons(energy_j):
    JOULES_PER_KG_TNT = 4184.0
    JOULES_PER_GIGATON_TNT = 1e9 * JOULES_PER_KG_TNT
    return energy_j / JOULES_PER_GIGATON_TNT

def estimate_breakup_altitude(diameter_km, density_kg_m3, velocity_kms, strength_pa=1e7):
    v = velocity_kms * 1000.0
    rho0 = 1.225
    H = 8500.0
    for h in range(60000, -1, -100):
        rho = rho0 * math.exp(-h / H)
        q = 0.5 * rho * v**2
        if q >= strength_pa:
            return True, h
    return False, None

def transient_crater_diameter_m(impactor_diameter_km, rho_impactor, rho_target, velocity_kms, impact_angle_deg):
    L0_m = impactor_diameter_km * 1000.0
    theta = math.radians(impact_angle_deg)
    G = 9.81
    Dtc_m = (1.161 *
            (rho_impactor / rho_target) ** (1.0/3.0) *
            (L0_m ** 0.78) *
            ((velocity_kms * 1000.0) ** 0.44) *
            (G ** -0.22) *
            (math.sin(theta) ** (1.0/3.0)))
    return Dtc_m

def final_crater_diameter_km(Dtc_km):
    if Dtc_km <= 2.56:
        return 1.25 * Dtc_km
    Dc = 3.2
    return 1.17 * (Dtc_km ** 1.13) / (Dc ** 0.13)

def transient_crater_depth_m(Dtc_m):
    return Dtc_m / (2.0 * math.sqrt(2.0))

def transient_crater_volume_m3(Dtc_m, depth_m):
    return math.pi * (Dtc_m**2) * depth_m / 8.0

def fireball_radius_m(energy_j):
    return 0.002 * (energy_j ** (1.0/3.0))

def thermal_burn_radii_with_horizon(energy_j, luminous_efficiency=3e-3, thresholds_1Mt_cal=None, lat=None):
    E_rad = luminous_efficiency * energy_j
    E_Mt = energy_j / 4.184e15
    scale = (E_Mt ** (1.0/6.0)) if E_Mt > 0 else 1.0
    def calcm2_to_Jm2(c):
        return c * 4.184e4
    thresholds_1Mt_cal = thresholds_1Mt_cal or {'1st': 3.16, '2nd': 6.21, '3rd': 9.56}
    thresholds_Jm2 = {k: calcm2_to_Jm2(v) for k, v in thresholds_1Mt_cal.items()}
    radii = {}
    for name, Q1Mt in thresholds_Jm2.items():
        Q_req = Q1Mt * scale
        r = math.sqrt(E_rad / (4.0 * math.pi * Q_req)) if Q_req > 0 else float('inf')
        radii[name] = r
    for k in radii:
        if radii[k] > 200000:
            radii[k] = 200000.0 + (radii[k] - 200000.0) * 0.3
    return radii

def overpressure_from_distance(energy_j, distance_m):
    JOULES_PER_KG_TNT = 4184.0
    W_kg = energy_j / JOULES_PER_KG_TNT
    if W_kg <= 0:
        return 0.0, 0.0
    Z = distance_m / (W_kg ** (1.0/3.0) + 1e-12)
    if Z < 0.1:
        p_kpa = 10000.0
    elif Z < 0.2:
        p_kpa = 2000.0
    elif Z < 0.5:
        p_kpa = 200.0
    elif Z < 1.0:
        p_kpa = 50.0
    elif Z < 2.0:
        p_kpa = 10.0
    elif Z < 4.0:
        p_kpa = 2.0
    else:
        p_kpa = 0.2
    p_pa = p_kpa * 1000.0
    v_ms = math.sqrt(2.0 * p_pa / 1.225) if p_pa>0 else 0.0
    return p_pa, v_ms

def earthquake_magnitude_from_energy(energy_j):
    if energy_j <= 0:
        return 0.0
    return (math.log10(energy_j) - 4.8) / 1.5

def is_ocean_at(lat, lon, bathymetry_file=None):
    if bathymetry_file is None:
        try:
            url = f"https://portal.opentopography.org/API/global_bathymetry?longitude={lon}&latitude={lat}"
            resp = requests.get(url, timeout=5)
            if resp.status_code == 200:
                data = resp.json()
                depth = float(data.get("elevation", 0))
                return (depth < 0, abs(depth))
        except Exception as e:
            print(f"Error consultando bathymetry API: {e}")
    elif bathymetry_file and os.path.exists(bathymetry_file):
        try:
            with rasterio.open(bathymetry_file) as ds:
                coords = [(lon, lat)]
                for val in ds.sample(coords):
                    depth = float(val[0])
                    return (depth < 0, abs(depth))
        except Exception as e:
            print(f"Error leyendo batimetría: {e}")
    lat = float(lat)
    if abs(lat) > 66:
        return (False, 0.0)
    if (int(abs(lat)) + int(abs(lon))) % 3 == 0:
        return (True, 4000.0)
    return (False, 0.0)

def calculate_full_impact(payload):
    diameter_km = float(payload.get("diameter_km"))
    density_kg_m3 = float(payload.get("density_kg_m3", 3000.0))
    velocity_kms = float(payload.get("velocity_kms"))
    impact_angle_deg = float(payload.get("impact_angle_deg", 45.0))
    lat = float(payload.get("latitude", 0.0))
    lon = float(payload.get("longitude", 0.0))
    target_type = payload.get("target_type", "auto")
    bathy = payload.get("bathymetry_file", None)
    E_j, mass_kg = kinetic_energy_j(diameter_km, density_kg_m3, velocity_kms)
    efficiency_factor = 0.2  # 20% de eficiencia energética
    E_j_effective = E_j * efficiency_factor
    E_gt = energy_to_gigatons(E_j_effective)
    E_megatons = E_j_effective / 4.184e15
    airburst, burst_alt_m = estimate_breakup_altitude(diameter_km, density_kg_m3, velocity_kms, strength_pa=1e7)
    if target_type == "land":
        is_ocean = False
        ocean_depth = 0.0
    elif target_type == "ocean":
        is_ocean = True
        ocean_depth = payload.get("ocean_depth_m", 4000.0)
    else:
        is_ocean, ocean_depth = is_ocean_at(lat, lon, bathymetry_file=bathy)
    Dtc_m = transient_crater_diameter_m(diameter_km, density_kg_m3, 2700.0, velocity_kms, impact_angle_deg)
    Dtc_km = Dtc_m / 1000.0
    Dfinal_km = final_crater_diameter_km(Dtc_km)
    depth_trans_m = transient_crater_depth_m(Dtc_m)
    melt_vol_m3 = 8.9e-12 * E_j * math.sin(math.radians(impact_angle_deg))
    transient_vol_m3 = transient_crater_volume_m3(Dtc_m, depth_trans_m)
    fireball_diam_km = (fireball_radius_m(E_j) * 2.0) / 1000.0
    thermal_radii = thermal_burn_radii_with_horizon(E_j)
    sample_distances_km = [1, 5, 10, 20, 50, 100, 200]
    shock_list = []
    for r_km in sample_distances_km:
        r_m = r_km * 1000.0
        p_pa, v_ms = overpressure_from_distance(E_j, r_m)
        shock_list.append({
            "distance_km": r_km,
            "overpressure_pa": p_pa,
            "overpressure_kpa": p_pa/1000.0,
            "peak_wind_m_s": v_ms
        })
    quake_mag = earthquake_magnitude_from_energy(E_j)
    return {
        "diameter_km": diameter_km,
        "density_kg_m3": density_kg_m3,
        "velocity_kms": velocity_kms,
        "impact_angle_deg": impact_angle_deg,
        "latitude": lat,
        "longitude": lon,
        "target_type": target_type,
        "E_j": E_j,
        "E_gt": E_gt,
        "E_megatons": E_megatons,
        "airburst": airburst,
        "burst_alt_m": burst_alt_m,
        "is_ocean": is_ocean,
        "ocean_depth": ocean_depth,
        "quake_mag": quake_mag,
        "quake_magnitude": quake_mag,
        "Dtc_m": Dtc_m,
        "Dtc_km": Dtc_km,
        "Dfinal_km": Dfinal_km,
        "depth_trans_m": depth_trans_m,
        "transient_vol_m3": transient_vol_m3,
        "transient_volume_m3": transient_vol_m3,
        "melt_volume_m3": melt_vol_m3,
        "fireball_diameter_km": fireball_diam_km,
        "thermal_radii": thermal_radii,
        "shock_list": shock_list
    }
