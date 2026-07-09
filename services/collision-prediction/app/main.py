import os
import math
from datetime import datetime, timedelta
from flask import Flask, request, jsonify

app = Flask(__name__)

def compute_tle_checksum(line):
    """
    Computes the standard NORAD TLE checksum for a line.
    """
    chk = 0
    for char in line[:68]:
        if char.isdigit():
            chk += int(char)
        elif char == '-':
            chk += 1
    return str(chk % 10)

def get_pseudo_tle(orbital_object):
    """
    Constructs a syntactically valid TLE Line 1 and 2 from Keplerian orbital elements
    if the original TLE is not present.
    """
    tle1 = orbital_object.get('tleLine1') or orbital_object.get('tle_line1')
    tle2 = orbital_object.get('tleLine2') or orbital_object.get('tle_line2')
    if tle1 and tle2:
        return tle1, tle2

    cat_num = str(orbital_object.get('catalogNumber', '99999'))
    cat_num_5 = cat_num.zfill(5)[:5]
    
    inclination = float(orbital_object.get('inclination', 51.64))
    eccentricity = float(orbital_object.get('eccentricity', 0.001))
    altitude = float(orbital_object.get('altitudeKm', 400))
    
    # Earth gravitational constant and radius
    GM = 398600.4418  # km^3/s^2
    RE = 6378.137  # km
    a = RE + altitude
    T = 2.0 * math.pi * math.sqrt((a ** 3) / GM)  # orbital period in seconds
    mean_motion = 86400.0 / T  # revolutions per day
    
    ecc_str = f"{int(round(eccentricity * 1e7)):07d}"[:7]
    
    now = datetime.utcnow()
    year_2d = str(now.year)[-2:]
    day_of_year = now.timetuple().tm_yday
    frac_day = (now.hour * 3600 + now.minute * 60 + now.second) / 86400.0
    epoch_day = f"{day_of_year + frac_day:012.8f}"
    
    # Line 1: elements, padded to 68 characters, then checksum
    line1 = f"1 {cat_num_5}U 98067A   {year_2d}{epoch_day}  .00001000  00000-0  10000-3 0  999"
    line1 = line1.ljust(68)
    line1 = line1 + compute_tle_checksum(line1)
    
    # Line 2: elements, padded to 68 characters, then checksum
    line2 = f"2 {cat_num_5} {inclination:8.4f}   0.0000 {ecc_str}   0.0000   0.0000 {mean_motion:11.8f}0000"
    line2 = line2.ljust(68)
    line2 = line2 + compute_tle_checksum(line2)
    
    return line1, line2

def eci_to_lla(r, jd, fr):
    """
    Converts ECI coordinates (x, y, z) in km to geodetic latitude, longitude, and altitude.
    Uses the IAU 1982 Greenwich Mean Sidereal Time (GMST) and WGS84 ellipsoid.
    """
    x, y, z = r[0], r[1], r[2]
    
    # Julian centuries since J2000.0
    t = ((jd - 2451545.0) + fr) / 36525.0
    
    # Greenwich Mean Sidereal Time (GMST) in radians
    gmst = 6.697374558 + 2400.051336 * t + 0.000025862 * (t ** 2)
    gmst_rad = (gmst % 24.0) * (2.0 * math.pi / 24.0)
    
    # Calculate Longitude
    phi = math.atan2(y, x)
    longitude_rad = phi - gmst_rad
    # Wrap longitude to [-pi, pi]
    longitude_rad = (longitude_rad + math.pi) % (2.0 * math.pi) - math.pi
    longitude = math.degrees(longitude_rad)
    
    # WGS84 ellipsoid constants
    a = 6378.137  # Earth semi-major axis in km
    f = 1.0 / 298.257223563  # Flattening
    e2 = 2.0 * f - f * f  # Eccentricity squared
    
    r_xy = math.sqrt(x*x + y*y)
    
    # Iteratively solve for Latitude
    lat_rad = math.atan2(z, r_xy)
    for _ in range(5):
        sin_lat = math.sin(lat_rad)
        N = a / math.sqrt(1.0 - e2 * sin_lat * sin_lat)
        lat_rad = math.atan2(z + e2 * N * sin_lat, r_xy)
        
    latitude = math.degrees(lat_rad)
    
    # Calculate Altitude
    sin_lat = math.sin(lat_rad)
    N = a / math.sqrt(1.0 - e2 * sin_lat * sin_lat)
    if r_xy > 0.001:
        altitude = r_xy / math.cos(lat_rad) - N
    else:
        altitude = abs(z) - a * (1.0 - f)
        
    return latitude, longitude, altitude

def generate_placeholder_trajectory(orbital_object, duration, interval):
    """
    Fallback placeholder orbit propagation algorithm.
    """
    trajectory = []
    steps = int(duration // interval)
    start_time = datetime.utcnow()
    
    altitude = float(orbital_object.get('altitudeKm', 400))
    velocity = float(orbital_object.get('velocityKmPerSec', 7.7))
    
    for i in range(steps + 1):
        time_offset = i * interval
        timestamp = start_time + timedelta(minutes=time_offset)
        
        angle = (time_offset * velocity) / 100.0
        latitude = math.sin(angle) * 70.0
        longitude = ((angle * 180.0 / math.pi) % 360.0) - 180.0
        
        trajectory.append({
            "timestamp": timestamp.isoformat() + "Z",
            "timeOffsetMinutes": time_offset,
            "latitude": round(latitude, 4),
            "longitude": round(longitude, 4),
            "altitudeKm": altitude,
            "velocityKmPerSec": velocity
        })
        
    return trajectory

def run_sgp4_propagation(orbital_object, duration, interval):
    """
    Propagates the orbit of an orbital object using the SGP4 engine.
    """
    from sgp4.api import Satrec, jday
    
    tle1, tle2 = get_pseudo_tle(orbital_object)
    satellite = Satrec.twoline2rv(tle1, tle2)
    
    trajectory = []
    steps = int(duration // interval)
    start_time = datetime.utcnow()
    
    for i in range(steps + 1):
        time_offset = i * interval
        timestamp = start_time + timedelta(minutes=time_offset)
        
        # Calculate Julian date and fraction of day
        jd, fr = jday(timestamp.year, timestamp.month, timestamp.day,
                      timestamp.hour, timestamp.minute, timestamp.second + timestamp.microsecond / 1e6)
        
        e, r, v = satellite.sgp4(jd, fr)
        if e != 0:
            raise Exception(f"SGP4 propagation failed with error code: {e}")
            
        lat, lon, alt = eci_to_lla(r, jd, fr)
        
        # Calculate velocity magnitude
        vel = math.sqrt(v[0]**2 + v[1]**2 + v[2]**2)
        
        trajectory.append({
            "timestamp": timestamp.isoformat() + "Z",
            "timeOffsetMinutes": time_offset,
            "latitude": round(lat, 4),
            "longitude": round(lon, 4),
            "altitudeKm": round(alt, 2),
            "velocityKmPerSec": round(vel, 4),
            "eciPosition": [round(r[0], 4), round(r[1], 4), round(r[2], 4)],
            "eciVelocity": [round(v[0], 4), round(v[1], 4), round(v[2], 4)],
            "eci_position": [round(r[0], 4), round(r[1], 4), round(r[2], 4)],
            "eci_velocity": [round(v[0], 4), round(v[1], 4), round(v[2], 4)]
        })
        
    return trajectory

@app.route('/')
def index():
    return "Collision Prediction Service"

@app.route('/health')
def health():
    return {"status": "ok", "service": "collision-prediction"}

@app.route('/propagate', methods=['POST'])
def propagate():
    data = request.get_json() or {}
    orbital_object = data.get('orbitalObject')
    duration = int(data.get('durationMinutes', 60))
    interval = int(data.get('intervalMinutes', 5))
    
    if not orbital_object:
        return jsonify({"error": "orbitalObject is required"}), 400
        
    try:
        trajectory = run_sgp4_propagation(orbital_object, duration, interval)
        scientific = True
        source = "SGP4 Propagation Engine"
    except Exception as err:
        # Graceful fallback to geometric simulation
        trajectory = generate_placeholder_trajectory(orbital_object, duration, interval)
        scientific = False
        source = f"Placeholder Engine (SGP4 Fallback: {str(err)})"
        
    response = {
        "connected": True,
        "scientific": scientific,
        "source": source,
        "trajectory": trajectory,
        "metadata": {
            "durationMinutes": duration,
            "intervalMinutes": interval,
            "generatedPoints": len(trajectory)
        }
    }
    
    return jsonify(response)

@app.route('/predict-ai', methods=['POST'])
def predict_ai():
    from ml_prediction import predict_collision_ai
    data = request.get_json() or {}
    primary = data.get('primaryObject')
    secondary = data.get('secondaryObject')
    conjunction_features = data.get('conjunctionFeatures')
    
    if not primary or not secondary:
        return jsonify({"error": "primaryObject and secondaryObject are required"}), 400
        
    try:
        result = predict_collision_ai(primary, secondary, conjunction_features)
        return jsonify(result)
    except Exception as err:
        return jsonify({"error": str(err)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.getenv('PORT', '5002')))
