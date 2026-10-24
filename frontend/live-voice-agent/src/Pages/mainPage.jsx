import React, { useState, useEffect, useRef} from "react";
import useGeminiLive from "../hooks/useGeminiLive";
import { useNavigate } from "react-router-dom";

function MainPage() {
    const navigate = useNavigate();

    const { status, error, connect, disconnect, chatMessages,
    currentUserText,
    currentAIText, } = useGeminiLive();

    // Simple beginner states
  
    const isListening = status === "Connected";
    const chatEndRef = useRef(null);

    const [inputText, setTextInput] = useState("");
    const [chatHistory, setChatHistory] = useState([
        ""
    ]);

    useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
}, [chatMessages, currentUserText, currentAIText]);


    // Microphone toggle button
    const handleMicClick = async() => {
        if (!isListening) {
            disconnect();
        } else {
            await connect();
        }
    };

    // Send message button
    const handleSend = () => {
        if (inputText.trim() === "") return;


        setChatHistory([...chatHistory, `User: ${inputText}`]);
        setTranscript(`You said: "${inputText}"`);
        setTextInput("");
    };

    return (
        <div className="bg-black text-white min-h-screen p-6 flex flex-col justify-between">

            <style>
                {`@import url('https://fonts.googleapis.com/css2?family=Isometra&display=swap');`}
            </style>




            <div className="flex items-center justify-around border-b border-red-900/50 pb-4">
                <button
                    onClick={() => navigate("/")}
                    className="text-red-500 hover:text-red-400 text-sm border border-red-900 px-3 py-1 rounded"
                >
                    ← Back to Home
                </button>

                <h1
                    className="text-2xl text-red-500 tracking-wider"
                    style={{ fontFamily: '"Isometra", serif' }}
                >
                    AI VOICE AGENT
                </h1>


            </div>


            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 my-6">

                
<div className="bg-neutral-950 border border-red-900/60 rounded-xl p-4 flex flex-col min-h-[400px] md:min-h-0">
    <div className="flex justify-between items-center mb-4">
        <h2 className="text-red-400 font-semibold text-sm uppercase">
            Live Conversation
        </h2>

        <span className={`text-xs ${isListening ? "text-green-400" : "text-gray-500"}`}>
            {isListening ? "● Connected" : "● Disconnected"}
        </span>
    </div>

    <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {chatMessages.length === 0 &&
         !currentUserText &&
         !currentAIText && (
            <p className="text-gray-500 text-sm text-center mt-10">
                Your conversation will appear here.
                <br />
                Click the microphone to get started.
            </p>
        )}

        {chatMessages.map((message, index) => (
            <div
                key={index}
                className={`flex ${
                    message.role === "user"
                        ? "justify-end"
                        : "justify-start"
                }`}
            >
                <div
                    className={`max-w-[90%] rounded-xl p-3 text-sm whitespace-pre-wrap break-words ${
                        message.role === "user"
                            ? "bg-red-950 border border-red-800 text-red-100"
                            : "bg-neutral-900 border border-neutral-800 text-gray-200"
                    }`}
                >
                    <p className="text-[10px] uppercase tracking-wider mb-1 opacity-60">
                        {message.role === "user" ? "You" : "Gemini"}
                    </p>
                    {message.text}
                </div>
            </div>
        ))}

        {currentUserText && (
            <div className="flex justify-end">
                <div className="max-w-[90%] rounded-xl p-3 text-sm whitespace-pre-wrap break-words bg-red-950/70 border border-red-800/70 text-red-100">
                    <p className="text-[10px] uppercase tracking-wider mb-1 opacity-60">
                        You · Listening
                    </p>
                    {currentUserText}
                    <span className="inline-block w-1.5 h-3 ml-1 bg-red-400 animate-pulse" />
                </div>
            </div>
        )}

        {currentAIText && (
            <div className="flex justify-start">
                <div className="max-w-[90%] rounded-xl p-3 text-sm whitespace-pre-wrap break-words bg-neutral-900 border border-neutral-800 text-gray-200">
                    <p className="text-[10px] uppercase tracking-wider mb-1 text-purple-400">
                        Gemini · Speaking
                    </p>
                    {currentAIText}
                    <span className="inline-block w-1.5 h-3 ml-1 bg-purple-400 animate-pulse" />
                </div>
            </div>
        )}

        <div ref={chatEndRef} />
    </div>

    {error && (
        <p className="text-red-400 text-xs mt-3">{String(error)}</p>
    )}
</div>


                <div className="md:col-span-2 flex flex-col gap-6">


                    <div className="bg-neutral-950 border border-red-900/60 rounded-xl p-8 flex flex-col items-center justify-center flex-1 text-center">

                        <button
                            onClick={handleMicClick}
                            className={`w-28 h-28 rounded-full flex flex-col items-center justify-center transition-all duration-300 cursor-pointer shadow-lg ${isListening
                                ? "bg-red-600 text-white shadow-red-600/50 scale-105 animate-pulse"
                                : "bg-neutral-900 border-2 border-red-500 text-red-500 hover:bg-neutral-800"
                                }`}
                        >
                            {/* Mic Icon */}
                            <svg className="w-10 h-10 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 100-6 3 3 0 000 6z"
                                />
                            </svg>
                            <span className="text-xs font-bold uppercase">
                                {isListening ? "Listening" : "Speak"}
                            </span>
                        </button>
                        <div className="rounded-full text-red-400 px-6 py-1.5 m-2">
                            Status: {status}
                        </div>
                        <button
                            onClick={status === "Connected" ? disconnect : connect}
                            disabled={status === "Connecting"}
                            className="rounded-xl bg-gray-500 px-5 py-2 font-semibold hover:bg-gray-300 disabled:opacity-50"
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


                        <p className="text-xs text-gray-400 mt-4">
                            {isListening ? "Microphone is on. Click to stop." : "Click microphone button to talk."}
                        </p>
                    </div>

                    <div className="bg-neutral-950 border border-red-900/60 rounded-xl p-4">
                        <h2 className="text-red-400 font-semibold text-sm uppercase mb-2">Transcribe Area</h2>
                        
                    </div>

                </div>
            </div>

            <div className="flex gap-3 bg-neutral-950 border border-red-900/60 p-3 rounded-xl">
                <input
                    type="text"
                    placeholder="Type a message to the AI agent..."
                    value={inputText}
                    onChange={(e) => setTextInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    className="flex-1 bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-red-500"
                />
                <button
                    onClick={handleSend}
                    className="bg-red-600 hover:bg-red-500 text-white px-6 py-2 rounded-lg text-sm font-semibold transition"
                >
                    Send
                </button>
            </div>

        </div>
    );
}

export default MainPage;