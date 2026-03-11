from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route("/")
def health():
    return jsonify({"status": "Lightweight API Online"})

if __name__ == "__main__":
    print("Lightweight Server Starting...")
    app.run(host="0.0.0.0", port=5000)
