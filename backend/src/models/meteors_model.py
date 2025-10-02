import math

def format_response(df, status_code, page, per_page):
    """
    Recibe un DataFrame y el código HTTP y devuelve un diccionario con paginación:
    {
      "status": "success" o "error",
      "message": "texto explicativo con código",
      "code": código HTTP,
      "data": [...],
      "pagination": {
         "page": int,
         "per_page": int,
         "total": int,
         "total_pages": int
      }
    }
    """
    if status_code == 200 and not df.empty:
        total = len(df)
        total_pages = math.ceil(total / per_page)
        start = (page - 1) * per_page
        end = start + per_page
        data_page = df.iloc[start:end].to_dict(orient="records")

        return {
            "status": "success",
            "message": f"Succes {status_code}",
            "code": status_code,
            "data": data_page,
            "pagination": {
                "page": page,
                "per_page": per_page,
                "total": total,
                "total_pages": total_pages
            }
        }
    else:
        return {
            "status": "error",
            "message": f"Error. Código {status_code}",
            "code": status_code,
            "data": [],
            "pagination": {}
        }
