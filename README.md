# LLM-Query-Interface

LLM-Query-Interface is a Flask-based web application that acts as an intermediary for querying a Language Model (LLM) API. The interface allows users to upload PDF files, extract text from them, and combine that text with user input to send a query to an LLM. The response from the LLM is then formatted and returned in a user-friendly format.

## Features

- **PDF Upload & Text Extraction:** Upload PDF documents and automatically extract text using PyPDF2.
- **User Input Caching:** Temporarily store user queries for later processing.
- **Combined Query Processing:** Merge extracted PDF text with user input before sending it to the LLM API.
- **Streaming API Integration:** Handles streamed responses from the LLM and formats them for display.
- **Simple Web Interface:** A basic front-end served via Flask for quick testing and interaction.

## Prerequisites

- Python 3.6 or later
- [Flask](https://palletsprojects.com/p/flask/)
- [Requests](https://docs.python-requests.org/)
- [PyPDF2](https://pythonhosted.org/PyPDF2/)
- [Werkzeug](https://werkzeug.palletsprojects.com/)

## Installation

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/yourusername/llm-query-interface.git
    ```
2.	Navigate to the Project Directory:
  ```bash
  cd llm-query-interface
  ```
3.	Create a Virtual Environment (Optional but Recommended):
  ```bash
  python -m venv venv
  source venv/bin/activate  # On Windows use `venv\Scripts\activate`
  ```

4.	Install Dependencies:
  ```
  pip install -r requirements.txt
  ```
  (If a requirements.txt file is not present, manually install Flask, requests, PyPDF2, and Werkzeug.)

Configuration
	•	LLM API URL: The LLM_API_URL is currently set to http://localhost:11434/api/chat in main.py (standard when using Ollama). Update this URL if your LLM API is hosted elsewhere.
	•	Upload Folder: PDF files are stored in the uploads directory. This folder is created automatically if it does not exist.

Running the Application
Start the Flask application by running:
  ```bash
  python main.py
  ```
The app will be available at http://localhost:5000. Use the web interface to upload a PDF, enter your query, and receive the LLM’s response.

API Endpoints
	•	GET /
    Renders the main interface (index.html).
	•	POST /upload_pdf
    Upload a PDF file. The file is saved to the uploads folder and its text is extracted and cached.
	•	POST /query_llm_input
    Receives user input (JSON) and caches it for later use.
	•	GET /query_llm
    Combines the cached PDF text and user input, sends the combined query to the LLM API, and returns the formatted response.

Disclaimer
Please note that this software is currently developed for personal use and testing purposes. The code is not fully optimized or polished for production environments and might have rough edges.

Contributing
Contributions, bug reports, and feature requests are welcome! Feel free to fork the repository and submit a pull request with your improvements.

License
This project is licensed under the MIT License.

Contact
For any questions or feedback, please reach out to [florianoppermann01@gmail.com].

