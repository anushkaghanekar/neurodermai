import { useEffect, useState } from "react";
import { Loader2, ClipboardList, Download } from "lucide-react";
import { fetchHistory, getScanImageUrl, downloadScanReport } from "../lib/api";

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

function displayLabel(key) {
  return DISPLAY_LABELS[key] || key;
}

function formatDate(dateStr) {
  try {
    const d = new Date(dateStr + "Z"); // treat as UTC
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

export default function HistoryPage() {
  const [scans, setScans] = useState([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const LIMIT = 12;

  async function loadScans(newOffset = 0) {
    setIsLoading(true);
    setError("");
    try {
      const data = await fetchHistory(LIMIT, newOffset);
      setScans(data.scans);
      setTotal(data.total);
      setOffset(newOffset);
    } catch (err) {
      setError(err.message || "Failed to load scan history.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadScans(0);
  }, []);

  const totalPages = Math.ceil(total / LIMIT);
  const currentPage = Math.floor(offset / LIMIT) + 1;

  return (
    <div className="history-page">
      <header className="history-header">
        <h1 className="history-title">Scan History</h1>
        <p className="brand-subtitle">
          Review your past skin analyses. {total > 0 ? `${total} scan${total !== 1 ? "s" : ""} total.` : ""}
        </p>
      </header>

      {error && <div className="banner banner-error">{error}</div>}

      {isLoading ? (
        <div className="empty-state">
          <div className="empty-icon text-gray-400 mb-4 flex justify-center"><Loader2 size={48} className="animate-spin" strokeWidth={1} /></div>
          <p>Loading your scans…</p>
        </div>
      ) : scans.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon text-gray-400 mb-4 flex justify-center"><ClipboardList size={48} strokeWidth={1} /></div>
          <p>No scans yet. Run an analysis while signed in to start building your history.</p>
        </div>
      ) : (
        <>
          <div className="history-grid">
            {scans.map((scan) => (
              <article className="history-card glass-panel" key={scan.id}>
                {scan.image_filename && (
                  <div className="history-thumb-container">
                    <img
                      src={getScanImageUrl(scan.image_filename)}
                      alt="Scan"
                      className="history-thumb"
                      loading="lazy"
                    />
                  </div>
                )}
                <div className="history-card-body">
                  <div className="history-card-header">
                    <h3 className="history-card-label">
                      {displayLabel(scan.predicted_class)}
                    </h3>
                    <button 
                      className="history-download-btn flex items-center justify-center text-gray-500 hover:text-blue-600 transition-colors"
                      title="Download PDF Report"
                      onClick={() => downloadScanReport(scan.id)}
                    >
                      <Download size={18} />
                    </button>
                  </div>
                  <div className="history-card-meta">
                    <span className="history-confidence">
                      {(scan.confidence * 100).toFixed(1)}% confidence
                    </span>
                    <span className="history-date">{formatDate(scan.created_at)}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="history-pagination">
              <button
                className="btn btn-secondary pagination-btn"
                disabled={currentPage <= 1}
                onClick={() => loadScans(offset - LIMIT)}
              >
                ← Previous
              </button>
              <span className="pagination-info">
                Page {currentPage} of {totalPages}
              </span>
              <button
                className="btn btn-secondary pagination-btn"
                disabled={currentPage >= totalPages}
                onClick={() => loadScans(offset + LIMIT)}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
