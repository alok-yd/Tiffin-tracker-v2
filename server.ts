import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '20mb' }));

// Server-side GoogleGenAI initialization
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Chat API endpoint (Multi-turn conversation with model selection & role instruction)
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const { messages, model, systemRole, useThinking } = req.body;
    // Supported models as requested:
    // gemini-3.1-pro-preview for complex tasks
    // gemini-3.5-flash for general tasks
    // gemini-3.1-flash-lite for fast tasks
    let selectedModel = model || 'gemini-3.5-flash';
    if (!['gemini-3.1-pro-preview', 'gemini-3.5-flash', 'gemini-3.1-flash-lite'].includes(selectedModel)) {
      selectedModel = 'gemini-3.5-flash';
    }

    const systemInstruction = systemRole ||
      'You are TiffinGuru, an intelligent, empathetic mess & nutrition assistant tailored for competitive exam aspirants (UPSC, JEE, NEET, GATE, CAT). Help with diet planning, meal timings, mess cost disputes, tiffin quality advice, and exam stamina.';

    const formattedContents = (messages || []).map((m: { role: string; content: string }) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const config: any = {
      systemInstruction,
    };

    if (useThinking || selectedModel === 'gemini-3.1-pro-preview') {
      config.thinkingConfig = {
        thinkingLevel: ThinkingLevel.HIGH,
      };
      // Do not set maxOutputTokens when thinkingLevel is HIGH
    }

    const response = await ai.models.generateContent({
      model: selectedModel,
      contents: formattedContents,
      config,
    });

    res.json({
      reply: response.text || 'No response generated.',
      modelUsed: selectedModel,
    });
  } catch (error: any) {
    console.error('Chat error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate chat response' });
  }
});

// Deep Thinking Mode API endpoint for complex aspirant analysis & dispute resolution
app.post('/api/thinking-analysis', async (req: Request, res: Response) => {
  try {
    const { prompt, context } = req.body;
    // Must use gemini-3.1-pro-preview and thinkingLevel: ThinkingLevel.HIGH without maxOutputTokens
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `Context data: ${JSON.stringify(context || {})}\n\nAspirant Query: ${prompt}\n\nPlease perform deep strategic reasoning to give comprehensive advice, accurate calculation, and diplomatic solutions for mess management/nutrition.`,
            },
          ],
        },
      ],
      config: {
        systemInstruction:
          'You are an expert student advisor and food auditor specializing in hostel/mess life, student budgets, nutritional biochemistry for long study hours, and contractual billing rules. Think step-by-step with high reasoning.',
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.HIGH,
        },
      },
    });

    res.json({
      analysis: response.text || 'Analysis complete.',
      modelUsed: 'gemini-3.1-pro-preview',
    });
  } catch (error: any) {
    console.error('Thinking analysis error:', error);
    res.status(500).json({ error: error.message || 'Thinking analysis failed' });
  }
});

// Image Analysis API endpoint (Gemini 3.1 Pro Preview with Vision)
app.post('/api/analyze-image', async (req: Request, res: Response) => {
  try {
    const { imageBase64, mimeType, prompt } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: 'imageBase64 is required' });
    }

    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: {
        parts: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType: mimeType || 'image/jpeg',
            },
          },
          {
            text:
              prompt ||
              'Analyze this tiffin meal or mess bill/notice photo. Identify: 1) What dishes are visible (rotis, sabzi, dal, rice, salad). 2) Estimated nutritional quality & hygiene score (1-10). 3) Freshness and portion adequacy for a student studying 10+ hours. 4) Suggested feedback to give the mess vendor.',
          },
        ],
      },
      config: {
        systemInstruction:
          'You are a qualified nutritionist and tiffin auditor helping students evaluate their daily mess food quality, hygiene, and dietary balance.',
      },
    });

    res.json({
      analysis: response.text || 'Image analysis completed.',
      model: 'gemini-3.1-pro-preview',
    });
  } catch (error: any) {
    console.error('Image analysis error:', error);
    res.status(500).json({ error: error.message || 'Failed to analyze image' });
  }
});

// Image Generation API endpoint with aspect ratios
app.post('/api/generate-image', async (req: Request, res: Response) => {
  try {
    const { prompt, aspectRatio, quality } = req.body;
    // Supported aspect ratios: 1:1, 2:3, 3:2, 3:4, 4:3, 9:16, 16:9, 21:9
    const validRatios = ['1:1', '2:3', '3:2', '3:4', '4:3', '9:16', '16:9', '21:9'];
    const chosenRatio = validRatios.includes(aspectRatio) ? aspectRatio : '1:1';

    // Model selection based on user prompt instructions:
    // Use gemini-nano-banana-2.1 for general cases, or gemini-3-pro-image-preview where studio-quality images are required.
    const chosenModel = quality === 'studio' ? 'gemini-3-pro-image-preview' : 'gemini-nano-banana-2.1';

    const response = await ai.models.generateContent({
      model: chosenModel,
      contents: {
        parts: [
          {
            text: `Wholesome Indian tiffin meal, ${prompt || 'authentic steel tiffin dabba filled with warm chapati, dal tadka, paneer bhurji and fresh salad'}. Professional food photography, clean appetizing presentation, warm natural light.`,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: chosenRatio,
          imageSize: '1K',
        },
      },
    });

    let imageUrl = null;
    let descriptionText = '';

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData?.data) {
          imageUrl = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
          break;
        } else if (part.text) {
          descriptionText += part.text;
        }
      }
    }

    if (!imageUrl) {
      return res.status(500).json({ error: 'Image generation did not return image data', text: descriptionText });
    }

    res.json({
      imageUrl,
      aspectRatio: chosenRatio,
      modelUsed: chosenModel,
      description: descriptionText,
    });
  } catch (error: any) {
    console.error('Image generation error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate image' });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TiffinTrack server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
