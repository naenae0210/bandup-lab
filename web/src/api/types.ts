export interface Usage {
  month: string | null;
  request_count: number;
  input_tokens: number;
  output_tokens: number;
}

export type ConnectionStatus = "untested" | "connected" | "failed";

export interface SettingsOut {
  ai_provider: string | null;
  ai_model: string | null;
  api_key_masked: string | null;
  connection_status: ConnectionStatus;
  connection_checked_at: string | null;
  stt_model_size: string;
  exam_date: string | null;
  daily_study_hours: number | null;
  usage: Usage;
}

export interface SaveApiKeyOut {
  success: boolean;
  message: string;
  models: string[];
  settings: SettingsOut;
}

export interface TestConnectionOut {
  success: boolean;
  message: string;
  settings: SettingsOut;
}

export interface ModelsOut {
  models: string[];
}
