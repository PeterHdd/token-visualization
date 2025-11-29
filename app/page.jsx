"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { Tokenizer } from "@huggingface/tokenizers";

const models = [
  { id: "gpt2", label: "GPT-2 (OpenAI GPT BPE)" },
  { id: "EleutherAI/gpt-neo-125M", label: "GPT-Neo 125M" },
  { id: "hf-internal-testing/llama-tokenizer", label: "LLaMA tokenizer (open test)" },
  { id: "mistralai/Mistral-7B-v0.1", label: "Mistral 7B" },
  { id: "bert-base-uncased", label: "BERT base (WordPiece)" },
  { id: "roberta-base", label: "RoBERTa base" },
  { id: "gpt2-medium", label: "GPT-2 Medium" },
  { id: "t5-small", label: "T5 Small" },
  { id: "meta-llama/Meta-Llama-3-8B", label: "LLaMA 3 8B (gated, needs token)" },
];

const hashColor = (token) => {
  let hash = 0;
  for (let i = 0; i < token.length; i++) {
    hash = (hash << 5) - hash + token.charCodeAt(i);
    hash |= 0;
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue} 65% 62%)`;
};

const extractSpecialIds = (tokenizerConfig) => {
  const specials = [];
  const st = tokenizerConfig?.special_tokens || {};
  Object.values(st).forEach((val) => {
    if (val && typeof val.id === "number") specials.push(val.id);
    if (val && typeof val.id === "string") specials.push(Number(val.id));
  });
  return new Set(specials.filter((n) => Number.isFinite(n)));
};


export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [modelId, setModelId] = useState(models[0].id);
  const [hfToken, setHfToken] = useState("");
  const [status, setStatus] = useState({ text: "Idle", kind: "idle" });
  const [summary, setSummary] = useState({ vocab: "—", tokens: "—", specials: "—" });
  const [rows, setRows] = useState([]);

  const cacheRef = useRef(new Map());

  const tokensForCopy = useMemo(() => rows.map((r) => r.token).join(" "), [rows]);

  const setStatusKind = (text, kind = "idle") => setStatus({ text, kind });

  const loadTokenizer = useCallback(
    async (id) => {
      if (cacheRef.current.has(id)) return cacheRef.current.get(id);
      setStatusKind(`Loading ${id} tokenizer...`, "loading");

      const headers = hfToken ? { Authorization: `Bearer ${hfToken}` } : {};
      const base = `https://huggingface.co/${id}/resolve/main`;
      const tokenizerJson = await fetch(`${base}/tokenizer.json`, { headers }).then((r) => {
        if (!r.ok) throw new Error(`Failed to fetch tokenizer.json (${r.status})`);
        return r.json();
      });
      const tokenizerConfig = await fetch(`${base}/tokenizer_config.json`, { headers }).then((r) => {
        if (!r.ok) throw new Error(`Failed to fetch tokenizer_config.json (${r.status})`);
        return r.json();
      });

      const tokenizer = new Tokenizer(tokenizerJson, tokenizerConfig);
      const vocabSize = tokenizerJson.model?.vocab ? Object.keys(tokenizerJson.model.vocab).length : tokenizerJson.vocab?.length;
      const specialsSet = extractSpecialIds(tokenizerConfig);
      const cached = { tokenizer, vocabSize: vocabSize ?? "—", specialsSet };
      cacheRef.current.set(id, cached);
      return cached;
    },
    [hfToken]
  );

  const tokenize = useCallback(async () => {
    if (!prompt.trim()) {
      setStatusKind("Please add a prompt to tokenize.", "error");
      return;
    }

    try {
      setStatusKind("Tokenizing...", "loading");
      const { tokenizer, vocabSize, specialsSet } = await loadTokenizer(modelId);
      const encoding = tokenizer.encode(prompt);

      const tokens = encoding.tokens;
      const ids = encoding.ids;

      const newRows = tokens.map((tok, idx) => ({
        token: tok,
        id: ids[idx],
        offset: ["—", "—"],
        special: specialsSet?.has(ids[idx]) || false,
      }));
      const specialCount = specialsSet ? ids.filter((id) => specialsSet.has(id)).length : 0;

      setRows(newRows);
      setSummary({
        vocab: vocabSize ?? "—",
        tokens: tokens.length,
        specials: specialCount,
      });
      setStatusKind(`Tokenized with ${modelId}`, "idle");
    } catch (err) {
      console.error(err);
      setStatusKind(err.message || "Failed to tokenize", "error");
    }
  }, [loadTokenizer, modelId, prompt]);

  const clearAll = () => {
    setPrompt("");
    setRows([]);
    setSummary({ vocab: "—", tokens: "—", specials: "—" });
    setStatusKind("Idle");
  };

  const copyTokens = async () => {
    if (!tokensForCopy) return;
    try {
      await navigator.clipboard.writeText(tokensForCopy);
      setStatusKind("Tokens copied to clipboard.");
    } catch {
      setStatusKind("Clipboard unavailable.", "error");
    }
  };

  return (
    <>
      <div className="backdrop" />
      <header className="hero">
        <div className="hero__header">
        <div className="hero__eyebrow">Tokenizer playground</div>
        <div className="hero__meta">
          <a className="footer__link" href="https://github.com/peterhdd" target="_blank" rel="noreferrer">
            <svg className="footer__icon" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="currentColor"
                d="M12 .5C5.648.5.5 5.648.5 12a11.5 11.5 0 0 0 7.865 10.936c.575.107.785-.25.785-.557v-2.18c-3.2.697-3.873-1.542-3.873-1.542-.523-1.33-1.278-1.686-1.278-1.686-1.044-.713.08-.699.08-.699 1.155.081 1.763 1.186 1.763 1.186 1.027 1.76 2.695 1.252 3.354.957.104-.744.403-1.253.732-1.541-2.553-.29-5.237-1.277-5.237-5.68 0-1.255.45-2.282 1.184-3.087-.119-.289-.513-1.453.112-3.03 0 0 .967-.31 3.17 1.18a11.01 11.01 0 0 1 2.885-.388c.978.005 1.964.132 2.885.388 2.202-1.49 3.167-1.18 3.167-1.18.627 1.577.233 2.741.114 3.03.737.805 1.182 1.832 1.182 3.087 0 4.415-2.69 5.386-5.253 5.67.415.358.785 1.066.785 2.155v3.19c0 .31.207.671.79.556A11.5 11.5 0 0 0 23.5 12C23.5 5.648 18.352.5 12 .5Z"
              />
            </svg>
            <span>@peterhdd</span>
          </a>
        </div>
        </div>
        <h1>See how GPT, LLaMA, and other models chop your prompt into tokens.</h1>
        <p className="hero__lead">
          Pick a model, type a prompt, and visualize the token boundaries, IDs, and vocabulary size.
        </p>
      </header>

      <main className="grid">
        <section className="panel">
          <div className="panel__header">
            <div>
              <p className="label">Model</p>
              <h2>Choose a tokenizer</h2>
            </div>
            <span
              className={`pill ${
                status.kind === "loading" ? "pill--loading" : status.kind === "error" ? "pill--error" : ""
              }`}
            >
              {status.text}
            </span>
          </div>

          <div className="controls">
            <label className="field">
              <span>Hugging Face model</span>
              <select value={modelId} onChange={(e) => setModelId(e.target.value)}>
                {models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Optional HF access token (for gated models)</span>
              <input
                value={hfToken}
                onChange={(e) => setHfToken(e.target.value)}
                type="password"
                placeholder="hf_xxx (kept in memory)"
              />
            </label>

            <label className="field">
              <span>Prompt</span>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={5}
                spellCheck={false}
                placeholder="Type something interesting to see how it gets split..."
              />
            </label>

            <div className="actions">
              <button className="btn btn--primary" onClick={tokenize}>
                Visualize tokenization
              </button>
              <button className="btn btn--ghost" onClick={clearAll}>
                Clear
              </button>
            </div>
          </div>

          <div className="summary">
            <div className="summary__item">
              <p className="label">Vocabulary size</p>
              <p className="summary__value">{summary.vocab}</p>
            </div>
            <div className="summary__item">
              <p className="label">Tokens produced</p>
              <p className="summary__value">{summary.tokens}</p>
            </div>
            <div className="summary__item">
              <p className="label">Special tokens</p>
              <p className="summary__value">{summary.specials}</p>
            </div>
          </div>
        </section>

        <section className="panel panel--tall">
          <div className="panel__header">
            <div>
              <p className="label">Visualization</p>
              <h2>Token stream</h2>
            </div>
            <button className="btn btn--tiny" onClick={copyTokens}>
              Copy tokens
            </button>
          </div>

          <div className="visualization">
            {rows.length === 0 ? (
              <p className="placeholder">Run a prompt to see color-coded tokens appear here.</p>
            ) : (
              rows.map((row, idx) => (
                <div key={idx} className="segment">
                  <span
                    className={`segment__token ${row.special ? "segment__token--special" : ""}`}
                    style={{ background: hashColor(row.token) }}
                  >
                    {row.token}
                  </span>
                </div>
              ))
            )}
          </div>

          <div className="token-list">
            <div className="token-list__header">
              <span>#</span>
              <span>Token</span>
              <span>ID</span>
              <span>Type</span>
            </div>
            <div className="token-list__body">
              {rows.map((row, idx) => (
                <div key={idx} className="token-list__row">
                  <span className="token-list__chip" style={{ background: hashColor(row.token) }}>
                    {idx}
                  </span>
                  <span className="token-list__token">
                    <code>{row.token}</code>
                  </span>
                  <span>{row.id}</span>
                  <span className={row.special ? "muted" : ""}>{row.special ? "special" : "text"}</span>
                </div>
              ))}
              {rows.length === 0 && <div className="token-list__row muted">No tokens yet.</div>}
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div>
          Powered by <code>@huggingface/tokenizers</code>, models load from the Hugging Face Hub, no data is sent to a custom server.
        </div>
      </footer>
    </>
  );
}
