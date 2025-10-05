def format_impact_result(raw):
    """
    Recibe los valores crudos de calculate_full_impact y arma el diccionario result con formato final.
    """
    return {
        "input": {
            "diameter_m": raw.get("diameter_m"),
            "density_kg_m3": raw.get("density_kg_m3"),
            "velocity_kms": raw.get("velocity_kms"),
            "impact_angle_deg": raw.get("impact_angle_deg"),
            "latitude": raw.get("latitude"),
            "longitude": raw.get("longitude"),
            "target_type": raw.get("target_type"),
        },
        "energy": {
            "joules": raw.get("E_j"),
            "gigatons_tnt": raw.get("E_gt"),
            "megatons_tnt": raw.get("E_megatons")
        },
        "atmospheric_entry": {
            "airburst": raw.get("airburst"),
            "breakup_altitude_m": raw.get("burst_alt_m")
        },
        "surface": {
            "is_ocean": raw.get("is_ocean"),
            "ocean_depth_m": raw.get("ocean_depth")
        },
        "crater": {
            "transient_diameter_m": raw.get("Dtc_m"),
            "final_diameter_m": raw.get("Dfinal_km", 0) * 1000,
            "transient_depth_m": raw.get("depth_trans_m"),
            "transient_volume_m3": raw.get("transient_vol_m3") or raw.get("transient_volume_m3"),
            "melt_volume_m3": raw.get("melt_vol_m3")
        },
        "fireball": {
            "diameter_m": raw.get("fireball_diameter_m"),
            "thermal_radii_m": raw.get("thermal_radii")
        },
        "shock_samples": raw.get("shock_list"),
        "earthquake": {
            "magnitude": raw.get("quake_mag") or raw.get("quake_magnitude")
        },
        "mitigation_measures": [
            {
                "phase": "Before Impact",
                "actions": [
                    "Evacuate the predicted impact zone according to local emergency instructions.",
                    "Secure emergency supplies: water, non-perishable food, first aid kits, flashlights, and batteries.",
                    "Stay informed via radio, TV, or official online channels for impact updates.",
                    "Reinforce shelters or safe rooms if staying indoors is necessary.",
                    "Develop a family or community emergency plan including meeting points and communication methods."
                ]
            },
            {
                "phase": "During Impact",
                "actions": [
                    "Take cover in a basement, storm shelter, or structurally reinforced area.",
                    "Avoid windows and heavy objects that can shatter or fall.",
                    "Keep communication devices charged and nearby for emergency alerts.",
                    "Follow official instructions for staying indoors or evacuation."
                ]
            },
            {
                "phase": "After Impact",
                "actions": [
                    "Check yourself and others for injuries and provide first aid.",
                    "Avoid debris, unstable structures, and flooded areas.",
                    "Use masks or cloth to avoid inhaling dust and ash.",
                    "Follow official evacuation orders if necessary.",
                    "Report hazards or casualties to local authorities.",
                    "Do not enter contaminated water or fire-damaged areas without guidance.",
                    "Monitor news for updates on air quality, aftershocks, or secondary hazards (fires, tsunamis).",
                    "Assist neighbors and community members if safe to do so."
                ]
            }
        ],
        "notes": [
            "Modelos y constantes basados en Collins et al. (Earth Impact Effects) para cráter/energía/fireball.",
            "Atmospheric breakup: modelo simplificado por presión dinámica; cuerpos débiles pueden fragmentarse más alto.",
            "Shock wave mapping uses a coarse empirical scaling; para daños locales usar Kingery-Bulmash u otra tabla detallada.",
            "Tsunami model: estimación simple basada en volumen desplazado por cráter; para predicción costera precisa usar modelos hidrodinámicos (e.g., SWAN, FUNWAVE) y datos batimétricos GEBCO/ETOPO."
        ]
    }
