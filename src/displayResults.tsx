type ReceiptData = {
  vendor: string;
  date: string;
  total: string;
};

const DisplayResults = ({ data }: { data: ReceiptData | null }) => {
  if (!data) return null;

  return (
    <div style={{ marginTop: 20 }}>
      <h3>Receipt Details:</h3>
      <p><strong>Vendor:</strong> {data.vendor}</p>
      <p><strong>Date:</strong> {data.date}</p>
      <p><strong>Total:</strong> {data.total}</p>
    </div>
  );
};

export default DisplayResults;
