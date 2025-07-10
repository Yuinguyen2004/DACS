import { useState } from "react";

function App() {
  const [message, setMessage] = useState("");

  // Gọi API từ backend NestJS mẫu (cần thay đúng URL nếu khác)
  const callBackend = async () => {
    try {
      const res = await fetch("http://localhost:3000"); // Backend API endpoint NestJS
      const data = await res.text();
      setMessage(data);
    } catch (err) {
      setMessage("Lỗi gọi API backend!");
    }
  };

  return (
    <div style={{ padding: 40 }}>
      <h1>React Frontend (Vite)</h1>
      <button onClick={callBackend}>Gọi API backend NestJS</button>
      {message && (
        <div style={{ marginTop: 20 }}>
          <strong>Kết quả:</strong>
          <div>{message}</div>
        </div>
      )}
    </div>
  );
}

export default App;
