import * as vscode from "vscode";
import { callGroqDirect } from "./groqDirect";
import { callGeminiDirect } from "./geminiDirect";
import { callTrialReviewApi } from "./trialApi";
import {
  ProviderMode,
  MODE_KEY,
  INSTALLATION_ID_KEY,
  GROQ_SECRET_KEY,
  GEMINI_SECRET_KEY
} from "./setupService";

export async function runAiRequest(
  context: vscode.ExtensionContext,
  systemPrompt: string,
  userPrompt: string,
  maxTokens = 2048
): Promise<string> {
  const mode = context.globalState.get<ProviderMode>(MODE_KEY);

  if (mode === "groq_own") {
    const key = await context.secrets.get(GROQ_SECRET_KEY);
    if (!key) {
      throw new Error("Groq API key not found.");
    }

    return await callGroqDirect(key, systemPrompt, userPrompt, maxTokens);
  }

  if (mode === "gemini_own") {
    const key = await context.secrets.get(GEMINI_SECRET_KEY);
    if (!key) {
      throw new Error("Gemini API key not found.");
    }

    return await callGeminiDirect(key, systemPrompt, userPrompt);
  }

  if (mode === "free_trial") {
    const installationId = context.globalState.get<string>(INSTALLATION_ID_KEY);
    if (!installationId) {
      throw new Error("Installation ID not found.");
    }

    return await callTrialReviewApi(
      installationId,
      systemPrompt,
      userPrompt,
      maxTokens
    );
  }

  throw new Error("Provider not configured.");
}