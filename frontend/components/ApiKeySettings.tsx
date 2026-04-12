"use client";

import { useEffect, useState } from "react";
import { getSettings, saveSettings, validateSettings } from "@/lib/api";

const KEY_CONFIGS = [
  { name: "anthropic", label: "Anthropic API Key", required: true, placeholder: "sk-ant-..." },
  { name: "tavily", label: "Tavily API Key", required: true, placeholder: "tvly-..." },
  { name: "apollo", label: "Apollo API Key", required: false, placeholder: "apollo-..." },
];

export default function ApiKeySettings() {
  const [maskedKeys, setMaskedKeys] = useState<Record<string, string>>({});
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [validation, setValidation] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [validating, setValidating] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    getSettings()
      .then((res) => setMaskedKeys(res.keys))
      .catch(() => {});
  }, []);

  const handleSave = async () => {
    const keysToSave = Object.fromEntries(
      Object.entries(inputs).filter(([, v]) => v.trim())
    );
    if (Object.keys(keysToSave).length === 0) {
      setMessage({ type: "error", text: "Enter at least one key to save." });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      await saveSettings(keysToSave);
      const res = await getSettings();
      setMaskedKeys(res.keys);
      setInputs({});
      setMessage({ type: "success", text: "Keys saved successfully." });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to save." });
    } finally {
      setSaving(false);
    }
  };

  const handleValidate = async () => {
    setValidating(true);
    setMessage(null);
    try {
      const res = await validateSettings();
      setValidation(res.valid);
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Validation failed." });
    } finally {
      setValidating(false);
    }
  };

  return (
    <div className="space-y-6">
      {KEY_CONFIGS.map((cfg) => (
        <div key={cfg.name}>
          <label className="block text-sm font-medium text-text-primary mb-1.5">
            {cfg.label}
            {cfg.required && <span className="text-[var(--color-status-failed)] ml-1">*</span>}
          </label>

          {maskedKeys[cfg.name] && (
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-mono text-text-muted bg-surface-2 rounded-lg px-2 py-1">
                {maskedKeys[cfg.name]}
              </span>
              {validation[cfg.name] !== undefined && (
                <span
                  className={`text-xs font-medium ${
                    validation[cfg.name] ? "text-[var(--color-status-completed)]" : "text-[var(--color-status-failed)]"
                  }`}
                >
                  {validation[cfg.name] ? "Valid" : "Invalid"}
                </span>
              )}
            </div>
          )}

          <input
            type="password"
            placeholder={maskedKeys[cfg.name] ? "Enter new key to replace..." : cfg.placeholder}
            value={inputs[cfg.name] || ""}
            onChange={(e) => setInputs({ ...inputs, [cfg.name]: e.target.value })}
            className="w-full rounded-xl px-3.5 py-2.5 bg-surface-0 shadow-[var(--shadow-neu-inset)] text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all"
          />
        </div>
      ))}

      {message && (
        <div
          className={`rounded-xl px-4 py-3 text-sm shadow-[var(--shadow-neu-inset)] ${
            message.type === "success"
              ? "text-[var(--color-status-completed)]"
              : "text-[var(--color-status-failed)]"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-neu-primary rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-neu-sm)] hover:shadow-[var(--shadow-neu-raised)] hover:bg-accent-dim disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Saving..." : "Save Keys"}
        </button>
        <button
          onClick={handleValidate}
          disabled={validating}
          className="btn-neu rounded-xl bg-surface-0 px-4 py-2.5 text-sm font-semibold text-text-secondary shadow-[var(--shadow-neu-sm)] hover:shadow-[var(--shadow-neu-raised)] hover:text-text-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {validating ? "Validating..." : "Validate Keys"}
        </button>
      </div>
    </div>
  );
}
