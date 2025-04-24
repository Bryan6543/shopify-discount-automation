import { useState } from 'react'
import axios from 'axios'

function App() {
  const [command, setCommand] = useState("")
  const [response, setResponse] = useState("")

  const sendCommand = async () => {
    const res = await axios.post("http://localhost:5000/api/command", {
      command,
    });
    setResponse(res.data.message);
  };

  return (
    <div className="p-4">
      <input
        type="text"
        placeholder="Enter discount command..."
        value={command}
        onChange={(e) => setCommand(e.target.value)}
        className="border p-2"
      />
      <button onClick={sendCommand} className="ml-2 bg-blue-500 text-white p-2">
        Send
      </button>
      <p className="mt-4">Response: {response}</p>
    </div>
  );
}

export default App;
