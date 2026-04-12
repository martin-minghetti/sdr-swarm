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
          <label className="block text-sm font-medium text-zinc-700 mb-1.5">
            {cfg.label}
            {cfg.required && <span className="text-red-500 ml-1">*</span>}
          </label>

          {maskedKeys[cfg.name] && (
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-mono text-zinc-500 bg-zinc-100 rounded px-2 py-1">
                {maskedKeys[cfg.name]}
              </span>
              {validation[cfg.name] !== undefined && (
                <span
                  className={`text-xs font-medium ${
                    validation[cfg.name] ? "text-emerald-600" : "text-red-600"
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
            className="w-full rounded-lg border border-zinc-300 px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-colors"
          />
        </div>
      ))}

      {message && (
        <div
          className={`rounded-lg px-4 py-3 text-sm ${
            message.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
              : "bg-red-50 border border-red-200 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? "Saving..." : "Save Keys"}
        </button>
        <button
          onClick={handleValidate}
          disabled={validating}
          className="rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 shadow-sm hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {validating ? "Validating..." : "Validate Keys"}
        </button>
      </div>
    </div>
  );
}
