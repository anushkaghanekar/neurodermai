import { useEffect, useState, useRef, useCallback } from "react";
import { fetchModelMetadata, predictSkinCondition, updateScanNotes, downloadScanReport } from "../lib/api";

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

/* Detect mobile via user-agent (heuristic for camera capture attr) */
function isMobileDevice() {
  return /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

export default function Dashboard({ user }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showToast, setShowToast] = useState(false);
  
  // Notes and Reports state
  const [userNotes, setUserNotes] = useState("");
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [reportError, setReportError] = useState("");

  // Camera state
  const [cameraOpen, setCameraOpen] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

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
    setShowToast(false);
    try {
      const payload = await predictSkinCondition(selectedFile);
      setResult(payload);
      setUserNotes(""); // Reset notes for new scan
      // Show "saved to history" toast if applicable
      if (payload.saved_to_history) {
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      }
    } catch (err) {
      setError(err.message || "Prediction failed.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSaveNotes() {
    if (!result?.scan_id) return;
    setIsSavingNotes(true);
    setReportError("");
    try {
      await updateScanNotes(result.scan_id, userNotes);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (err) {
      setReportError(err.message || "Failed to save notes.");
    } finally {
      setIsSavingNotes(false);
    }
  }

  async function handleDownloadReport() {
    if (!result?.scan_id) return;
    setIsLoading(true);
    setReportError("");
    try {
      // Opt-in: save notes first if they've been typed
      if (userNotes.trim()) {
        await updateScanNotes(result.scan_id, userNotes);
      }
      await downloadScanReport(result.scan_id);
    } catch (err) {
      setReportError(err.message || "Failed to download report.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleReset() {
    setSelectedFile(null);
    setResult(null);
    setError("");
    setShowToast(false);
  }

  /* ---------- Camera Capture (Desktop Webcam Modal) ---------- */
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraOpen(false);
  }, []);

  async function openCamera() {
    // On mobile, just trigger the native camera via a hidden file input
    if (isMobileDevice()) {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.capture = "environment";
      input.onchange = (e) => {
        if (e.target.files && e.target.files[0]) {
          setSelectedFile(e.target.files[0]);
          setResult(null);
          setError("");
        }
      };
      input.click();
      return;
    }

    // Desktop: open webcam modal
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      setCameraOpen(true);

      // Wait for the video element to mount
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      });
    } catch (err) {
      setError("Camera access denied. Please allow camera permissions and try again.");
    }
  }

  function capturePhoto() {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          const file = new File([blob], "camera-capture.jpg", { type: "image/jpeg" });
          setSelectedFile(file);
          setResult(null);
          setError("");
        }
        stopCamera();
      },
      "image/jpeg",
      0.92
    );
  }

  const predictionLabel = result?.predicted_class || result?.prediction || "";
  const severity = getSeverity(predictionLabel);

  return (
    <>
      {/* Toast notification */}
      {showToast && (
        <div className="toast toast-success fade-in">
          ✓ Scan saved to your history
        </div>
      )}

      {/* Webcam Modal (Desktop only) */}
      {cameraOpen && (
        <div className="camera-overlay" onClick={stopCamera}>
          <div className="camera-modal" onClick={(e) => e.stopPropagation()}>
            <div className="camera-header">
              <h3>Camera Capture</h3>
              <button className="camera-close-btn" onClick={stopCamera}>✕</button>
            </div>
            <div className="camera-viewfinder">
              <video ref={videoRef} autoPlay playsInline muted className="camera-video" />
              <canvas ref={canvasRef} style={{ display: "none" }} />
            </div>
            <div className="camera-actions">
              <button className="btn btn-primary camera-snap-btn" onClick={capturePhoto}>
                <span className="snap-circle" /> Capture
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="dashboard-content">
        <header className="brand-header">
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
          {/* Left Column: Upload + Camera */}
          <section className="glass-panel">
            <h2 className="panel-title">1. Image Input</h2>
            <p className="panel-description">Upload a photo or snap one with your camera.</p>

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
                className="btn btn-camera"
                onClick={openCamera}
                disabled={isLoading}
                title="Take a photo with your camera"
              >
                📷 Camera
              </button>
              <button 
                className="btn btn-secondary" 
                onClick={handleReset}
                disabled={!selectedFile || isLoading}
              >
                Clear
              </button>
              <button 
                className={`btn btn-primary ${isLoading ? "btn-loading" : ""}`}
                onClick={handleAnalyze}
                disabled={!selectedFile || isLoading || !metadata.ready}
              >
                {isLoading ? "Analyzing…" : "Analyze"}
              </button>
            </div>

            {!user && (
              <p className="login-hint">
                💡 Sign in to automatically save scans to your history.
              </p>
            )}
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

                {/* Report and Notes Section */}
                {result.scan_id && (
                  <div className="report-actions fade-in" style={{marginTop: "24px"}}>
                    <div className="divider" />
                    <h4 className="section-title" style={{marginTop: "20px"}}>Patient Observations</h4>
                    <p className="panel-description" style={{marginBottom: "12px"}}>
                      Add symptoms or notes to include in your clinical report.
                    </p>
                    <textarea
                      className="form-input notes-textarea"
                      placeholder="e.g., Noticed redness 3 days ago, itchy during the night..."
                      value={userNotes}
                      onChange={(e) => setUserNotes(e.target.value)}
                    />
                    
                    {reportError && <p className="error-text">{reportError}</p>}
                    
                    <div className="report-btn-group">
                      <button 
                        className={`btn btn-secondary ${isSavingNotes ? "btn-loading" : ""}`}
                        onClick={handleSaveNotes}
                        disabled={isSavingNotes || !userNotes.trim()}
                      >
                        Save Notes
                      </button>
                      <button 
                        className={`btn btn-primary ${isLoading ? "btn-loading" : ""}`}
                        onClick={handleDownloadReport}
                        disabled={isLoading}
                      >
                        📄 Download Report (PDF)
                      </button>
                    </div>
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

        {/* Condition Reference Guide */}
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
    </>
  );
}
