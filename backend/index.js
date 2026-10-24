
import "dotenv/config";
import express from "express";
import cors from "cors";
import { GoogleGenAI } from "@google/genai";

const app = express();
const PORT = process.env.PORT || 5000;

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is missing from server/.env");
}

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
    apiVersion: "v1alpha",
  },
});

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  })
);

app.use(express.json());

// Check whether the backend is running
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Gemini Voice Agent backend is running",
  });
});

// Create a temporary credential for one Gemini Live session
app.post("/api/voice/token", async (req, res) => {
  try {
    const token = await ai.authTokens.create({
      config: {
        uses: 1,
        expireTime: new Date(
          Date.now() + 30 * 60 * 1000
        ).toISOString(),
        newSessionExpireTime: new Date(
          Date.now() + 60 * 1000
        ),
        liveConnectConstraints: {
          model: "gemini-3.8-live",
          config: {
            responseModalities: ["AUDIO"],
            systemInstruction: {
              parts: [
                {
                  text:
                    "You are a helpful, friendly voice assistant. " +
                    "Keep answers conversational and concise.",
                },
              ],
            },
          },
        },
      },
    });

    res.json({
      success: true,
      token: token.name,
      expiresAt: token.expireTime,
    });
  } catch (error) {
    console.error(
      "Gemini token creation failed:",
      error.message
    );

    res.status(500).json({
      success: false,
      message: "Could not create a Gemini Live session token.",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});
