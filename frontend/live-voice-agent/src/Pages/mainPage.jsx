import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function MainPage() {
    const navigate = useNavigate();

    // Simple beginner states
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState("Your live transcription will appear here...");
    const [inputText, setTextInput] = useState("");
    const [chatHistory, setChatHistory] = useState([
        ""
    ]);

    // Microphone toggle button
    const handleMicClick = () => {
        if (!isListening) {
            setIsListening(true);
            setTranscript("Listening... ");
        } else {
            setIsListening(false);
            setTranscript("Microphone stopped.");
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

                <div className="bg-neutral-950 border border-red-900/60 rounded-xl p-4 flex flex-col">
                    <div className="flex justify-between items-center mb-3">
                        <h2 className="text-red-400 font-semibold text-sm uppercase">History Area</h2>
                        <button
                            onClick={() => setChatHistory([])}
                            className="text-xs text-gray-500 hover:text-red-400"
                        >
                            Clear
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-2 text-sm text-gray-300">
                        {chatHistory.length === 0 ? (
                            <p className="text-gray-600 text-xs italic">No history yet.</p>
                        ) : (
                            chatHistory.map((item, index) => (
                                <div key={index} className="p-2 bg-neutral-900 border border-neutral-800 rounded">
                                    {item}
                                </div>
                            ))
                        )}
                    </div>
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

                        <p className="text-xs text-gray-400 mt-4">
                            {isListening ? "Microphone is on. Click to stop." : "Click microphone button to talk."}
                        </p>
                    </div>

                    <div className="bg-neutral-950 border border-red-900/60 rounded-xl p-4">
                        <h2 className="text-red-400 font-semibold text-sm uppercase mb-2">Transcribe Area</h2>
                        <div className="bg-neutral-900 border border-neutral-800 rounded p-3 text-sm text-gray-200 min-h-[60px]">
                            {transcript}
                        </div>
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