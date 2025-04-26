import React, { useState } from "react";
import axios from "axios";
import DiscountPreview from "./DiscountPreview";

export default function CommandInput() {
  const [command, setCommand] = useState("");
  const [parsed, setParsed] = useState<any>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSubmit = async () => {
    try {
      const res = await axios.post("http://localhost:5000/api/command", { command });
      setParsed(res.data.parsed);
    } catch (err) {
      console.error(err);
    }
  };

  const handleConfirm = async () => {
    try {
      const res = await axios.post("http://localhost:5000/api/command", { command });
      setResult(res.data);
      setConfirmed(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCancel = () => {
    setParsed(null);
    setCommand("");
  };

  return (
    <div className="p-4 max-w-xl mx-auto">
      {!parsed ? (
        <>
          <textarea
            className="w-full p-2 border rounded"
            rows={4}
            placeholder="Describe your discount..."
            value={command}
            onChange={(e) => setCommand(e.target.value)}
          />
          <button className="btn mt-2" onClick={handleSubmit}>Submit</button>
        </>
      ) : (
        <DiscountPreview parsed={parsed} onConfirm={handleConfirm} onCancel={handleCancel} />
      )}
      {confirmed && result && (
        <div className="mt-6 p-4 bg-green-100 rounded">
          <h2 className="font-bold">✅ Discount Created!</h2>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
