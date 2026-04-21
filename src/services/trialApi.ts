import axios from "axios";

const API_BASE = "https://ai-code-reviewer-api-mu.vercel.app/api";

export async function startTrial(installationId: string): Promise<void> {
  await axios.post(`${API_BASE}/start-trial`, { installationId });
}

export async function callTrialReviewApi(
  installationId: string,
  systemPrompt: string,
  userPrompt: string,
  maxTokens = 2048
): Promise<string> {
  const response = await axios.post(`${API_BASE}/review`, {
    installationId,
    systemPrompt,
    userPrompt,
    maxTokens
  });

  return response.data.result;
}

export async function getTrialStatus(
  installationId: string
): Promise<number> {
  const response = await axios.post(`${API_BASE}/trial-status`, {
    installationId
  });

  return response.data.remainingUses;
}