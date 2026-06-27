import os

from flask import Flask

app = Flask(__name__)

@app.route('/')
def index():
    return "Avoidance Recommendation Service"

@app.route('/health')
def health():
    return {"status": "ok", "service": "avoidance-recommendation"}

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.getenv('PORT', '5004')))
