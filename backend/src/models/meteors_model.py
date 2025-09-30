def format_response(df, status_code):
    """
    Recibe un DataFrame y el código HTTP y devuelve un diccionario con:
    {
      "status": "success" o "error",
      "message": "texto explicativo con código",
      "code": código HTTP,
      "data": lista de meteoritos en dicts
    }
    """
    if status_code == 200 and not df.empty:
        return {
            "status": "success",
            "message": f"Toro Bravo {status_code}",
            "code": status_code,
            "data": df.to_dict(orient="records")
        }
    else:
        return {
            "status": "error",
            "message": f"Pincho. Código {status_code}",
            "code": status_code,
            "data": {}
        }
