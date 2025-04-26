import React, { useEffect, useState } from "react";
import axios from "axios";

export default function CollectionsList() {
  const [collections, setCollections] = useState<any[]>([]);

  useEffect(() => {
    axios.get("http://localhost:5000/api/collections").then(res => {
      setCollections(res.data.collections);
    });
  }, []);

  return (
    <div className="mt-6 p-4">
      <h2 className="font-semibold text-lg mb-3">🧺 Collections</h2>
      <ul>
        {collections.map((col) => (
          <li key={col.id} className="mb-2">
            <strong>{col.title}</strong> – {col.product_count} products
          </li>
        ))}
      </ul>
    </div>
  );
}
