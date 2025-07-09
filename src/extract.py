from flask import Flask, request, jsonify
import boto3

app = Flask(__name__)

BUCKET_NAME = "receipt-uploads-ieshaham"

def extract_receipt_data(bucket_name, document_name):
    client = boto3.client("textract")
    response = client.analyze_expense(
        Document={'S3Object': {'Bucket': bucket_name, 'Name': document_name}}
    )

    summary = response["ExpenseDocuments"][0]["SummaryFields"]

    result = {}
    items = []

    for field in summary:
        label = field.get("Type", {}).get("Text", "")
        value = field.get("ValueDetection", {}).get("Text", "")

        if label == "MERCHANT_NAME":
            result["Merchant"] = value
        elif label == "TOTAL":
            result["Total"] = value
        elif label == "INVOICE_RECEIPT_DATE":
            result["Date"] = value

    # Optional: collect item names if available
    for line_item_group in response["ExpenseDocuments"][0].get("LineItemGroups", []):
        for item in line_item_group["LineItems"]:
            for field in item["LineItemExpenseFields"]:
                if field["Type"]["Text"] == "ITEM":
                    items.append(field["ValueDetection"]["Text"])

    result["Items"] = items
    return result

# 👇 Add this endpoint at the bottom of the file
@app.route('/analyze', methods=['POST'])
def analyze():
    data = request.get_json()
    file_name = data['fileName']

    receipt_data = extract_receipt_data(BUCKET_NAME, file_name)

    return jsonify(receipt_data)

if __name__ == '__main__':
    app.run(debug=True)
