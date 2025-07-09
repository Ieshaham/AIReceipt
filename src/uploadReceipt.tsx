import { useState } from "react";


function UploadReceipt() {
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [receiptData, setReceiptData] = useState<{
    vendor: string;
    date: string;
    total: string;
  } | null>(null);

  const handleUpload = async () => {
    if (!file) return alert("Please select a file");

    setMessage("Uploading...");

    try {
      // Step 1: Get pre-signed URL
      const res = await fetch(
        `https://c6nvdg0j58.execute-api.us-east-2.amazonaws.com/default/ai_receipt?fileName=${file.name}&fileType=${file.type}`
      );
      const data = await res.json();

      // Step 2: Upload to S3 using the pre-signed URL
      const upload = await fetch(data.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (upload.ok) {
        setMessage("✅ File uploaded successfully!");

        // Step 3: Call your local server to analyze receipt via Textract
        const analyzeRes = await fetch("http://localhost:5000/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileName: file.name }),
        });

        const ocrData = await analyzeRes.json();
        setReceiptData(ocrData);
      } else {
        setMessage("❌ Upload failed.");
      }
    } catch (err) {
      console.error(err);
      setMessage("❌ Something went wrong.");
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Upload Receipt</h2>

      <input
        type="file"
        accept="image/*,application/pdf"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />
      <br />

      <button onClick={handleUpload} style={{ marginTop: 10 }}>
        Upload
      </button>

      {message && (
        <p
          style={{
            marginTop: 10,
            fontWeight: "bold",
            color: message.startsWith("✅") ? "green" : "red",
          }}
        >
          {message}
        </p>
      )}

      {receiptData && (
        <div style={{ marginTop: 20 }}>
          <h3>Receipt Details:</h3>
          <p><strong>Vendor:</strong> {receiptData.vendor}</p>
          <p><strong>Date:</strong> {receiptData.date}</p>
          <p><strong>Total:</strong> {receiptData.total}</p>
        </div>
      )}
    </div>
  );
}

export default UploadReceipt;
