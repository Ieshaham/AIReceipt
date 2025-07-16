export type ReceiptData = {
  vendor: string;
  date: string;
  total: string;
};

const DisplayResults = ({ data }: { data: ReceiptData | null }) => {
  if (!data) return null;

  return (
    <div className="border-t border-gray-200 bg-gray-50 p-4 sm:p-6 lg:p-8">
      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">
        Receipt Analysis Results
      </h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        {/* Vendor */}
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-xl">🏪</span>
            <h4 className="font-medium text-gray-700">Vendor</h4>
          </div>
          <p className="text-gray-900 font-semibold">{data.vendor}</p>
        </div>

        {/* Date */}
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-xl">📅</span>
            <h4 className="font-medium text-gray-700">Date</h4>
          </div>
          <p className="text-gray-900 font-semibold">{data.date}</p>
        </div>

        {/* Total */}
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-xl">💰</span>
            <h4 className="font-medium text-gray-700">Total</h4>
          </div>
          <p className="text-gray-900 font-semibold text-lg">{data.total}</p>
        </div>
      </div>
    </div>
  );
};

export default DisplayResults;