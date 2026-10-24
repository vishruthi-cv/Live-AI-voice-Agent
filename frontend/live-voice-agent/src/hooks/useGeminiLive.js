
import { useRef, useState } from "react";
import { GoogleGenAI, Modality } from "@google/genai";

const BACKEND_URL = `http://localhost:${import.meta.env.VITE_PORT || 5001}`;

export default function useGeminiLive() {
  const [status, setStatus] = useState("Disconnected");
  const [error, setError] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [currentUserText, setCurrentUserText] = useState("");
  const [currentAIText, setCurrentAIText] = useState("");

  const sessionRef = useRef(null);
  const audioContextRef = useRef(null);
  const micStreamRef = useRef(null);
  const processorRef = useRef(null);
  const sourceRef = useRef(null);
  const silentGainRef = useRef(null);

  const nextPlayTimeRef = useRef(0);
  const playbackSourcesRef = useRef(new Set());

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

    if (!context || context.state === "closed") return;

    try {
      const bytes = base64ToBytes(base64);

      // Gemini audio responses are normally 16-bit PCM.
      const sampleCount = Math.floor(bytes.byteLength / 2);
      if (sampleCount === 0) return;

      const pcm = new Int16Array(
        bytes.buffer,
        bytes.byteOffset,
        sampleCount
      );

      // Gemini Live audio output is 24 kHz PCM.
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

      console.log(
        "Playing Gemini audio:",
        audioBuffer.duration,
        "seconds; AudioContext:",
        context.state
      );
    } catch (err) {
      console.error("Audio playback failed:", err);
    }
  }

  async function disconnect() {
    // Disconnect microphone processing.
    if (processorRef.current) {
      processorRef.current.onaudioprocess = null;
      processorRef.current.disconnect();
      processorRef.current = null;
    }

    sourceRef.current?.disconnect();
    sourceRef.current = null;

    silentGainRef.current?.disconnect();
    silentGainRef.current = null;

    // Close the Gemini session.
    const session = sessionRef.current;
    sessionRef.current = null;

    if (session) {
      try {
        session.close();
      } catch (err) {
        console.warn("Error closing Gemini session:", err);
      }
    }

    // Stop the microphone.
    micStreamRef.current?.getTracks().forEach((track) => {
      track.stop();
    });
    micStreamRef.current = null;

    // Stop any audio that is still playing.
    playbackSourcesRef.current.forEach((source) => {
      try {
        source.stop();
      } catch {
        // The source may already have stopped.
      }
    });

    playbackSourcesRef.current.clear();
    nextPlayTimeRef.current = 0;

    // Close the audio context.
    const context = audioContextRef.current;
    audioContextRef.current = null;

    if (context && context.state !== "closed") {
      try {
        await context.close();
      } catch (err) {
        console.warn("Error closing AudioContext:", err);
      }
    }

    userTextRef.current = "";
    aiTextRef.current = "";

    setCurrentUserText("");
    setCurrentAIText("");
    setStatus("Disconnected");
  }

  async function connect() {
    if (
      sessionRef.current ||
      status === "Connecting"
    ) {
      return;
    }

    try {
      setError("");
      setStatus("Connecting");

      console.log("Requesting Gemini token from:", BACKEND_URL);

      // 1. Request a temporary Gemini token from the backend.
      const response = await fetch(
        `${BACKEND_URL}/api/voice/token`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const responseText = await response.text();

        throw new Error(
          `Token request failed (${response.status}): ${responseText || response.statusText
          }`
        );
      }

      const result = await response.json();

      if (!result.success || !result.token) {
        throw new Error(
          result.message || "The backend did not return a valid token."
        );
      }

      // 2. Prepare audio. This is initiated by the user's button click.
      const context = new AudioContext();
      audioContextRef.current = context;

      await context.resume();

      console.log("AudioContext state:", context.state);
      console.log("Audio sample rate:", context.sampleRate);

      // 3. Connect to Gemini Live using the temporary token.
      const ai = new GoogleGenAI({
        apiKey: result.token,
        httpOptions: {
          apiVersion: "v1beta",
        },
      });

      const session = await ai.live.connect({
        model: "gemini-3.8-live",
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {},
          outputAudioTranscription: {},
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
            const content = message.serverContent;

            if (!content) return;

            console.log(
              "Gemini Live message:",
              JSON.stringify(message, null, 2)
            );

            // 1. Display the user's transcription.
            if (content.inputTranscription?.text) {
              userTextRef.current +=
                content.inputTranscription.text;

              setCurrentUserText(userTextRef.current);
            }

            // 2. Display Gemini's response transcription.
            if (content.outputTranscription?.text) {
              aiTextRef.current +=
                content.outputTranscription.text;

              setCurrentAIText(aiTextRef.current);
            }

            // 3. Play Gemini's audio response.
            const parts = content.modelTurn?.parts || [];

            for (const part of parts) {
              if (part.inlineData?.data) {
                console.log(
                  "Gemini audio received:",
                  part.inlineData.mimeType
                );

                playAudio(part.inlineData.data);
              }
            }

            // 4. Save the completed conversation turn.
            if (content.turnComplete) {
              const userText = userTextRef.current.trim();
              const aiText = aiTextRef.current.trim();

              setChatMessages((previous) => [
                ...previous,
                ...(userText
                  ? [{ role: "user", text: userText }]
                  : []),
                ...(aiText
                  ? [{ role: "assistant", text: aiText }]
                  : []),
              ]);

              userTextRef.current = "";
              aiTextRef.current = "";

              setCurrentUserText("");
              setCurrentAIText("");
            }
          },

          onerror: (event) => {
            console.error("Gemini Live error:", event);

            setError(
              event?.message || "Gemini connection error."
            );
            setStatus("Error");
          },

          onclose: (event) => {
            console.log(
              "Gemini Live WebSocket closed:",
              event
            );

            sessionRef.current = null;
            setStatus("Disconnected");
          },
        },
      });

      sessionRef.current = session;

      // 4. Request microphone permission.
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      micStreamRef.current = stream;

      console.log(
        "Microphone tracks:",
        stream.getAudioTracks().map((track) => ({
          label: track.label,
          enabled: track.enabled,
          muted: track.muted,
          readyState: track.readyState,
        }))
      );

      // 5. Capture microphone audio and resample to 16 kHz PCM.
      const micSource = context.createMediaStreamSource(stream);
      sourceRef.current = micSource;

      const processor = context.createScriptProcessor(
        4096,
        1,
        1
      );

      processorRef.current = processor;

      let sampleBuffer = [];

      processor.onaudioprocess = (event) => {
        if (
          !sessionRef.current ||
          context.state !== "running"
        ) {
          return;
        }

        const input = event.inputBuffer.getChannelData(0);
        const ratio = context.sampleRate / 16000;

        // Linear sample selection for basic resampling.
        for (let i = 0; i < input.length; i += ratio) {
          sampleBuffer.push(input[Math.floor(i)]);
        }

        // Send chunks of 100 ms at 16 kHz.
        const chunkSize = 1600;

        while (sampleBuffer.length >= chunkSize) {
          const chunk = sampleBuffer.splice(0, chunkSize);
          const pcm = new Int16Array(chunk.length);

          for (let i = 0; i < chunk.length; i++) {
            const sample = Math.max(
              -1,
              Math.min(1, chunk[i])
            );

            pcm[i] =
              sample < 0
                ? sample * 32768
                : sample * 32767;
          }

          const bytes = new Uint8Array(pcm.buffer);

          let binary = "";

          for (let i = 0; i < bytes.length; i++) {
            binary += String.fromCharCode(bytes[i]);
          }

          sessionRef.current.sendRealtimeInput({
            audio: {
              data: btoa(binary),
              mimeType: "audio/pcm;rate=16000",
            },
          });
        }
      };

      micSource.connect(processor);

      // Keep the processor active without playing microphone audio.
      const silentGain = context.createGain();
      silentGain.gain.value = 0;

      silentGainRef.current = silentGain;

      processor.connect(silentGain);
      silentGain.connect(context.destination);
    } catch (err) {
      console.error("Could not start Gemini Live:", err);

      setError(
        err?.message || "Could not start the voice agent."
      );

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
