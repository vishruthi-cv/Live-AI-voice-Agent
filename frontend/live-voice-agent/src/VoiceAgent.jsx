
import useGeminiLive from "./hooks/useGeminiLive";

export default function VoiceAgent() {
  const { status, error, connect, disconnect } = useGeminiLive();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-slate-950 text-white">
      <h1 className="text-3xl font-bold">Gemini Voice Agent</h1>

      <div className="rounded-full bg-slate-800 px-6 py-3">
        Status: {status}
      </div>

      <button
        onClick={status === "Connected" ? disconnect : connect}
        disabled={status === "Connecting"}
        className="rounded-xl bg-blue-600 px-8 py-4 font-semibold hover:bg-blue-500 disabled:opacity-50"
      >
        {status === "Connecting"
          ? "Connecting..."
          : status === "Connected"
          ? "End Conversation"
          : "Start Conversation"}
      </button>

      <p className="max-w-md text-center text-red-400">
        {error}
      </p>

      <p className="max-w-md text-center text-slate-400">
        Click Start Conversation, allow microphone access, and speak naturally.
      </p>
    </div>
  );
}
