# Clinic_stock

Lightweight internal clinic stock console.

## Features

- Search stock by item name, SKU, or location
- Filter by clinic and category
- Sort by name, stock, or category
- Open item details from the list or direct link (`#item/<id>`)
- Correct stock counts after physical checks (saved in local browser storage)
- Offline-friendly static UI for ward tablets on patchy wifi

## Run locally

Because this is a static app, you can serve it with any simple web server:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.
