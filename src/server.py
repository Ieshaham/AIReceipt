from flask import Flask, request, jsonify
import boto3
from botocore.client import Config

app = Flask(__name__)
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

if __name__ == '__main__':
    app.run(debug=True)
