import useGeminiLive from "./hooks/useGeminiLive";

function MicIcon({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0" />
      <line x1="12" y1="18" x2="12" y2="22" />
      <line x1="8" y1="22" x2="16" y2="22" />
    </svg>
  );
}

export default function VoiceAgent() {
  const { status, error, connect, disconnect } = useGeminiLive();

  const isConnected = status === "Connected";
  const isConnecting = status === "Connecting";

  const hint = isConnecting
    ? "Connecting..."
    : isConnected
      ? "Listening... tap the microphone to end"
      : "Tap the microphone and speak naturally";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-slate-950 text-white">
      <h1 className="text-3xl font-bold">Gemini Voice Agent</h1>

      <div className="rounded-full bg-slate-800 px-6 py-3">
        Status: {status}
      </div>

      {/* Microphone button: tap to start, tap again to stop */}
      <div className="relative flex items-center justify-center">
        {isConnected && (
          <span className="absolute h-24 w-24 animate-ping rounded-full bg-red-500 opacity-40" />
        )}

        <button
          onClick={isConnected ? disconnect : connect}
          disabled={isConnecting}
          aria-label={isConnected ? "Stop conversation" : "Start speaking"}
          className={`relative flex h-24 w-24 items-center justify-center rounded-full shadow-lg transition disabled:opacity-50 ${isConnected
              ? "bg-red-600 hover:bg-red-500"
              : "bg-blue-600 hover:bg-blue-500"
            } ${isConnecting ? "animate-pulse" : ""}`}
        >
          <MicIcon className="h-10 w-10 text-white" />
        </button>
      </div>

      <p className="max-w-md text-center text-slate-400">{hint}</p>

      <p className="max-w-md text-center text-red-400">{error}</p>
    </div>
  );
}