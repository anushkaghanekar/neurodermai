import { useEffect, useState } from "react";

import {
  API_BASE_URL,
  fetchModelMetadata,
  predictSkinCondition,
} from "../lib/api";
import Landing from "./Landing";

const SUPPORTED_CONDITIONS = [
  "acne",
  "eczema",
  "psoriasis",
  "fungal",
  "warts",
  "normal",
];

function formatPercent(value) {
  return `${(value * 100).toFixed(1)}%`;
}

function Dashboard() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [inputKey, setInputKey] = useState(0);
  const [metadata, setMetadata] = useState({
    ready: false,
    class_names: [],
    disclaimer: "",
    error: "",
  });
  const [metadataError, setMetadataError] = useState("");

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl("");
      return undefined;
    }

    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [selectedFile]);

  useEffect(() => {
    let active = true;

    async function loadMetadata() {
      try {
        const payload = await fetchModelMetadata();
        if (!active) {
          return;
        }

        setMetadata(payload);
        setMetadataError("");
      } catch (requestError) {
        if (!active) {
          return;
        }

        setMetadataError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to reach the backend metadata endpoint.",
        );
      }
    }

    loadMetadata();

    return () => {
      active = false;
    };
  }, []);

  function handleFileChange(event) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setSelectedFile(file);
    setResult(null);
    setError("");
  }

  function handleReset() {
    setSelectedFile(null);
    setResult(null);
    setError("");
    setInputKey((current) => current + 1);
  }

  async function handleAnalyze(event) {
    event.preventDefault();

    if (!selectedFile) {
      setError("Choose a skin image before running the prediction.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const payload = await predictSkinCondition(selectedFile);
      setResult(payload);
    } catch (requestError) {
      setResult(null);
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Prediction failed. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  const probabilityEntries = result
    ? Object.entries(result.probabilities).sort(([, left], [, right]) => right - left)
    : [];
  const supportedConditions =
    metadata.class_names.length > 0 ? metadata.class_names : SUPPORTED_CONDITIONS;

  return (
    <main className="app-shell">
      <div className="page-glow page-glow-one" />
      <div className="page-glow page-glow-two" />

      <Landing
        apiBaseUrl={API_BASE_URL}
        supportedConditions={supportedConditions}
      />

      {metadataError ? (
        <p className="status-banner error-banner">
          Backend metadata could not be loaded: {metadataError}
        </p>
      ) : null}

      {!metadataError && !metadata.ready ? (
        <p className="status-banner info-banner">
          Backend is reachable, but a real Kaggle-exported `model.h5` and `labels.json`
          still need to be placed in the repository before predictions can run.
          {metadata.error ? ` ${metadata.error}` : ""}
        </p>
      ) : null}

      <section className="workspace-grid">
        <article className="panel upload-panel">
          <div className="panel-header">
            <div>
              <p className="panel-kicker">Step 1</p>
              <h2>Upload an image</h2>
            </div>
            <p className="panel-copy">
              Use a close, well-lit photo with the skin area clearly visible.
            </p>
          </div>

          <form className="upload-form" onSubmit={handleAnalyze}>
            <label
              className={`upload-zone ${previewUrl ? "has-file" : ""}`}
              htmlFor="skin-image-input"
            >
              <input
                accept="image/*"
                id="skin-image-input"
                key={inputKey}
                onChange={handleFileChange}
                type="file"
              />

              {previewUrl ? (
                <div className="preview-frame">
                  <img
                    alt="Selected skin preview"
                    className="preview-image"
                    src={previewUrl}
                  />
                </div>
              ) : (
                <div className="upload-placeholder">
                  <p className="upload-title">Drop an image here or click to browse</p>
                  <p className="upload-copy">
                    JPG, PNG, BMP, or WebP images work best. Avoid screenshots of
                    blurry or very dark photos.
                  </p>
                </div>
              )}
            </label>

            <div className="file-meta">
              <div>
                <span className="file-label">Selected file</span>
                <strong>{selectedFile ? selectedFile.name : "No file chosen yet"}</strong>
              </div>
              {selectedFile ? <span>{Math.round(selectedFile.size / 1024)} KB</span> : null}
            </div>

            <div className="upload-actions">
              <button
                className="primary-button"
                disabled={isLoading || !metadata.ready}
                type="submit"
              >
                {isLoading
                  ? "Analyzing image..."
                  : metadata.ready
                    ? "Analyze skin image"
                    : "Model artifacts required"}
              </button>
              <button
                className="secondary-button"
                disabled={isLoading || !selectedFile}
                onClick={handleReset}
                type="button"
              >
                Reset
              </button>
            </div>
          </form>

          {error ? <p className="status-banner error-banner">{error}</p> : null}
          {isLoading ? (
            <p className="status-banner info-banner">
              The React client is waiting for the FastAPI service to return the model prediction.
            </p>
          ) : null}
        </article>

        <article className="panel result-panel">
          <div className="panel-header">
            <div>
              <p className="panel-kicker">Step 2</p>
              <h2>Prediction summary</h2>
            </div>
            <p className="panel-copy">
              The model returns the top class, confidence score, and a ranked shortlist.
            </p>
          </div>

          {result ? (
            <div className="result-stack">
              <div className="result-hero">
                <div>
                  <span className="result-badge">Predicted class</span>
                  <h3>{result.prediction}</h3>
                </div>
                <div className="confidence-chip">{formatPercent(result.confidence)}</div>
              </div>

              <p className="result-copy">{result.explanation}</p>

              <section>
                <h4>Top-3 predictions</h4>
                <div className="top-list">
                  {result.top_3.map((item, index) => (
                    <article className="top-item" key={`${item.label}-${index}`}>
                      <div className="top-item-header">
                        <span>{item.label}</span>
                        <strong>{formatPercent(item.probability)}</strong>
                      </div>
                      <div className="probability-track">
                        <span
                          className="probability-fill"
                          style={{ width: `${Math.max(item.probability * 100, 4)}%` }}
                        />
                      </div>
                    </article>
                  ))}
                </div>
              </section>

              <section>
                <h4>All class probabilities</h4>
                <div className="probability-grid">
                  {probabilityEntries.map(([label, probability]) => (
                    <div className="probability-row" key={label}>
                      <span>{label}</span>
                      <strong>{formatPercent(probability)}</strong>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h4>Precautions</h4>
                <ul className="precautions-list">
                  {result.precautions.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>

              <p className="disclaimer-banner">{result.disclaimer}</p>
            </div>
          ) : (
            <div className="empty-state">
              <p className="empty-title">No prediction yet</p>
              <p className="empty-copy">
                Upload a file and run the analysis to see the predicted class,
                confidence, probabilities, and basic precautions.
              </p>
            </div>
          )}
        </article>
      </section>

      <section className="condition-grid">
        {supportedConditions.map((condition) => (
          <article className="condition-card" key={condition}>
            <span className="condition-name">{condition}</span>
            <p>
              The training notebook attempts to map attached Kaggle folders into this
              canonical class. The deployed model only predicts classes present in
              the exported `labels.json`.
            </p>
          </article>
        ))}
      </section>
    </main>
  );
}

export default Dashboard;
