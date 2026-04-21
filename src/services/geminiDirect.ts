import axios from "axios";

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function tryModel(apiKey: string, model: string, prompt: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  const response = await axios.post(
    url,
    {
      contents: [
        {
          parts: [{ text: prompt }]
        }
      ]
    },
    {
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey
      },
      timeout: 60000
    }
  );

  return response.data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

export async function callGeminiDirect(
  apiKey: string,
  systemPrompt: string,
  userMessage: string
): Promise<string> {
  const prompt = `${systemPrompt}\n\n${userMessage}`;
  const models = ["gemini-2.5-flash", "gemini-2.5-flash-lite"];

  let lastError: any;

  for (const model of models) {
    for (let attempt = 1; attempt <= 1; attempt++) {
      try {
        return await tryModel(apiKey, model, prompt);
      } catch (error: any) {
        lastError = error;
        const status = error?.response?.status;

        // retry temporary issues
        if (status === 503 || status === 500 || status === 429) {
          await sleep(attempt * 2000);
          continue;
        }

        // non-retryable error: wrong key, bad request, etc.
        throw error;
      }
    }
  }

  const details =
    lastError?.response?.data?.error?.message ||
    lastError?.response?.data?.error ||
    lastError?.message ||
    String(lastError);

  throw new Error(`Gemini request failed: ${details}`);
}