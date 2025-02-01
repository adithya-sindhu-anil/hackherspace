
import os
from flask import Flask, request, jsonify
from handle_pdf import main

app = Flask(__name__)


@app.route("/", methods=["POST"])
def index():
    file = request.files["files"]
    file_path = os.path.join("uploads/", file.filename)
    file.save(file_path)
    response = main(file_path)
    return {"response": response}


if __name__ == "__main__":
    app.run(debug=True)
