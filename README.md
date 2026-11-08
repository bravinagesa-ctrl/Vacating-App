# Hama: find a home in Kenya by area

Django REST + PostGIS backend, React + Vite + Tailwind + Leaflet frontend.
"Hama" comes from the Swahili *kuhama*, to move house.

## What is included

- Map and area search (landmarks, estates), radius search, "search this area", filters shared through the URL
- Listings with photos, amenities, verified badge, featured placement, saved homes
- Area pages data: water, security, transport and internet scores, nearest matatu stage
- Roles: tenant, landlord, agent, admin (listing rules enforced on the server)
- Africa's Talking: SMS to the landlord when someone sends an inquiry
- M-Pesa Daraja: STK push for featuring a listing, with a secret callback URL
- Place search through Google Geocoding, or free OpenStreetMap Nominatim when no key is set

## 1. Prerequisites

- Python 3.10+, Node 18+
- PostgreSQL with the PostGIS extension
- GDAL and GEOS libraries (GeoDjango needs them)
  - Ubuntu/Debian: `sudo apt install postgresql postgis gdal-bin libgdal-dev libgeos-dev`
  - macOS: `brew install postgresql postgis gdal geos`
  - Windows: install PostgreSQL + PostGIS with Stack Builder, then install GDAL (OSGeo4W or the `GDAL` wheel)
    and put the DLL paths in `GDAL_LIBRARY_PATH` / `GEOS_LIBRARY_PATH` in `backend/.env`

## 2. Database

```sql
CREATE DATABASE hama;
\c hama
CREATE EXTENSION postgis;
```

## 3. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env              # then fill in the values
python manage.py makemigrations accounts listings payments
python manage.py migrate
python manage.py seed_areas
python manage.py createsuperuser
python manage.py runserver
```

Open http://127.0.0.1:8000/admin/ to edit areas (set the real scores), verify listings and view payments.

## 4. Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Open http://localhost:5173.

## 5. Where the keys go (`backend/.env`)

| Setting | Where to get it |
| --- | --- |
| `GOOGLE_MAPS_API_KEY` (optional) | Google Cloud Console, enable the Geocoding API, restrict the key to your server IP |
| `AT_USERNAME`, `AT_API_KEY` | africastalking.com dashboard. Use `sandbox` while testing |
| `MPESA_CONSUMER_KEY`, `MPESA_CONSUMER_SECRET`, `MPESA_PASSKEY` | developer.safaricom.co.ke, your Daraja app (Lipa na M-Pesa Online) |
| `MPESA_CALLBACK_BASE_URL` | Public HTTPS URL of the backend. In development run `ngrok http 8000` and paste the https URL |
| `MPESA_CALLBACK_TOKEN` | Any long random string you make up |
| `DJANGO_SECRET_KEY` | `python -c "from django.core.management.utils import get_random_secret_key as g; print(g())"` |

Frontend (`frontend/.env`): `VITE_API_URL`, and optionally `VITE_TILE_URL` for a production tile provider.

## 6. Before going live

- Set `DJANGO_DEBUG=False`, a real `DJANGO_ALLOWED_HOSTS`, and your frontend URL in `CORS_ALLOWED_ORIGINS`
- Store photos on S3 or Cloudinary instead of the server disk
- Switch map tiles from the public OpenStreetMap server to a tile provider
- Move M-Pesa from `sandbox` to `production` with your own paybill/till
- Add the Kenya Data Protection Act basics: a privacy policy, and consent for storing phone numbers
- Consider httpOnly cookies instead of localStorage for JWT tokens
