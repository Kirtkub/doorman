import { useState } from "react";

export default function Home() {
  const [status, setStatus] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handleSetWebhook = async () => {
    setLoading(true);
    setStatus("Setting webhook...");
    
    try {
      const response = await fetch('/api/set-webhook', {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      const data = await response.json();
      
      if (data.success) {
        setStatus(`Success! Webhook set to: ${data.webhookUrl}`);
      } else {
        setStatus(`Error: ${data.error || "Failed to set webhook"}`);
      }
    } catch (error: any) {
      setStatus(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      backgroundColor: '#f5f5f5',
      padding: '20px',
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '10px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        maxWidth: '500px',
        width: '100%',
        textAlign: 'center',
      }}>
        <h1 style={{
          marginBottom: '30px',
          color: '#333',
          fontSize: '28px',
        }}>
          Cleo & Leo Telegram Bot
        </h1>
        
        <button
          onClick={handleSetWebhook}
          disabled={loading}
          style={{
            backgroundColor: loading ? '#ccc' : '#0070f3',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            fontSize: '16px',
            borderRadius: '5px',
            cursor: loading ? 'not-allowed' : 'pointer',
            marginBottom: '20px',
            width: '100%',
            transition: 'background-color 0.2s',
          }}
          onMouseOver={(e) => {
            if (!loading) e.currentTarget.style.backgroundColor = '#0051cc';
          }}
          onMouseOut={(e) => {
            if (!loading) e.currentTarget.style.backgroundColor = '#0070f3';
          }}
        >
          {loading ? "Setting Webhook..." : "Set Webhook"}
        </button>

        {status && (
          <div style={{
            marginTop: '20px',
            padding: '15px',
            backgroundColor: status.includes('✅') ? '#e8f5e9' : '#ffebee',
            borderRadius: '5px',
            fontSize: '14px',
            color: '#333',
            wordBreak: 'break-word',
          }}>
            {status}
          </div>
        )}

        <p style={{
          marginTop: '30px',
          fontSize: '14px',
          color: '#666',
        }}>
           Set the webhook once after the app has a public HTTPS URL. The bot
           will approve configured channel join requests and show membership
           status whenever a user messages it.
        </p>
      </div>
    </div>
  );
}
