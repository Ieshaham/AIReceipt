import { useState } from "react";
import type { ReceiptData } from "./displayResults";
import DisplayResults from "./displayResults";

function UploadReceipt() {
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>("");

  const handleUpload = async () => {
    if (!file) return alert("Please select a file");

    setMessage("Uploading...");
    setIsUploading(true);
    setReceiptData(null);
    setDebugInfo("");

    try {
      console.log("DEBUG: Starting upload process");
      
      // Step 1: Get pre-signed URL
      console.log("DEBUG: Getting pre-signed URL");
      const res = await fetch(
        `https://c6nvdg0j58.execute-api.us-east-2.amazonaws.com/default/ai_receipt?fileName=${file.name}&fileType=${file.type}`
      );
      const data = await res.json();
      console.log("DEBUG: Pre-signed URL response:", data);

      // Step 2: Upload to S3 using the pre-signed URL
      console.log("DEBUG: Uploading to S3");
      const upload = await fetch(data.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      console.log("DEBUG: S3 upload response status:", upload.status);
      
      if (upload.ok) {
        setMessage("✅ File uploaded successfully! Analyzing...");

        // Step 3: Call your local server to analyze receipt via Textract
        console.log("DEBUG: Calling local analyze endpoint");
        const analyzePayload = { fileName: file.name };
        console.log("DEBUG: Analyze payload:", analyzePayload);
        
        const analyzeRes = await fetch("http://localhost:5000/analyze", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify(analyzePayload),
        });

        console.log("DEBUG: Analyze response status:", analyzeRes.status);
        console.log("DEBUG: Analyze response headers:", analyzeRes.headers);

        if (!analyzeRes.ok) {
          const errorText = await analyzeRes.text();
          console.error("DEBUG: Analyze error response:", errorText);
          throw new Error(`Analyze failed: ${analyzeRes.status} - ${errorText}`);
        }

        const ocrData = await analyzeRes.json();
        console.log("DEBUG: OCR Data received:", ocrData);

        // Set debug info
        setDebugInfo(`
          Raw Response: ${JSON.stringify(ocrData, null, 2)}
          
          Extracted Lines: ${JSON.stringify(ocrData.extractedLines, null, 2)}
          
          Backend Vendor: ${ocrData.vendor}
          Backend Date: ${ocrData.date}
          Backend Total: ${ocrData.total}
        `);

        // Check if we have the expected data structure
        if (!ocrData.extractedLines || !Array.isArray(ocrData.extractedLines)) {
          throw new Error("Invalid response format from server");
        }

        // Use backend-extracted data
        const processedData: ReceiptData = {
          vendor: ocrData.vendor || "Unknown Vendor",
          date: ocrData.date || "Unknown Date", 
          total: ocrData.total || "Unknown Total",
        };

        console.log("DEBUG: Processed receipt data:", processedData);
        setReceiptData(processedData);
        setMessage("✅ Receipt analyzed successfully!");

      } else {
        throw new Error(`Upload failed: ${upload.status}`);
      }
    } catch (err) {
      console.error("DEBUG: Error:", err);
      setMessage(`❌ Error: ${err instanceof Error ? err.message : "Something went wrong"}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    setMessage("");
    setReceiptData(null);
    setDebugInfo("");
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-3 sm:mb-4">
            <span className="text-lg sm:text-2xl">📄</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Receipt Analyzer (Debug Mode)
          </h1>
          <p className="text-sm sm:text-base text-gray-600 px-4">
            Upload your receipt and extract key information instantly
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl border border-gray-100 overflow-hidden">
          {/* Upload Section */}
          <div className="p-4 sm:p-6 lg:p-8">
            <div className="mb-4 sm:mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2 sm:mb-3">
                Upload Receipt
              </label>

              {/* File Drop Zone */}
              <div className="relative">
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div
                  className={`border-2 border-dashed rounded-lg sm:rounded-xl p-4 sm:p-6 lg:p-8 text-center transition-all duration-300 ${
                    file
                      ? "border-green-300 bg-green-50"
                      : "border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50"
                  }`}
                >
                  {file ? (
                    <div className="space-y-2 sm:space-y-3">
                      <div className="text-3xl sm:text-4xl">✅</div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm sm:text-base break-all">
                          {file.name}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-500">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 sm:space-y-3">
                      <div className="text-3xl sm:text-4xl">📤</div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm sm:text-base">
                          Drop your receipt here
                        </p>
                        <p className="text-xs sm:text-sm text-gray-500">
                          or click to browse
                        </p>
                      </div>
                      <p className="text-xs text-gray-400">
                        Supports JPG, PNG, PDF up to 10MB
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Upload Button */}
            <button
              onClick={handleUpload}
              disabled={!file || isUploading}
              className={`w-full py-3 sm:py-4 px-4 sm:px-6 rounded-lg sm:rounded-xl font-semibold text-white text-sm sm:text-base transition-all duration-300 transform ${
                !file || isUploading
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 hover:scale-105 shadow-lg hover:shadow-xl"
              }`}
            >
              {isUploading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white"></div>
                  <span>Processing...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-sm sm:text-base">📤</span>
                  <span>Analyze Receipt</span>
                </div>
              )}
            </button>

            {/* Status Message */}
            {message && (
              <div
                className={`mt-3 sm:mt-4 p-3 sm:p-4 rounded-lg sm:rounded-xl flex items-center space-x-2 sm:space-x-3 ${
                  message.startsWith("✅")
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}
              >
                <span className="text-lg sm:text-xl flex-shrink-0">
                  {message.startsWith("✅") ? "✅" : "❌"}
                </span>
                <span className="font-medium text-sm sm:text-base break-words">
                  {message}
                </span>
              </div>
            )}
          </div>

          {/* Results Section */}
          <DisplayResults data={receiptData} />

          {/* Debug Info */}
          {debugInfo && (
            <div className="border-t border-gray-200 bg-gray-100 p-4 sm:p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Debug Information:</h3>
              <pre className="text-xs bg-white p-3 rounded border overflow-auto max-h-96">
                {debugInfo}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-6 sm:mt-8 text-gray-500 text-xs sm:text-sm px-4">
          <p>Your receipts are processed securely and not stored permanently</p>
        </div>
      </div>
    </div>
  );
}

export default UploadReceipt;