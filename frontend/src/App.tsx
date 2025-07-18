import { useState } from 'react'
import { Button } from '@/components/ui/button'

function App() {
  const [message, setMessage] = useState<string>("");

  // Gọi API từ backend NestJS mẫu (cần thay đúng URL nếu khác)
  const callBackend = async (): Promise<void> => {
    try {
      const res = await fetch("http://localhost:3000"); // Backend API endpoint NestJS
      const data = await res.text();
      setMessage(data);
    } catch (error) {
      console.error('API call failed:', error);
      setMessage("Lỗi gọi API backend!");
    }
  };

  return (
    <div className="p-10 bg-background min-h-screen">
      <div className="max-w-md mx-auto bg-card rounded-lg shadow-lg p-6 border">
        <h1 className="text-2xl font-bold text-foreground mb-4">React Frontend (Vite)</h1>
        <Button onClick={callBackend} className="w-full">
          Gọi API backend NestJS
        </Button>
        {message && (
          <div className="mt-4 p-4 bg-muted rounded-lg border">
            <strong className="text-foreground">Kết quả:</strong>
            <div className="text-muted-foreground mt-1">{message}</div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
