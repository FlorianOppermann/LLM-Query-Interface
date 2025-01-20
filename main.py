from flask import Flask, request, render_template, jsonify
import requests
import os
import json
from werkzeug.utils import secure_filename
import PyPDF2

app = Flask(__name__)

LLM_API_URL = "http://localhost:11434/api/chat"  # Ersetze mit deiner echten API-URL
UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'uploads')
ALLOWED_EXTENSIONS = {'pdf'}

# Temporäre Speicherung der Eingabe
user_input_cache = ""
pdf_text_cache = ""

# Sicherstellen, dass der templates-Ordner existiert
app.template_folder = os.path.join(os.path.dirname(__file__), 'templates')
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/upload_pdf', methods=['POST'])
def upload_pdf():
    global pdf_text_cache

    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400

    file = request.files['file']

    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)
        print(f"PDF uploaded: {file_path}")  # Debugging-Ausgabe

        # Extrahiere Text aus der PDF
        try:
            extracted_text = extract_text_from_pdf(file_path)
            pdf_text_cache = extracted_text  # Speichere den PDF-Text im Cache
            print("Extracted Text:", pdf_text_cache)  # Debugging-Ausgabe

            return jsonify({"status": "File processed successfully"}), 200

        except Exception as e:
            print("Error processing PDF:", e)
            return jsonify({"error": "Failed to process the PDF"}), 500

    return jsonify({"error": "Invalid file type"}), 400

def extract_text_from_pdf(file_path):
    text = ""
    with open(file_path, 'rb') as pdf_file:
        reader = PyPDF2.PdfReader(pdf_file)
        for page in reader.pages:
            text += page.extract_text()
    return text

@app.route('/query_llm_input', methods=['POST'])
def query_llm_input():
    global user_input_cache
    user_input_cache = request.json.get('user_input')
    print("Received input:", user_input_cache)  # Debugging-Ausgabe
    return jsonify({"status": "Input received"}), 200

@app.route('/query_llm', methods=['GET'])
def query_llm_stream():
    global user_input_cache, pdf_text_cache

    try:
        # Kombiniere PDF-Text und User-Input
        combined_input = f"{pdf_text_cache}\n\n{user_input_cache}"
        print("Combined Input:", combined_input)

        # API-Request an das LLM senden
        response = requests.post(
            LLM_API_URL,
            json={
                "model": "llama3.2",
                "messages": [{"role": "user", "content": combined_input}]
            },
            stream=True
        )
        response.raise_for_status()  # Prüfe auf HTTP-Fehler

        full_response = ""  # Speichert die gesamte Antwort

        for chunk in response.iter_lines(decode_unicode=True):
            if chunk:
                try:
                    data = json.loads(chunk)
                    content = data.get("message", {}).get("content", "")
                    full_response += content
                except json.JSONDecodeError:
                    print("Invalid JSON chunk:", chunk)  # Debugging-Ausgabe

        # Formatiere die Antwort ordentlich
        formatted_response = format_response(full_response)

        return jsonify({"response": formatted_response}), 200  # Vollständige Antwort senden

    except requests.exceptions.SSLError as e:
        print("SSL Error:", e)
        return jsonify({"error": "SSL Error occurred"}), 500
    except requests.exceptions.RequestException as e:
        print("Request Error:", e)
        return jsonify({"error": "Request failed"}), 500

def format_response(response):
    # Formatiere den Text mit HTML-Tags für bessere Lesbarkeit
    response = response.replace("\n", "<br>")
    response = response.replace("**", "")
    return response

if __name__ == '__main__':
    # Debug-Modus und Host-Konfiguration
    app.run(debug=True, host="0.0.0.0", port=5000)
