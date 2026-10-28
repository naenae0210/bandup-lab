import { useEffect, useState } from "react";
import { settingsApi } from "../api/settings";
import type { ConnectionStatus, SettingsOut } from "../api/types";

type Banner = { kind: "success" | "error"; message: string } | null;

const PROVIDERS: { id: string; label: string }[] = [
  { id: "anthropic", label: "Claude" },
  { id: "openai", label: "OpenAI" },
];

const STATUS_BADGE: Record<ConnectionStatus, { bg: string; text: string; dot: string; label: string }> = {
  connected: { bg: "bg-[#E4F3EB]", text: "text-[#1F6B45]", dot: "bg-[#1F7A4D]", label: "연결됨" },
  failed: { bg: "bg-[#FDECEA]", text: "text-[#B42318]", dot: "bg-[#B42318]", label: "연결 실패" },
  untested: { bg: "bg-[#F4F5F7]", text: "text-[#4A505C]", dot: "bg-[#9AA1AC]", label: "연결 안 됨" },
};

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<SettingsOut | null>(null);
  const [models, setModels] = useState<string[]>([]);
  const [banner, setBanner] = useState<Banner>(null);

  const [editingKey, setEditingKey] = useState(false);
  const [providerDraft, setProviderDraft] = useState("anthropic");
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [savingKey, setSavingKey] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    void refresh();
  }, []);

  async function refresh() {
    setLoading(true);
    try {
      const data = await settingsApi.get();
      setSettings(data);
      setProviderDraft(data.ai_provider ?? "anthropic");
      setEditingKey(!data.api_key_masked);
      if (data.api_key_masked) {
        const modelsRes = await settingsApi.listModels().catch(() => null);
        setModels(modelsRes?.models ?? (data.ai_model ? [data.ai_model] : []));
      } else {
        setModels([]);
      }
    } catch (err) {
      setBanner({ kind: "error", message: (err as Error).message });
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveKey() {
    if (!apiKeyInput.trim()) return;
    setSavingKey(true);
    setBanner(null);
    try {
      const result = await settingsApi.saveApiKey(providerDraft, apiKeyInput.trim());
      setSettings(result.settings);
      setModels(result.models);
      setEditingKey(!result.success);
      setApiKeyInput("");
      setBanner({ kind: result.success ? "success" : "error", message: result.message });
    } catch (err) {
      setBanner({ kind: "error", message: (err as Error).message });
    } finally {
      setSavingKey(false);
    }
  }

  async function handleDeleteKey() {
    if (!window.confirm("저장된 API 키를 삭제할까요?")) return;
    try {
      const result = await settingsApi.deleteApiKey();
      setSettings(result);
      setModels([]);
      setEditingKey(true);
      setApiKeyInput("");
      setBanner(null);
    } catch (err) {
      setBanner({ kind: "error", message: (err as Error).message });
    }
  }

  async function handleTestConnection() {
    setTesting(true);
    setBanner(null);
    try {
      const result = await settingsApi.testConnection();
      setSettings(result.settings);
      setBanner({ kind: result.success ? "success" : "error", message: result.message });
    } catch (err) {
      setBanner({ kind: "error", message: (err as Error).message });
    } finally {
      setTesting(false);
    }
  }

  async function handleModelChange(model: string) {
    const updated = await settingsApi.updateModel(model);
    setSettings(updated);
  }

  async function handleStudyChange(examDate: string | null, dailyStudyHours: number | null) {
    const updated = await settingsApi.updateStudy(examDate, dailyStudyHours);
    setSettings(updated);
  }

  async function handleSttSizeChange(size: string) {
    const updated = await settingsApi.updateSttModelSize(size);
    setSettings(updated);
  }

  if (loading || !settings) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F4F5F7] font-sans text-[#15171C]">
        <p className="text-[#4A505C]">불러오는 중…</p>
      </main>
    );
  }

  const badge = STATUS_BADGE[settings.connection_status];

  return (
    <main className="min-h-screen bg-[#F4F5F7] font-sans text-[#15171C]">
      <div className="mx-auto flex max-w-[720px] flex-col gap-6 px-6 py-10">
        <h1 className="text-[28px] font-bold tracking-tight">설정</h1>

        {banner && (
          <div
            role="status"
            className={
              "rounded-xl border px-4 py-3 text-sm font-medium " +
              (banner.kind === "success"
                ? "border-[#B7E4C7] bg-[#E4F3EB] text-[#1F6B45]"
                : "border-[#F1C4BE] bg-[#FDECEA] text-[#B42318]")
            }
          >
            {banner.message}
          </div>
        )}

        <section className="flex flex-col gap-6 rounded-2xl border border-[#E2E5EA] bg-white p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold">AI 연결</h2>
              <p className="mt-1.5 text-sm text-[#4A505C]">
                API 키를 넣으면 분석·첨삭·이어서 질문을 앱 안에서 바로 한다.
              </p>
            </div>
            <span
              className={`flex min-h-8 items-center gap-2 rounded-full px-3 text-sm font-semibold ${badge.bg} ${badge.text}`}
            >
              <span className={`h-2 w-2 rounded-full ${badge.dot}`} aria-hidden="true" />
              {badge.label}
            </span>
          </div>

          {editingKey ? (
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <div id="prov-label" className="text-sm font-semibold">
                  공급자
                </div>
                <div
                  role="group"
                  aria-labelledby="prov-label"
                  className="grid grid-cols-2 gap-1 rounded-[10px] bg-[#F4F5F7] p-1"
                >
                  {PROVIDERS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      aria-pressed={providerDraft === p.id}
                      onClick={() => setProviderDraft(p.id)}
                      className={
                        "min-h-11 rounded-lg text-sm font-semibold " +
                        (providerDraft === p.id
                          ? "bg-white text-[#15171C] shadow-sm"
                          : "bg-transparent text-[#4A505C]")
                      }
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="key" className="text-sm font-semibold">
                  API 키
                </label>
                <div className="flex flex-wrap gap-2">
                  <input
                    id="key"
                    type="password"
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    placeholder="공급자 콘솔에서 발급한 키를 붙여넣는다"
                    className="min-h-11 flex-1 min-w-[260px] rounded-[10px] border border-[#D5D9E0] bg-white px-3.5 text-[15px] text-[#15171C]"
                  />
                  <button
                    type="button"
                    onClick={handleSaveKey}
                    disabled={savingKey || !apiKeyInput.trim()}
                    className="min-h-11 rounded-[10px] bg-[#2F4FD8] px-5 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    {savingKey ? "확인 중…" : "저장"}
                  </button>
                  {settings.api_key_masked && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingKey(false);
                        setApiKeyInput("");
                      }}
                      className="min-h-11 rounded-[10px] border border-[#D5D9E0] bg-white px-5 text-sm font-semibold text-[#15171C]"
                    >
                      취소
                    </button>
                  )}
                </div>
                <p className="flex gap-2 text-[13px] leading-relaxed text-[#4A505C]">
                  키는 이 컴퓨터의 Docker DB에 암호화해서 저장하고, 선택한 공급자 외의 곳으로는 보내지 않는다.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label htmlFor="key" className="text-sm font-semibold">
                  API 키 · {PROVIDERS.find((p) => p.id === settings.ai_provider)?.label ?? settings.ai_provider}
                </label>
                <div className="flex flex-wrap gap-2">
                  <input
                    id="key"
                    type="password"
                    value={settings.api_key_masked ?? ""}
                    readOnly
                    className="min-h-11 flex-1 min-w-[260px] rounded-[10px] border border-[#D5D9E0] bg-[#FAFBFC] px-3.5 text-[15px] text-[#15171C]"
                  />
                  <button
                    type="button"
                    onClick={() => setEditingKey(true)}
                    className="min-h-11 rounded-[10px] border border-[#D5D9E0] bg-white px-5 text-sm font-semibold text-[#15171C]"
                  >
                    변경
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteKey}
                    className="min-h-11 rounded-[10px] border border-[#F1C4BE] bg-white px-5 text-sm font-semibold text-[#B42318]"
                  >
                    삭제
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="model" className="text-sm font-semibold">
                  모델
                </label>
                <select
                  id="model"
                  value={settings.ai_model ?? ""}
                  onChange={(e) => void handleModelChange(e.target.value)}
                  className="h-12 rounded-[10px] border border-[#D5D9E0] bg-white px-3 text-sm text-[#15171C]"
                >
                  {models.length === 0 && settings.ai_model && (
                    <option value={settings.ai_model}>{settings.ai_model}</option>
                  )}
                  {models.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
                <span className="text-xs text-[#5F6673]">목록은 키로 공급자에서 불러온다</span>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testing || !settings.api_key_masked}
              className="min-h-11 rounded-[10px] bg-[#2F4FD8] px-5 text-[15px] font-semibold text-white disabled:opacity-50"
            >
              {testing ? "확인 중…" : "연결 테스트"}
            </button>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <section className="flex flex-col gap-3 rounded-2xl border border-[#E2E5EA] bg-white p-6">
            <h2 className="text-base font-bold">이번 달 사용량</h2>
            <div className="grid grid-cols-3 gap-2.5">
              <div className="rounded-[10px] bg-[#F4F5F7] p-3">
                <div className="text-xs text-[#5F6673]">요청</div>
                <div className="text-xl font-bold">{settings.usage.request_count}회</div>
              </div>
              <div className="rounded-[10px] bg-[#F4F5F7] p-3">
                <div className="text-xs text-[#5F6673]">입력 토큰</div>
                <div className="text-xl font-bold">{settings.usage.input_tokens}</div>
              </div>
              <div className="rounded-[10px] bg-[#F4F5F7] p-3">
                <div className="text-xs text-[#5F6673]">출력 토큰</div>
                <div className="text-xl font-bold">{settings.usage.output_tokens}</div>
              </div>
            </div>
            <p className="text-[13px] leading-relaxed text-[#5F6673]">정확한 요금은 공급자 콘솔에서 확인한다.</p>
          </section>

          <section className="flex flex-col gap-3 rounded-2xl border border-[#E2E5EA] bg-white p-6">
            <h2 className="text-base font-bold">받아쓰기 (whisper)</h2>
            <label htmlFor="stt" className="text-sm font-semibold">
              모델 크기
            </label>
            <select
              id="stt"
              value={settings.stt_model_size}
              onChange={(e) => void handleSttSizeChange(e.target.value)}
              className="h-12 rounded-[10px] border border-[#D5D9E0] bg-white px-3 text-sm text-[#15171C]"
            >
              <option value="small">small · 빠름</option>
              <option value="medium">medium · 보통</option>
              <option value="large">large · 정확함</option>
            </select>
            <p className="text-[13px] leading-relaxed text-[#5F6673]">
              클수록 정확하지만 느려진다. 공급자와 상관없이 내 컴퓨터에서 돈다.
            </p>
          </section>

          <section className="flex flex-col gap-3 rounded-2xl border border-[#E2E5EA] bg-white p-6">
            <h2 className="text-base font-bold">학습</h2>
            <label htmlFor="exam" className="text-sm font-semibold">
              시험일
            </label>
            <input
              id="exam"
              type="date"
              defaultValue={settings.exam_date ?? ""}
              onBlur={(e) => void handleStudyChange(e.target.value || null, settings.daily_study_hours)}
              className="h-12 rounded-[10px] border border-[#D5D9E0] px-3 text-sm text-[#15171C]"
            />
            <label htmlFor="hours" className="text-sm font-semibold">
              하루 공부 시간
            </label>
            <select
              id="hours"
              value={settings.daily_study_hours ?? ""}
              onChange={(e) =>
                void handleStudyChange(settings.exam_date, e.target.value ? Number(e.target.value) : null)
              }
              className="h-12 rounded-[10px] border border-[#D5D9E0] bg-white px-3 text-sm text-[#15171C]"
            >
              <option value="">선택 안 함</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((h) => (
                <option key={h} value={h}>
                  {h}시간
                </option>
              ))}
            </select>
          </section>

          <section className="flex flex-col gap-3 rounded-2xl border border-[#E2E5EA] bg-white p-6">
            <h2 className="text-base font-bold">데이터</h2>
            <p className="text-sm leading-relaxed text-[#4A505C]">
              기록·녹음·가져온 문제는 이 컴퓨터의 Docker 볼륨에만 저장된다.
            </p>
            <div className="flex flex-wrap gap-2.5">
              <button
                type="button"
                disabled
                className="min-h-11 flex-1 rounded-[10px] border border-[#D5D9E0] bg-white px-3 text-sm font-semibold text-[#9AA1AC]"
              >
                백업 내보내기 (다음 단계)
              </button>
              <button
                type="button"
                disabled
                className="min-h-11 flex-1 rounded-[10px] border border-[#D5D9E0] bg-white px-3 text-sm font-semibold text-[#9AA1AC]"
              >
                백업에서 복원 (다음 단계)
              </button>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
