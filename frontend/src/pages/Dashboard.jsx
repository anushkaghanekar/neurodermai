import { useEffect, useState } from "react";
import { fetchModelMetadata, predictSkinCondition } from "../lib/api";

const DISEASE_INFO = {
  acne: {
    image: "/images/acne.png",
    description: "Acne occurs when hair follicles plug with oil and dead skin cells. It causes whiteheads, blackheads or pimples, typically appearing on the face, forehead, chest, upper back and shoulders."
  },
  eczema: {
    image: "/images/eczema.png",
    description: "Atopic dermatitis (eczema) is a condition that makes your skin red and itchy. It's common in children but can occur at any age. It is chronic and tends to flare periodically."
  },
  psoriasis: {
    image: "/images/psoriasis.png",
    description: "Psoriasis is a skin disease that causes a rash with itchy, scaly patches, most commonly on the knees, elbows, trunk and scalp. It is a common, long-term (chronic) disease with no cure."
  },
  fungal: {
    image: "/images/fungal.png",
    description: "A fungal infection, also called mycosis, is a skin disease caused by a fungus. Common types include ringworm, athlete's foot, and yeast infections. They often present as red, scaly, itchy rashes."
  },
  warts: {
    image: "/images/warts.png",
    description: "Warts are small, rough patches of skin that can look like blisters or small cauliflowers. They're caused by a viral infection of the skin by the human papillomavirus (HPV)."
  },
  normal: {
    image: "/images/healthy.png",
    description: "Healthy, normal skin appears smooth, with consistent color, and is free from blemishes, unusual scaling, or persistent rashes. It maintains a strong barrier function."
  }
};

function formatPercent(value) {
  return `${(value * 100).toFixed(1)}%`;
}

export default function Dashboard() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  const [metadata, setMetadata] = useState({
    ready: false,
    class_names: [],
    disclaimer: "",
    error: ""
  });
  const [metadataError, setMetadataError] = useState("");

  useEffect(() => {
    let active = true;
    async function loadMetadata() {
      try {
        const payload = await fetchModelMetadata();
        if (active) {
          setMetadata(payload);
          setMetadataError("");
        }
      } catch (err) {
        if (active) setMetadataError(err.message || "Failed to reach backend.");
      }
    }
    loadMetadata();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl("");
      return;
    }
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [selectedFile]);

  function onFileSelect(e) {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setResult(null);
      setError("");
    }
  }

  function handleDragOver(e) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e) {
    e.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(e) {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
      setResult(null);
      setError("");
    }
  }

  async function handleAnalyze() {
    if (!selectedFile) return;
    setIsLoading(true);
    setError("");
    try {
      const payload = await predictSkinCondition(selectedFile);
      setResult(payload);
    } catch (err) {
      setError(err.message || "Prediction failed.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleReset() {
    setSelectedFile(null);
    setResult(null);
    setError("");
  }

  return (
    <div className="app-shell">
      <header className="brand-header">
        <h1 className="brand-title">NeuroDermAI</h1>
        <p className="brand-subtitle">
          Next-generation skin condition triage. Upload your image for an instant analysis.
        </p>
      </header>

      {metadataError && (
        <div className="banner banner-error">
          <strong>Backend Error: </strong> {metadataError}
        </div>
      )}
      
      {!metadataError && !metadata.ready && (
        <div className="banner banner-warning">
          <strong>Model Not Ready: </strong> 
          Model artifacts (`model.h5`, `labels.json`) must be present in the backend.
        </div>
      )}

      <main className="main-grid">
        {/* Left Column: Editor/Upload */}
        <section className="glass-panel">
          <h2 className="panel-title">1. Image Input</h2>
          <p className="panel-description">Upload a clear, well-lit photo of the skin area.</p>

          <label 
            className={`upload-zone ${isDragging ? "drag-active" : ""}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input 
              type="file" 
              className="upload-input" 
              accept="image/*" 
              onChange={onFileSelect}
            />
            {previewUrl ? (
              <div className="image-preview-container">
                <img src={previewUrl} alt="Preview" className="image-preview" />
              </div>
            ) : (
              <div className="upload-content">
                <div className="upload-icon">⊕</div>
                <div className="upload-text">Click or drag & drop to upload</div>
                <div className="upload-hint">PNG, JPG or WebP. Optimal size under 5MB.</div>
              </div>
            )}
          </label>

          <div className="upload-actions">
            <button 
              className="btn btn-secondary" 
              onClick={handleReset}
              disabled={!selectedFile || isLoading}
            >
              Clear Image
            </button>
            <button 
              className="btn btn-primary" 
              onClick={handleAnalyze}
              disabled={!selectedFile || isLoading || !metadata.ready}
            >
              {isLoading ? "Analyzing..." : "Analyze Skin"}
            </button>
          </div>
        </section>

        {/* Right Column: Results */}
        <section className="glass-panel">
          <h2 className="panel-title">2. Analysis Summary</h2>
          <p className="panel-description">Detailed breakdown of the AI prediction.</p>
          
          {error && <div className="banner banner-error">{error}</div>}

          {result ? (
            <div className="result-content fade-in">
              <div className="result-hero">
                <div>
                  <span className="prediction-label">Primary Match</span>
                  <h3 className="prediction-value">{result.prediction}</h3>
                </div>
                <div className="confidence-badge">
                  {formatPercent(result.confidence)}
                </div>
              </div>

              <div className="result-section">
                <h4 className="section-title">Top 3 Candidates</h4>
                <div className="top-predictions">
                  {result.top_3.map((item, i) => (
                    <div className="top-prediction-item" key={i}>
                      <span className="top-label">{item.label}</span>
                      <div className="top-bar-container">
                        <div 
                          className="top-bar-fill" 
                          style={{ width: `${Math.max(item.probability * 100, 2)}%` }} 
                        />
                      </div>
                      <span className="top-value">{formatPercent(item.probability)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="result-section" style={{marginBottom: 0}}>
                <h4 className="section-title">General Precautions</h4>
                <ul className="precautions-list">
                  {result.precautions.map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">♢</div>
              <p>Upload an image and run the analysis to view results.</p>
            </div>
          )}
        </section>
      </main>

      {/* Disease Information Gallery */}
      <section className="gallery-section">
        <header className="gallery-header">
          <h2 className="gallery-title">Condition Reference Guide</h2>
          <p className="brand-subtitle">Clinical illustrations of the conditions categorized by our AI triage engine.</p>
        </header>

        <div className="gallery-grid">
          {Object.entries(DISEASE_INFO).map(([key, info]) => (
            <article className="disease-card" key={key}>
              <div className="disease-image-container">
                <img src={info.image} alt={key} className="disease-image" loading="lazy" />
              </div>
              <div className="disease-info">
                <h3 className="disease-name">{key}</h3>
                <p className="disease-desc">{info.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
