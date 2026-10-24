import React from 'react'
import { useNavigate } from "react-router-dom";
import LightTunnel from "../Backgorunds/LightTunnel";

function Home() {
    const navigate = useNavigate();
    return (
        <>
            <div>
                <style>
                    {`
          @import url('https://fonts.googleapis.com/css2?family=Isometra&display=swap');
        `}
                </style>

                <div
                    className="bg-black relative w-full h-screen"
                >
                    <LightTunnel
                        cableColor="#EF4444"
                        pulseColor="#630f0f"
                        tunnelColor="#37786c"
                        tunnelOpacity={0}
                        speed={0.1}
                        flowDirection="outward"
                        pulseSpeed={2}
                        pulseLength={0.28}
                        pulseBlend={1}
                        pulseWidth={1}
                        cableCount={20}
                        thickness={0.35}
                        rimWidth={0.15}
                        waviness={0.3}
                        sway={0.5}
                        size={1}
                        centerX={0}
                        centerY={0}
                        glow={1}
                        fadeNear={0.5}
                        fadeFar={2}
                        brightness={1}
                        grain
                        grainIntensity={0.05}
                        opacity={1}
                        mouseInteraction
                        mouseStrength={0.1}
                    />

                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center">

                        <div
                            className="text-center text-white text-5xl"
                            style={{
                                fontFamily: '"Isometra", serif',
                                fontWeight: 400,
                                fontStyle: "normal",
                            }}
                        >
                            LIVE AI VOICE AGENT
                        </div>

                        {/* Button */}
                        <button
                            onClick={() => navigate("/mainPage")}


                            className="
              mt-8
              bg-white
              text-black
              px-10
              py-4
              rounded-full
              text-lg
              font-semibold
              shadow-xl
              hover:bg-gray-100
              hover:scale-105
              transition-all
              duration-300
              cursor-pointer
            "
                        >
                            Get Started
                        </button>

                    </div>
                </div>
            </div>

        </>
    )
}

export default Home