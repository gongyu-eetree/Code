import os
from pathlib import Path
from flask import Flask, render_template, request, redirect, url_for, jsonify, abort
from werkzeug.utils import secure_filename

BASE_DIR = Path(__file__).resolve().parent
UPLOAD_DIR = BASE_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

ALLOWED_EXTENSIONS = {"html", "htm"}

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 16 * 1024 * 1024  # 16MB upload limit


def allowed_file(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def get_file_path(filename: str) -> Path:
    safe_name = secure_filename(filename)
    if not safe_name:
        abort(400, "Invalid filename")
    file_path = UPLOAD_DIR / safe_name
    if not file_path.exists():
        abort(404, "File not found")
    return file_path


@app.route("/")
def index():
    files = sorted(p.name for p in UPLOAD_DIR.glob("*.htm")) + sorted(
        p.name for p in UPLOAD_DIR.glob("*.html")
    )
    return render_template("index.html", files=files)


@app.post("/upload")
def upload():
    uploaded_file = request.files.get("file")
    if uploaded_file is None or uploaded_file.filename == "":
        return redirect(url_for("index"))

    if not allowed_file(uploaded_file.filename):
        abort(400, "Only HTML files are allowed")

    filename = secure_filename(uploaded_file.filename)
    if not filename:
        abort(400, "Invalid filename")

    file_path = UPLOAD_DIR / filename
    uploaded_file.save(file_path)
    return redirect(url_for("edit", filename=filename))


@app.get("/edit/<path:filename>")
def edit(filename: str):
    file_path = get_file_path(filename)
    content = file_path.read_text(encoding="utf-8")
    return render_template("editor.html", filename=file_path.name, content=content)


@app.post("/save/<path:filename>")
def save(filename: str):
    file_path = get_file_path(filename)
    data = request.get_json(silent=True) or {}
    content = data.get("content")
    if content is None:
        abort(400, "Missing content")

    file_path.write_text(content, encoding="utf-8")
    return jsonify({"status": "success", "message": f"Saved {file_path.name}"})


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))
