import React from "react";

export default function DiscountPreview({ parsed, onConfirm, onCancel }: any) {
  return (
    <div className="bg-white p-4 rounded shadow mt-4">
      <h2 className="text-lg font-semibold mb-2">🧾 Confirm Discount Details</h2>
      <ul className="list-disc list-inside mb-4">
        <li><strong>Product:</strong> {parsed.product}</li>
        <li><strong>Discount:</strong> {parsed.discount}</li>
        <li><strong>Start Date:</strong> {parsed.startDate}</li>
        <li><strong>End Date:</strong> {parsed.endDate}</li>
        {parsed.collection && <li><strong>Collection:</strong> {parsed.collection}</li>}
        <li><strong>Type:</strong> {parsed.discountType}</li>
      </ul>
      <div className="space-x-2">
        <button className="btn bg-green-600 text-white" onClick={onConfirm}>✅ Confirm</button>
        <button className="btn bg-gray-300" onClick={onCancel}>❌ Cancel</button>
      </div>
    </div>
  );
}
