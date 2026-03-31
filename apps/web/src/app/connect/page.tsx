"use client";

import { useState } from "react";
import { whatsapp } from "../../lib/api";

type ConnectionState = "disconnected" | "launching" | "qr" | "authenticating" | "connected";

export default function ConnectPage() {
  const [state, setState] = useState<ConnectionState>("disconnected");
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [chatCount, setChatCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    setError(null);

    try {
      // Step 1: Launch browser
      setState("launching");
      await whatsapp.launch();

      // Step 2: Get QR code
      setState("qr");
      // Poll for QR code
      let qr: string | null = null;
      for (let i = 0; i < 30; i++) {
        const result = await whatsapp.getQr();
        if (result.qr) {
          qr = result.qr;
          break;
        }
        await new Promise((r) => setTimeout(r, 1000));
      }
      setQrUrl(qr);

      // Step 3: Wait for auth
      setState("authenticating");
      const authResult = await whatsapp.auth();
      setChatCount(authResult.chatCount);
      setState("connected");
    } catch (err) {
      setError(String(err));
      setState("disconnected");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-6">
      <div className="w-full max-w-md text-center">
        <h2 className="text-2xl font-bold mb-2">Connect WhatsApp</h2>
        <p className="text-muted mb-8">
          Link your WhatsApp account to start using SuperWA
        </p>

        {state === "disconnected" && (
          <button
            onClick={handleConnect}
            className="px-8 py-3 rounded-xl bg-accent text-white font-semibold text-lg hover:bg-accent-dark transition-colors"
          >
            Connect WhatsApp Web
          </button>
        )}

        {state === "launching" && (
          <div className="space-y-4">
            <div className="animate-pulse text-4xl">🌐</div>
            <p className="text-muted">Launching browser...</p>
          </div>
        )}

        {state === "qr" && (
          <div className="space-y-4">
            {qrUrl ? (
              <>
                <p className="text-sm text-muted">Scan this QR code with WhatsApp on your phone</p>
                <img src={qrUrl} alt="WhatsApp QR Code" className="mx-auto rounded-xl border border-border" />
              </>
            ) : (
              <>
                <p className="text-sm text-muted">
                  A browser window has opened with WhatsApp Web.
                </p>
                <p className="text-sm text-muted">
                  Scan the QR code in that window with your phone.
                </p>
              </>
            )}
          </div>
        )}

        {state === "authenticating" && (
          <div className="space-y-4">
            <div className="animate-spin text-4xl">⏳</div>
            <p className="text-muted">Waiting for authentication & syncing data...</p>
          </div>
        )}

        {state === "connected" && (
          <div className="space-y-4">
            <div className="text-5xl">✅</div>
            <p className="text-lg font-semibold text-accent-dark">Connected!</p>
            <p className="text-muted">{chatCount} chats synced</p>
            <a
              href="/"
              className="inline-block mt-4 px-6 py-2.5 rounded-xl bg-accent text-white font-medium hover:bg-accent-dark transition-colors"
            >
              Go to Inbox
            </a>
          </div>
        )}

        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
