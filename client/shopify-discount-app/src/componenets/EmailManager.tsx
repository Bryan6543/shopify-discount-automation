import { useEffect, useState } from "react";
import axios from "axios";

export default function EmailManager() {
  const [emails, setEmails] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [emailSearch, setEmailSearch] = useState("");
  const [error, setError] = useState("");
  const [showAll, setShowAll] = useState(false);

  const fetchEmails = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/emails");
      setEmails(res.data.emails || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load emails.");
    }
  };

  const addEmail = async () => {
    if (!newEmail.trim()) return;
    try {
      const res = await axios.post("http://localhost:5000/api/emails", {
        email: newEmail.trim(),
      });
      setEmails(res.data.emails || []);
      setNewEmail("");
    } catch (err) {
      setError("Failed to add email.");
    }
  };

  const deleteEmail = async (emailToRemove: string) => {
    try {
      const res = await axios.delete(`http://localhost:5000/api/emails/${encodeURIComponent(emailToRemove)}`);
      setEmails(res.data.emails || []);
    } catch (err) {
      setError("Failed to delete email.");
    }
  };
  
  

  useEffect(() => {
    fetchEmails();
  }, []);

  // Filter emails based on search
  const filteredEmails = emails.filter((email) =>
    email.toLowerCase().includes(emailSearch.toLowerCase())
  );

  // Control how many emails are shown
  const visibleEmails = showAll ? filteredEmails : filteredEmails.slice(0, 5);

  return (
    <div className="bg-white p-4 rounded shadow mt-6">
      <h2 className="text-lg font-semibold mb-4">📧 Email Recipients</h2>

      {/* Add new email */}
      <div className="flex gap-2 mb-4">
        <input
          type="email"
          placeholder="Add new email..."
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          className="flex-grow border p-2 rounded"
        />
        <button
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          onClick={addEmail}
        >
          ➕ Add
        </button>
      </div>

      {/* Search emails */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search emails..."
          value={emailSearch}
          onChange={(e) => setEmailSearch(e.target.value)}
          className="w-full border p-2 rounded"
        />
      </div>

      {/* Error message */}
      {error && <p className="text-red-600 mb-4">{error}</p>}

      {/* Emails list */}
      <ul className="space-y-2">
        {visibleEmails.length === 0 ? (
          <p className="text-gray-500">No emails found.</p>
        ) : (
          visibleEmails.map((email) => (
            <li key={email} className="flex justify-between items-center border-b pb-1">
              {email}
              <button
                onClick={() => deleteEmail(email)}
                className="text-sm text-red-500 hover:underline"
              >
                ❌ Remove
              </button>
            </li>
          ))
        )}
      </ul>

      {/* Show More / Show Less */}
      {filteredEmails.length > 5 && (
        <div className="mt-4">
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-blue-600 hover:underline"
          >
            {showAll ? "Show Less" : `Show More (${filteredEmails.length - 5} more)`}
          </button>
        </div>
      )}
    </div>
  );
}
