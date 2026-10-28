import type { ModelsOut, SaveApiKeyOut, SettingsOut, TestConnectionOut } from "./types";

const BASE = "/api/settings";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.detail ?? `요청 실패 (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export const settingsApi = {
  get: () => request<SettingsOut>(""),
  saveApiKey: (provider: string, apiKey: string) =>
    request<SaveApiKeyOut>("/ai/key", {
      method: "PUT",
      body: JSON.stringify({ provider, api_key: apiKey }),
    }),
  deleteApiKey: () => request<SettingsOut>("/ai/key", { method: "DELETE" }),
  testConnection: () => request<TestConnectionOut>("/ai/test", { method: "POST" }),
  listModels: () => request<ModelsOut>("/ai/models"),
  updateModel: (model: string) =>
    request<SettingsOut>("/ai/model", {
      method: "PATCH",
      body: JSON.stringify({ model }),
    }),
  updateStudy: (examDate: string | null, dailyStudyHours: number | null) =>
    request<SettingsOut>("/study", {
      method: "PATCH",
      body: JSON.stringify({ exam_date: examDate, daily_study_hours: dailyStudyHours }),
    }),
  updateSttModelSize: (size: string) =>
    request<SettingsOut>("/stt-model-size", {
      method: "PATCH",
      body: JSON.stringify({ stt_model_size: size }),
    }),
};
