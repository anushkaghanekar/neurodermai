import { useEffect, useState } from "react";
import { fetchModelMetadata, predictSkinCondition } from "../lib/api";

/* ---------- Display-label mapping (HF model label → UI) ---------- */
const DISPLAY_LABELS = {
  "Basal Cell Carcinoma": "Basal Cell Carcinoma",
  "Darier_s Disease": "Darier's Disease",
  "Epidermolysis Bullosa Pruriginosa": "Epidermolysis Bullosa",
  "Hailey-Hailey Disease": "Hailey-Hailey Disease",
  "Herpes Simplex": "Herpes Simplex",
  "Impetigo": "Impetigo",
  "Larva Migrans": "Larva Migrans",
  "Leprosy Borderline": "Leprosy (Borderline)",
  "Leprosy Lepromatous": "Leprosy (Lepromatous)",
  "Leprosy Tuberculoid": "Leprosy (Tuberculoid)",
  "Lichen Planus": "Lichen Planus",
  "Lupus Erythematosus Chronicus Discoides": "Discoid Lupus",
  "Melanoma": "Melanoma",
  "Molluscum Contagiosum": "Molluscum Contagiosum",
  "Mycosis Fungoides": "Mycosis Fungoides",
  "Neurofibromatosis": "Neurofibromatosis",
  "Papilomatosis Confluentes And Reticulate": "Confluent Papillomatosis",
  "Pediculosis Capitis": "Head Lice",
  "Pityriasis Rosea": "Pityriasis Rosea",
  "Porokeratosis Actinic": "Actinic Porokeratosis",
  "Psoriasis": "Psoriasis",
  "Tinea Corporis": "Ringworm",
  "Tinea Nigra": "Tinea Nigra",
  "Tungiasis": "Tungiasis",
  "actinic keratosis": "Actinic Keratosis",
  "dermatofibroma": "Dermatofibroma",
  "nevus": "Mole (Nevus)",
  "pigmented benign keratosis": "Benign Keratosis",
  "seborrheic keratosis": "Seborrheic Keratosis",
  "squamous cell carcinoma": "Squamous Cell Carcinoma",
  "vascular lesion": "Vascular Lesion",
};

/* ---------- Severity classification for visual badges ---------- */
const SEVERITY = {
  "Basal Cell Carcinoma": "high",
  "Melanoma": "high",
  "squamous cell carcinoma": "high",
  "Mycosis Fungoides": "high",
  "Leprosy Borderline": "moderate",
  "Leprosy Lepromatous": "moderate",
  "Leprosy Tuberculoid": "moderate",
  "Herpes Simplex": "moderate",
  "Impetigo": "moderate",
  "actinic keratosis": "moderate",
  "Porokeratosis Actinic": "moderate",
};

/* ---------- Short descriptions for the reference gallery ---------- */
const CONDITION_DESCRIPTIONS = {
  "Basal Cell Carcinoma": "Most common skin cancer. Appears as waxy bumps or flat lesions. Highly treatable when detected early.",
  "Darier_s Disease": "Rare genetic disorder causing greasy, warty papules on the chest, back, and scalp.",
  "Epidermolysis Bullosa Pruriginosa": "Rare blistering condition with intensely itchy nodular lesions on shins and forearms.",
  "Hailey-Hailey Disease": "Genetic condition causing blisters and erosions in skin folds, triggered by friction and heat.",
  "Herpes Simplex": "Viral infection causing painful blisters around the lips or genital area. Recurrent episodes possible.",
  "Impetigo": "Highly contagious bacterial infection common in children. Red sores with honey-colored crusts.",
  "Larva Migrans": "Parasitic infection from hookworm larvae causing itchy, winding tracks under the skin.",
  "Leprosy Borderline": "Intermediate Hansen's disease with skin patches that may shift between tuberculoid and lepromatous forms.",
  "Leprosy Lepromatous": "Severe Hansen's disease with widespread nodules, thickened skin, and nerve damage.",
  "Leprosy Tuberculoid": "Milder Hansen's disease with few well-defined, numb skin patches.",
  "Lichen Planus": "Inflammatory condition causing purplish, flat-topped, itchy bumps on skin and mucous membranes.",
  "Lupus Erythematosus Chronicus Discoides": "Chronic autoimmune skin condition causing scaly, coin-shaped patches, often on the face.",
  "Melanoma": "Serious skin cancer from melanocytes. Watch for ABCDEs in moles. Seek immediate evaluation.",
  "Molluscum Contagiosum": "Viral infection producing small, firm bumps with central dimples. Common in children.",
  "Mycosis Fungoides": "Cutaneous T-cell lymphoma that appears as persistent patches, plaques, or tumors on the skin.",
  "Neurofibromatosis": "Genetic disorder causing tumors on nerve tissue, café-au-lait spots, and skin bumps.",
  "Papilomatosis Confluentes And Reticulate": "Brownish scaly papules merging into patches on chest and back.",
  "Pediculosis Capitis": "Head lice infestation causing intense scalp itching. Nits attach to hair shafts.",
  "Pityriasis Rosea": "Self-limiting rash starting with a herald patch, then smaller patches in a Christmas tree pattern.",
  "Porokeratosis Actinic": "Ring-shaped lesions with raised borders on sun-exposed skin from chronic UV exposure.",
  "Psoriasis": "Chronic autoimmune condition causing thick, scaly plaques on elbows, knees, and scalp.",
  "Tinea Corporis": "Fungal ringworm infection presenting as ring-shaped, red, scaly patches on the skin.",
  "Tinea Nigra": "Superficial fungal infection causing dark patches on palms or soles. Benign and treatable.",
  "Tungiasis": "Sand flea burrowing into skin (usually feet) causing painful nodules. Found in tropical areas.",
  "actinic keratosis": "Precancerous rough patches from sun damage. May progress to squamous cell carcinoma.",
  "dermatofibroma": "Common benign firm bump, usually on legs. Typically harmless and requires no treatment.",
  "nevus": "Common mole. Usually harmless but monitor for changes using the ABCDE criteria.",
  "pigmented benign keratosis": "Non-cancerous brown spots from sun exposure and aging. Benign and common.",
  "seborrheic keratosis": "Very common waxy, stuck-on brown growths that increase with age. Harmless.",
  "squamous cell carcinoma": "Second most common skin cancer. Firm red nodule or scaly lesion on sun-exposed areas.",
  "vascular lesion": "Blood vessel-related growth such as hemangiomas, port-wine stains, or cherry angiomas.",
};

/* ---------- Category grouping for organized gallery ---------- */
const CATEGORIES = {
  "Skin Cancers & Precancerous": [
    "Basal Cell Carcinoma", "Melanoma", "squamous cell carcinoma",
    "actinic keratosis", "Mycosis Fungoides"
  ],
  "Infections": [
    "Herpes Simplex", "Impetigo", "Larva Migrans", "Molluscum Contagiosum",
    "Pediculosis Capitis", "Tinea Corporis", "Tinea Nigra", "Tungiasis"
  ],
  "Inflammatory & Autoimmune": [
    "Psoriasis", "Lichen Planus",
    "Lupus Erythematosus Chronicus Discoides", "Pityriasis Rosea"
  ],
  "Genetic & Rare": [
    "Darier_s Disease", "Epidermolysis Bullosa Pruriginosa",
    "Hailey-Hailey Disease", "Neurofibromatosis",
    "Leprosy Borderline", "Leprosy Lepromatous", "Leprosy Tuberculoid"
  ],
  "Benign Growths": [
    "nevus", "dermatofibroma", "pigmented benign keratosis",
    "seborrheic keratosis", "vascular lesion",
    "Porokeratosis Actinic", "Papilomatosis Confluentes And Reticulate"
  ],
};

function displayLabel(key) {
  return DISPLAY_LABELS[key] || key;
}

function getSeverity(key) {
  return SEVERITY[key] || "low";
}

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

  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("nd_theme");
    if (saved) return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("nd_theme", theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }

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

  const predictionLabel = result?.predicted_class || result?.prediction || "";
  const severity = getSeverity(predictionLabel);

  return (
    <div className="app-shell">
      <header className="brand-header" style={{ position: "relative" }}>
        <button 
          onClick={toggleTheme} 
          className="theme-toggle"
          aria-label="Toggle theme"
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            background: "transparent",
            border: "1px solid var(--panel-border)",
            color: "var(--text-primary)",
            padding: "8px 12px",
            borderRadius: "99px",
            cursor: "pointer",
            fontSize: "1.2rem"
          }}
        >
          {theme === "dark" ? "☀️" : "🌙"}
        </button>
        <h1 className="brand-title">NeuroDermAI</h1>
        <p className="brand-subtitle">
          AI-powered skin condition screening powered by DINOv2. Covers 31 dermatological conditions.
        </p>
      </header>

      {metadataError && (
        <div className="banner banner-error">
          <strong>Backend Error: </strong> {metadataError}
        </div>
      )}

      <main className="main-grid">
        {/* Left Column: Upload */}
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
                <div className="upload-text">Click or drag &amp; drop to upload</div>
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
              className={`btn btn-primary ${isLoading ? "btn-loading" : ""}`}
              onClick={handleAnalyze}
              disabled={!selectedFile || isLoading || !metadata.ready}
            >
              {isLoading ? "Analyzing…" : "Analyze Skin"}
            </button>
          </div>
        </section>

        {/* Right Column: Results */}
        <section className="glass-panel">
          <h2 className="panel-title">2. Analysis Summary</h2>
          <p className="panel-description">Detailed breakdown of the AI screening result.</p>
          
          {error && <div className="banner banner-error">{error}</div>}

          {result ? (
            <div className="result-content fade-in">
              <div className={`result-hero severity-${severity}`}>
                <div>
                  <span className="prediction-label">Primary Match</span>
                  <h3 className="prediction-value">{displayLabel(predictionLabel)}</h3>
                  {severity === "high" && (
                    <span className="severity-badge severity-high-badge">⚠ High Priority – Seek Evaluation</span>
                  )}
                  {severity === "moderate" && (
                    <span className="severity-badge severity-moderate-badge">Clinical Attention Advised</span>
                  )}
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
                      <span className="top-label">{displayLabel(item.label)}</span>
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

              {result.explanation && (
                <div className="result-section">
                  <h4 className="section-title">About This Condition</h4>
                  <p className="explanation-text">{result.explanation}</p>
                </div>
              )}

              <div className="result-section" style={{marginBottom: 0}}>
                <h4 className="section-title">General Precautions</h4>
                <ul className="precautions-list">
                  {result.precautions.map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              </div>

              {result.disclaimer && (
                <div className="banner banner-warning" style={{marginTop: "20px", marginBottom: 0}}>
                  <strong>⚕ Disclaimer: </strong> {result.disclaimer}
                </div>
              )}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">♢</div>
              <p>Upload an image and run the analysis to view results.</p>
            </div>
          )}
        </section>
      </main>

      {/* Condition Reference Guide (31 classes, grouped by category) */}
      <section className="gallery-section">
        <header className="gallery-header">
          <h2 className="gallery-title">Condition Reference Guide</h2>
          <p className="brand-subtitle">
            31 dermatological conditions classified by our DINOv2-based AI screening model.
          </p>
        </header>

        {Object.entries(CATEGORIES).map(([category, conditions]) => (
          <div key={category} className="category-group">
            <h3 className="category-title">{category}</h3>
            <div className="condition-grid">
              {conditions.map((key) => (
                <article className={`condition-card severity-card-${getSeverity(key)}`} key={key}>
                  <div className="condition-header">
                    <h4 className="condition-name">{displayLabel(key)}</h4>
                    {getSeverity(key) === "high" && <span className="severity-dot dot-high" title="High priority" />}
                    {getSeverity(key) === "moderate" && <span className="severity-dot dot-moderate" title="Moderate" />}
                  </div>
                  <p className="condition-desc">{CONDITION_DESCRIPTIONS[key]}</p>
                </article>
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* Persistent Disclaimer Footer */}
      <footer className="disclaimer-footer">
        <p>
          <strong>⚕ Screening Disclaimer</strong><br />
          NeuroDermAI is an educational image-classification tool and <em>not</em> a medical 
          diagnosis system. Results are for informational purposes only. Please consult a 
          qualified clinician for any symptoms, persistent skin changes, pain, or treatment decisions.
        </p>
      </footer>
    </div>
  );
}
