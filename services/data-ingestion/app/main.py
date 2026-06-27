import os

from flask import Flask

app = Flask(__name__)

@app.route('/')
def index():
    return "Data Ingestion Service"

@app.route('/health')
def health():
    return {"status": "ok", "service": "data-ingestion"}

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.getenv('PORT', '5001')))
