const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Example Route
app.post('/api/command', (req, res) => {
  const { command } = req.body;
  console.log("Received command:", command);

  // For now, just respond back
  res.json({ message: `You sent: ${command}` });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});


