import os

from flask import Flask

app = Flask(__name__)

@app.route('/')
def index():
    return "Risk Assessment Service"

@app.route('/health')
def health():
    return {"status": "ok", "service": "risk-assessment"}

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.getenv('PORT', '5003')))
