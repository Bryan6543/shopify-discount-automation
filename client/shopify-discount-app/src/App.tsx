import { useState, useEffect } from "react";
import axios from "axios";

interface Collection {
  id: number;
  title: string;
}

interface Discount {
  discount: string;
  product: string;
  startDate: string;
  endDate: string;
  type: "code" | "automatic";
  discount_code?: string;
  collection?: string;
}

function App() {
  const [command, setCommand] = useState("");
  const [parsedDiscount, setParsedDiscount] = useState<Discount | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [collectionSearch, setCollectionSearch] = useState("");
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [discountSearch, setDiscountSearch] = useState("");
  const [emailList, setEmailList] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [showAllDiscounts, setShowAllDiscounts] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<{
    shopify: boolean;
    openai: boolean;
    mailjet: boolean;
  } | null>(null);
  const [emailSearch, setEmailSearch] = useState("");
  const [showAll, setShowAll] = useState(false);

  const filteredEmails = emailList.filter((email) =>
    email.toLowerCase().includes(emailSearch.toLowerCase())
  );

  const visibleEmails = showAll ? filteredEmails : filteredEmails.slice(0, 5);

  useEffect(() => {
    axios.get("http://localhost:5000/api/status").then((res) => {
      setStatus(res.data.statuses);
    });
  }, []);

  useEffect(() => {
    fetchCollections();
    fetchDiscounts();
    fetchEmails();
  }, []);

  const fetchCollections = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/collections");
      setCollections(res.data.collections || []);
    } catch {
      setError("Failed to load collections");
    }
  };

  const fetchDiscounts = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/discounts");
      setDiscounts(res.data.discounts || []);
    } catch {
      setError("Failed to load discounts");
    }
  };

  const fetchEmails = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/emails");
      setEmailList(res.data.emails || []);
    } catch {
      setError("Failed to load email list");
    }
  };

  const addEmail = async () => {
    if (!newEmail.trim()) return;
    try {
      const res = await axios.post("http://localhost:5000/api/emails", {
        email: newEmail.trim(),
      });
      setEmailList(res.data.emails || []);
      setNewEmail("");
    } catch {
      setError("Failed to add email");
    }
  };

  const deleteEmail = async (email: string) => {
    try {
      const res = await axios.delete(
        `http://localhost:5000/api/emails/${email}`
      );
      setEmailList(res.data.emails || []);
    } catch {
      setError("Failed to delete email");
    }
  };

  const handleCommand = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.post("http://localhost:5000/api/parse", {
        command,
      });
      setParsedDiscount(res.data.parsed || null);
      setConfirmed(false);
    } catch {
      setError("Error parsing command.");
    }
    setLoading(false);
  };

  const createDiscount = async () => {
    if (!parsedDiscount) return;
    setLoading(true);
    try {
      const res = await axios.post("http://localhost:5000/api/command", {
        command,
      });
      setDiscounts((prev) => [res.data.parsed, ...prev]);
      setParsedDiscount(null);
      setCommand("");
    } catch {
      setError("Error creating discount");
    }
    setLoading(false);
  };

  const filteredCollections = collections.filter((col) =>
    col.title.toLowerCase().includes(collectionSearch.toLowerCase())
  );

  const filteredDiscounts = discounts.filter((disc) =>
    disc.product.toLowerCase().includes(discountSearch.toLowerCase())
  );

  const visibleDiscounts = showAllDiscounts
    ? filteredDiscounts
    : filteredDiscounts.slice(0, 5);

  return (
    <div className="main_container">
      <div className="main_heading_container">
        <h1>Shopify Discount AI</h1>
        <h3>NLP + Discount + Email</h3>
        <div className="main_heading_svgs">
          <img src="/openai.svg" alt="openaisvg" />
          <img src="/shopify.svg" alt="shopifysvg" />
          <img src="/mailjet.svg" alt="mailjetsvg" />
        </div>
      </div>

      {/* API Connection Status */}
      {status && (
        <div className="connection_status_container">
          <h3>API Connection Status</h3>
          <ul>
            <li>
              Shopify :{" "}
              <span className={status.shopify ? "color-green" : "color-red"}>
                {status.shopify ? "Connected" : "Disconnected"}
              </span>
            </li>
            <li>
              OpenAI :{" "}
              <span className={status.openai ? "color-green" : "color-red"}>
                {status.openai ? "Connected" : "Disconnected"}
              </span>
            </li>
            <li>
              Mailjet :{" "}
              <span className={status.mailjet ? "color-green" : "color-red"}>
                {status.mailjet ? "Connected" : "Disconnected"}
              </span>
            </li>
          </ul>
        </div>
      )}

      {/* Project Ownder Details */}
      <div className="project_owner_details">
        <img
          className="middlesex_logo"
          src="/Middlesex.svg"
          alt="middlesex logo"
        />
        <h4>MDX ID: M01057562</h4>
        <h4>Name: D.T.N Brayan Fernando</h4>
        <h4>Email: fnirmal802gmail.com</h4>
        <a href="https://github.com/Bryan6543/shopify-discount-automation">
          Github Repo.
        </a>
      </div>
      <div>
        {/* Command input */}
        <div className="command_container">
          <h2>Ask AI to Create your Discount</h2>
          <p>
            For a successful discount creation following requests are required
            to be present
          </p>
          <ul>
            <li>Discount amount Egs : 20% off </li>
            <li>Discount type Code bases or Automatic</li>
            <li>Start and End Date of the Discount</li>
            <li>Discount on Shopify Colleciton Name : Name should be exact</li>
          </ul>
          <input
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder="e.g. Create 20% discount for hoodies from April 20 to April 25"
          />
          <button
            className="margin-left submit_btn_ai"
            onClick={handleCommand}
            disabled={loading}
          >
            Submit to AI
          </button>
        </div>

        {/* Confirmation */}
        {parsedDiscount && !confirmed && (
          <div className="command_confirmation_container">
            <h3>Confirm this discount:</h3>
            <ul>
              <li>
                <strong>Discount:</strong> {parsedDiscount.discount}
              </li>
              <li>
                <strong>Product:</strong> {parsedDiscount.product}
              </li>
              <li>
                <strong>Start Date:</strong> {parsedDiscount.startDate}
              </li>
              <li>
                <strong>End Date:</strong> {parsedDiscount.endDate}
              </li>
              <li>
                <strong>Type:</strong> {parsedDiscount.type}
              </li>
              {parsedDiscount.collection && (
                <li>
                  <strong>Collection:</strong> {parsedDiscount.collection}
                </li>
              )}
            </ul>
            <div className="command_confirmation_button">
              <button
                onClick={() => {
                  setConfirmed(true);
                  createDiscount();
                }}
              >
                ✅ Confirm & Create
              </button>
              <button onClick={() => setParsedDiscount(null)}>❌ Cancel</button>
            </div>
          </div>
        )}
      </div>

      {error && <p className="color-red">{error}</p>}

      <div className="bottom_container">
        {/* Collections */}
        <div className="collections_container">
          <h2>📦 Collections</h2>
          <input
            type="text"
            value={collectionSearch}
            onChange={(e) => setCollectionSearch(e.target.value)}
            placeholder="Search collections..."
          />
          {filteredCollections.length === 0 ? (
            <p>No collections found.</p>
          ) : (
            <ul>
              {filteredCollections.map((col) => (
                <li key={col.id} className="list_gap">
                  {col.title}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Discounts */}
        <div className="discounts_container">
          <h2>🏷️ Discounts</h2>
          <input
            type="text"
            value={discountSearch}
            onChange={(e) => setDiscountSearch(e.target.value)}
            placeholder="Search discounts..."
          />
          {visibleDiscounts.length === 0 ? (
            <p>No discounts found.</p>
          ) : (
            <ul>
              {visibleDiscounts.map((d, i) => (
                <li key={i} className="list_gap">
                  <strong>{d.discount}</strong> off <strong>{d.product}</strong>
                  <br />
                  📅 {d.startDate} – {d.endDate}
                  <br />
                  {d.collection && (
                    <>
                      📚 Collection: {d.collection}
                      <br />
                    </>
                  )}
                  {d.type === "code" && d.discount_code && (
                    <>
                      🔖 Code: <strong>{d.discount_code}</strong>
                    </>
                  )}
                  {d.type === "automatic" && <>⚙️ Auto-applied</>}
                </li>
              ))}
            </ul>
          )}
          {filteredDiscounts.length > 5 && (
            <button
              onClick={() => setShowAllDiscounts(!showAllDiscounts)}
              className="mt-2 text-blue-600 underline"
            >
              {showAllDiscounts ? "Show Less" : "Show More"}
            </button>
          )}
        </div>

        {/* Email List */}
        <div className="email_list_container">
          <h2>📧 Email Recipients</h2>

          {/* Add new email */}
          <div className="email_add_container">
            <input
              type="email"
              placeholder="Add new email..."
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
            />
            <button onClick={addEmail}>➕ Add</button>
          </div>

          {/* Search emails */}
          <div>
            <input
              type="text"
              placeholder="Search emails..."
              value={emailSearch}
              onChange={(e) => setEmailSearch(e.target.value)}
            />
          </div>

          {/* Error message */}
          {error && <p>{error}</p>}

          {/* Emails list */}
          <ul>
            {visibleEmails.length === 0 ? (
              <p>No emails found.</p>
            ) : (
              visibleEmails.map((email) => (
                <li key={email}>
                  {email}
                  <button
                    className="margin-left"
                    onClick={() => deleteEmail(email)}
                  >
                    ❌ Remove
                  </button>
                </li>
              ))
            )}
          </ul>

          {/* Show More / Show Less */}
          {filteredEmails.length > 5 && (
            <div>
              <button onClick={() => setShowAll(!showAll)}>
                {showAll
                  ? "Show Less"
                  : `Show More (${filteredEmails.length - 5} more)`}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
