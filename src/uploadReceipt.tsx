import { useState } from "react";

function UploadReceipt() {
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");

  const handleUpload = async () => {
    if (!file) return alert("Please select a file");

    setMessage("Uploading...");

    try {
 const res = await fetch(
  `https://c6nvdg0j58.execute-api.us-east-2.amazonaws.com/default/ai_receipt?fileName=${file.name}&fileType=${file.type}`
);

      const data = await res.json();

      const upload = await fetch(data.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (upload.ok) {
        setMessage("✅ File uploaded successfully!");
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

      {/* ✅ The success or error message will be displayed here */}
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
    </div>
  );
}

export default UploadReceipt;
