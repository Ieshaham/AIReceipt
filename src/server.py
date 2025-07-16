from flask import Flask, request, jsonify
from flask_cors import CORS
import boto3
from botocore.client import Config
import re
import json

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})  # Allow all origins for debugging

s3 = boto3.client('s3', config=Config(signature_version='s3v4'))
BUCKET_NAME = 'receipt-uploads-ieshaham'

def extract_total(lines):
    """Extract total amount from receipt lines"""
    print(f"DEBUG: extract_total called with lines: {lines}")
    
    # First try to find patterns within single lines
    total_patterns = [
        r'Total[:\s]*\$?\s*(\d+\.?\d*)',
        r'TOTAL[:\s]*\$?\s*(\d+\.?\d*)',
        r'Amount[:\s]*\$?\s*(\d+\.?\d*)',
    ]
    
    for line in lines:
        for pattern in total_patterns:
            match = re.search(pattern, line, re.IGNORECASE)
            if match:
                result = f"${match.group(1)}"
                print(f"DEBUG: Found total in single line: {result}")
                return result
    
    # Look for "Total:" followed by amount in next line (common receipt format)
    for i, line in enumerate(lines):
        if re.search(r'Total[:\s]*$', line, re.IGNORECASE):
            print(f"DEBUG: Found 'Total' at line {i}: '{line}'")
            # Check next line for amount
            if i + 1 < len(lines):
                next_line = lines[i + 1].strip()
                print(f"DEBUG: Next line is: '{next_line}'")
                amount_match = re.search(r'\$\s*(\d+\.?\d*)', next_line)
                if amount_match:
                    result = f"${amount_match.group(1)}"
                    print(f"DEBUG: Found total in next line: {result}")
                    return result
    
    # Fallback: look for any line with just a dollar amount
    for line in lines:
        if re.match(r'^\$\s*\d+\.?\d*$', line.strip()):
            print(f"DEBUG: Found dollar amount line: {line.strip()}")
            return line.strip()
    
    print("DEBUG: No total found, returning Unknown Total")
    return "Unknown Total"

def extract_vendor(lines):
    """Extract vendor name from receipt lines"""
    print(f"DEBUG: extract_vendor called with lines: {lines}")
    
    # First non-empty line is usually the vendor
    for line in lines:
        if line.strip() and not re.match(r'^\d+\s*$', line.strip()):
            result = line.strip()
            print(f"DEBUG: Found vendor: {result}")
            return result
    
    print("DEBUG: No vendor found, returning Unknown Vendor")
    return "Unknown Vendor"

def extract_date(lines):
    """Extract date from receipt lines"""
    print(f"DEBUG: extract_date called with lines: {lines}")
    
    date_patterns = [
        r'\b(\d{1,2}\s+[A-Za-z]+\s+\d{4})\b',  # 23 june 2022
        r'\b([A-Za-z]+\s+\d{1,2},?\s+\d{4})\b',  # June 23, 2022
        r'\b(\d{1,2}[-/]\d{1,2}[-/]\d{4})\b',  # 23/06/2022
        r'\b(\d{4}[-/]\d{1,2}[-/]\d{1,2})\b',  # 2022-06-23
    ]
    
    for line in lines:
        for pattern in date_patterns:
            match = re.search(pattern, line, re.IGNORECASE)
            if match:
                result = match.group(1)
                print(f"DEBUG: Found date: {result}")
                return result
    
    print("DEBUG: No date found, returning Unknown Date")
    return "Unknown Date"

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

@app.route('/analyze', methods=['POST', 'OPTIONS'])
def analyze():
    print(f"DEBUG: analyze endpoint called with method: {request.method}")
    
    if request.method == 'OPTIONS':
        return jsonify({'status': 'ok'})
    
    data = request.get_json()
    print(f"DEBUG: Request data: {data}")
    
    file_name = data.get('fileName')
    print(f"DEBUG: Received fileName to analyze: {file_name}")

    textract = boto3.client('textract')

    try:
        response = textract.analyze_document(
            Document={
                'S3Object': {
                    'Bucket': BUCKET_NAME,
                    'Name': file_name
                }
            },
            FeatureTypes=["FORMS"]
        )
        print("DEBUG: Textract response received successfully")
    except Exception as e:
        print(f"DEBUG: Error calling Textract: {e}")
        return jsonify({"error": str(e)}), 500

    lines = []
    for block in response.get('Blocks', []):
        if block['BlockType'] == 'LINE':
            lines.append(block['Text'])

    print(f"DEBUG: Extracted lines: {lines}")
    
    # Extract all information from the lines
    vendor = extract_vendor(lines)
    date = extract_date(lines)
    total = extract_total(lines)
    
    print(f"DEBUG: Final extracted vendor: {vendor}")
    print(f"DEBUG: Final extracted date: {date}")
    print(f"DEBUG: Final extracted total: {total}")

    # Create response
    response_data = {
        "extractedLines": lines,
        "vendor": vendor,
        "date": date,
        "total": total
    }
    
    print(f"DEBUG: Sending response: {json.dumps(response_data, indent=2)}")
    
    return jsonify(response_data)

@app.route('/')
def home():
    return "Server is running!"

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)