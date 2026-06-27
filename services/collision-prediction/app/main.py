import os
import math
from datetime import datetime, timedelta
from flask import Flask, request, jsonify

app = Flask(__name__)

def generate_placeholder_trajectory(orbital_object, duration, interval):
    """
    WARNING: THIS IS NOT SCIENTIFICALLY ACCURATE (NOT SGP4).
    This is a placeholder orbit propagation algorithm. It generates a simple
    geometric preview trajectory using the current altitude and velocity of the object.
    It is structured so that a future SGP4 engine can replace only this internal algorithm
    while keeping the API and response structure identical.
    """
    trajectory = []
    steps = int(duration // interval)
    start_time = datetime.utcnow()
    
    altitude = float(orbital_object.get('altitudeKm', 400))
    velocity = float(orbital_object.get('velocityKmPerSec', 7.7))
    
    for i in range(steps + 1):
        time_offset = i * interval
        timestamp = start_time + timedelta(minutes=time_offset)
        
        # Purely geometric circular orbit path preview
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

@app.route('/')
def index():
    return "Collision Prediction Service"

@app.route('/health')
def health():
    return {"status": "ok", "service": "collision-prediction"}

@app.route('/propagate', methods=['POST'])
def propagate():
    # Retrieve payload
    data = request.get_json() or {}
    orbital_object = data.get('orbitalObject')
    duration = int(data.get('durationMinutes', 60))
    interval = int(data.get('intervalMinutes', 5))
    
    if not orbital_object:
        return jsonify({"error": "orbitalObject is required"}), 400
        
    # Generate the placeholder trajectory
    trajectory = generate_placeholder_trajectory(orbital_object, duration, interval)
    
    response = {
        "connected": True,
        "scientific": False,
        "source": "Placeholder Scientific Engine",
        "trajectory": trajectory,
        "metadata": {
            "durationMinutes": duration,
            "intervalMinutes": interval,
            "generatedPoints": len(trajectory)
        }
    }
    
    return jsonify(response)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.getenv('PORT', '5002')))
