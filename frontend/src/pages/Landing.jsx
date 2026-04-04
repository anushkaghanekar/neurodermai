function Landing({ apiBaseUrl, supportedConditions }) {
  return (
    <section className="hero">
      <div className="hero-copy">
        <p className="eyebrow">NeuroDermAI</p>
        <h1 className="hero-title">Skin-image triage support with a real ML pipeline.</h1>
        <p className="hero-subtitle">
          Upload a clear skin image, send it through the FastAPI inference service,
          and review the predicted condition, confidence, and top-3 alternatives in
          one place.
        </p>
        <div className="chip-row">
          {supportedConditions.map((condition) => (
            <span className="chip" key={condition}>
              {condition}
            </span>
          ))}
        </div>
      </div>

      <div className="hero-stats">
        <article className="stat-card">
          <span className="stat-label">Frontend</span>
          <strong>React + Vite</strong>
          <p>Image preview, loading states, and prediction visualisation.</p>
        </article>
        <article className="stat-card">
          <span className="stat-label">Inference</span>
          <strong>FastAPI</strong>
          <p>Single `/predict` endpoint with model artifacts loaded at startup.</p>
        </article>
        <article className="stat-card">
          <span className="stat-label">Runtime</span>
          <strong>{apiBaseUrl}</strong>
          <p>Override with `VITE_API_BASE_URL` for local, Render, or Hugging Face deployments.</p>
        </article>
      </div>
    </section>
  );
}

export default Landing;
