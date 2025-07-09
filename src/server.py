from flask import Flask, request, jsonify
from flask_cors import CORS
import boto3
from botocore.client import Config

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

s3 = boto3.client('s3', config=Config(signature_version='s3v4'))
BUCKET_NAME = 'receipt-uploads-ieshaham'

@app.route('/api/generate-presigned-url', methods=['POST'])
def generate_presigned_url():
    data = request.json
    file_name = data['fileName']
    file_type = data['fileType']

    presigned_url = s3.generate_presigned_url(
        ClientMethod='put_object',
        Params={
            'Bucket': BUCKET_NAME,
            'Key': file_name,
            'ContentType': file_type,
        },
        ExpiresIn=300
    )
    return jsonify({'url': presigned_url, 'key': file_name})

@app.route('/analyze', methods=['POST'])
def analyze():
    data = request.get_json()
    file_name = data.get('fileName')

    # Placeholder for actual Textract or OCR processing
    receipt_data = {
        "vendor": "Example Store",
        "date": "2025-07-09",
        "total": "$123.45"
    }
    return jsonify(receipt_data)

@app.route('/')
def home():
    return "Server is running!"

if __name__ == '__main__':
    app.run(debug=True)
