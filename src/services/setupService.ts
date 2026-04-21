import * as vscode from "vscode";
import { startTrial } from "./trialApi";

export type ProviderMode = "groq_own" | "gemini_own" | "free_trial";

export const MODE_KEY = "providerMode";
export const ONBOARDED_KEY = "onboarded";
export const INSTALLATION_ID_KEY = "installationId";
export const GROQ_SECRET_KEY = "groqApiKey";
export const GEMINI_SECRET_KEY = "geminiApiKey";

export async function ensureProviderConfigured(
  context: vscode.ExtensionContext
): Promise<boolean> {
  const onboarded = context.globalState.get<boolean>(ONBOARDED_KEY, false);
  const mode = context.globalState.get<ProviderMode | undefined>(MODE_KEY);

  if (onboarded && mode) {
    return true;
  }

  return await runSetupFlow(context);
}

export async function runSetupFlow(
  context: vscode.ExtensionContext
): Promise<boolean> {
  const choice = await vscode.window.showQuickPick(
    [
      {
        label: "Use my own Groq API key",
        description: "Review using your own Groq key"
      },
      {
        label: "Use my own Gemini API key",
        description: "Review using your own Gemini key"
      },
      {
        label: "Use 10 free reviews",
        description: "Uses the extension's hosted backend"
      }
    ],
    {
      title: "AI Code Reviewer Setup",
      placeHolder: "Choose how you want to use the extension",
      ignoreFocusOut: true
    }
  );

  if (!choice) {
    return false;
  }

  // ---- GROQ ----
  if (choice.label === "Use my own Groq API key") {
    const existingGroqKey = await context.secrets.get(GROQ_SECRET_KEY);

    if (existingGroqKey) {
      await context.globalState.update(MODE_KEY, "groq_own");
      await context.globalState.update(ONBOARDED_KEY, true);
      vscode.window.showInformationMessage("Switched to Groq successfully.");
      return true;
    }

    const action = await vscode.window.showInformationMessage(
      "You can create a Groq API key from the Groq console.",
      "Open Groq Key Page",
      "Continue"
    );

    if (action === "Open Groq Key Page") {
      await vscode.env.openExternal(
        vscode.Uri.parse("https://console.groq.com/keys")
      );
    }

    const key = await vscode.window.showInputBox({
      title: "Groq API Key",
      prompt: "Paste your Groq API key",
      password: true,
      ignoreFocusOut: true
    });

    if (!key) {
      vscode.window.showErrorMessage("Groq API key not entered.");
      return false;
    }

    await context.secrets.store(GROQ_SECRET_KEY, key);
    await context.globalState.update(MODE_KEY, "groq_own");
    await context.globalState.update(ONBOARDED_KEY, true);

    vscode.window.showInformationMessage("Groq API key saved successfully.");
    return true;
  }

  // ---- GEMINI ----
  if (choice.label === "Use my own Gemini API key") {
    const existingGeminiKey = await context.secrets.get(GEMINI_SECRET_KEY);

    if (existingGeminiKey) {
      await context.globalState.update(MODE_KEY, "gemini_own");
      await context.globalState.update(ONBOARDED_KEY, true);
      vscode.window.showInformationMessage("Switched to Gemini successfully.");
      return true;
    }

    const action = await vscode.window.showInformationMessage(
      "You can create a Gemini API key from Google AI Studio.",
      "Open Gemini Key Page",
      "Continue"
    );

    if (action === "Open Gemini Key Page") {
      await vscode.env.openExternal(
        vscode.Uri.parse("https://aistudio.google.com/")
      );
    }

    const key = await vscode.window.showInputBox({
      title: "Gemini API Key",
      prompt: "Paste your Gemini API key",
      password: true,
      ignoreFocusOut: true
    });

    if (!key) {
      vscode.window.showErrorMessage("Gemini API key not entered.");
      return false;
    }

    await context.secrets.store(GEMINI_SECRET_KEY, key);
    await context.globalState.update(MODE_KEY, "gemini_own");
    await context.globalState.update(ONBOARDED_KEY, true);

    vscode.window.showInformationMessage("Gemini API key saved successfully.");
    return true;
  }

  // ---- FREE TRIAL ----
  const installationId = context.globalState.get<string>(INSTALLATION_ID_KEY);

  if (!installationId) {
    vscode.window.showErrorMessage("Installation ID not found.");
    return false;
  }

  try {
    await startTrial(installationId);

    await context.globalState.update(MODE_KEY, "free_trial");
    await context.globalState.update(ONBOARDED_KEY, true);

    vscode.window.showInformationMessage("Free trial activated.");
    return true;
 } catch (error: any) {
  const raw =
    JSON.stringify(error?.response?.data) ||
    error?.message ||
    String(error);

  vscode.window.showErrorMessage(`Free trial setup failed: ${raw}`);
  return false;
}
}