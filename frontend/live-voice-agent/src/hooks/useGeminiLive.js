
import { useRef, useState } from "react";
import { GoogleGenAI, Modality } from "@google/genai";

const BACKEND_URL = "http://localhost:5000";

export default function useGeminiLive() {
  const [status, setStatus] = useState("Disconnected");
  const [error, setError] = useState("");

  const sessionRef = useRef(null);
  const audioContextRef = useRef(null);
  const micStreamRef = useRef(null);
  const processorRef = useRef(null);
  const sourceRef = useRef(null);
  const nextPlayTimeRef = useRef(0);
  const playbackSourcesRef = useRef(new Set());
  const [chatMessages, setChatMessages] = useState([]);
  const [currentUserText, setCurrentUserText] = useState("");
  const [currentAIText, setCurrentAIText] = useState("");
  const userTextRef = useRef("");
  const aiTextRef = useRef("");

  function base64ToBytes(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);

    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    return bytes;
  }

  function playAudio(base64) {
    const context = audioContextRef.current;
    if (!context) return;

    const bytes = base64ToBytes(base64);
    const pcm = new Int16Array(
      bytes.buffer,
      bytes.byteOffset,
      Math.floor(bytes.byteLength / 2)
    );

    const audioBuffer = context.createBuffer(
      1,
      pcm.length,
      24000
    );

    const channel = audioBuffer.getChannelData(0);

    for (let i = 0; i < pcm.length; i++) {
      channel[i] = pcm[i] / 32768;
    }

    const source = context.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(context.destination);
    playbackSourcesRef.current.add(source);
    source.onended = () => {
      playbackSourcesRef.current.delete(source);
    };

    const startAt = Math.max(
      context.currentTime,
      nextPlayTimeRef.current
    );

    source.start(startAt);
    nextPlayTimeRef.current = startAt + audioBuffer.duration;
  }

  async function disconnect() {
    processorRef.current?.disconnect();
    sourceRef.current?.disconnect();

    processorRef.current = null;
    sourceRef.current = null;

    sessionRef.current?.close();
    sessionRef.current = null;

    micStreamRef.current?.getTracks().forEach((track) => {
      track.stop();
    });
    micStreamRef.current = null;

    playbackSourcesRef.current.forEach((source) => {
      try {
        source.stop();
      } catch {}
    });
    playbackSourcesRef.current.clear();

    if (audioContextRef.current) {
      await audioContextRef.current.close();
      audioContextRef.current = null;
    }

    setStatus("Disconnected");
  }

  async function connect() {
    try {
      setError("");
      setStatus("Connecting");

      // 1. Request a temporary Gemini token from our backend.
      const response = await fetch(
        `${BACKEND_URL}/api/voice/token`,
        { method: "POST" }
      );

      if (!response.ok) {
        throw new Error("Could not obtain a Gemini session token.");
      }

      const result = await response.json();

      if (!result.success || !result.token) {
        throw new Error("The backend did not return a valid token.");
      }

      // 2. Prepare audio. Microphone capture starts after permission.
      const context = new AudioContext();
      audioContextRef.current = context;
      await context.resume();

      // 3. Connect directly to Gemini Live using the temporary token.
      const ai = new GoogleGenAI({
        apiKey: result.token,
        httpOptions: { apiVersion: "v1beta" },
      });

      const session = await ai.live.connect({
        model: "gemini-3.8-live",
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction:
            "You are a helpful, friendly voice assistant. " +
            "Keep answers conversational and concise.",
        },
        callbacks: {
          onopen: () => {
            console.log("Gemini Live WebSocket connected!");
            setStatus("Connected");
          },

          onmessage: (message) => {
             console.log(
    "GEMINI MESSAGE JSON:",
    JSON.stringify(message, null, 2)
  );

             const content = message.serverContent;

    if (!content) return;

    // Live transcription of what the user says
    if (content.inputTranscription?.text) {
      userTextRef.current += content.inputTranscription.text;
      setCurrentUserText(userTextRef.current);
    }

    // Live transcription of Gemini's spoken response
    if (content.outputTranscription?.text) {
        aiTextRef.current += content.outputTranscription.text;
        setCurrentAIText(aiTextRef.current);
    }

    if (content.turnComplete) {
        const userText = userTextRef.current.trim();
        const aiText = aiTextRef.current.trim();

        setChatMessages((previous) => [
            ...previous,
            ...(userText ? [{ role: "user", text: userText }] : []),
            ...(aiText ? [{ role: "assistant", text: aiText }] : []),
        ]);

        userTextRef.current = "";
        aiTextRef.current = "";

        setCurrentUserText("");
        setCurrentAIText("");
    }


            const parts =
              message.serverContent?.modelTurn?.parts || [];

            for (const part of parts) {
              if (part.inlineData?.data) {
                playAudio(part.inlineData.data);
              }
            }
          },

          onerror: (event) => {
             console.error("Gemini Live error:", event);
            setError(event.message || "Gemini connection error.");
            setStatus("Error");
          },

          onclose: () => {
            console.log("Gemini Live WebSocket closed:", event);
            setStatus("Disconnected");
          },
        },
      });

      sessionRef.current = session;

      // 4. Ask for microphone permission.
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      micStreamRef.current = stream;

      console.log(
  "MICROPHONE TRACKS:",
  stream.getAudioTracks().map((track) => ({
    label: track.label,
    enabled: track.enabled,
    muted: track.muted,
    readyState: track.readyState,
  }))
);

      // 5. Capture audio and convert it to 16 kHz PCM.
      const micSource = context.createMediaStreamSource(stream);
      sourceRef.current = micSource;

      const processor = context.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      let sampleBuffer = [];

      processor.onaudioprocess = (event) => {
        if (!sessionRef.current) return;

        const input = event.inputBuffer.getChannelData(0);
        const inputRate = context.sampleRate;
        const ratio = inputRate / 16000;

        // Simple resampling from the device sample rate to 16 kHz.
        for (let i = 0; i < input.length; i += ratio) {
          sampleBuffer.push(input[Math.floor(i)]);
        }

        // Send short audio chunks.
        const chunkSize = 1600;

        while (sampleBuffer.length >= chunkSize) {
          const chunk = sampleBuffer.splice(0, chunkSize);
          const pcm = new Int16Array(chunk.length);

          for (let i = 0; i < chunk.length; i++) {
            const sample = Math.max(-1, Math.min(1, chunk[i]));
            pcm[i] = sample < 0
              ? sample * 32768
              : sample * 32767;
          }

          const bytes = new Uint8Array(pcm.buffer);
          let binary = "";

          for (let i = 0; i < bytes.length; i++) {
            binary += String.fromCharCode(bytes[i]);
          }

          const samples = event.inputBuffer.getChannelData(0);

const rms = Math.sqrt(
  samples.reduce((sum, sample) => sum + sample * sample, 0) /
  samples.length
);

console.log("MIC RMS:", rms);

          sessionRef.current.sendRealtimeInput({
            audio: {
              data: btoa(binary),
              mimeType: "audio/pcm;rate=16000",
            },
          });
        }
      };

      micSource.connect(processor);

      // Keep the processor running without playing microphone audio.
      const silentGain = context.createGain();
      silentGain.gain.value = 0;
      processor.connect(silentGain);
      silentGain.connect(context.destination);
    } catch (err) {
      console.error(err);
      setError(err.message || "Could not start the voice agent.");
      await disconnect();
    }
  }

  return {
    status,
    error,
    connect,
    disconnect,
    chatMessages,
    currentUserText,
    currentAIText,
};
}
