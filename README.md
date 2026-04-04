# NeuroDermAI

NeuroDermAI is a phase-1 skin image classification app with a React frontend, a FastAPI inference backend, and a Kaggle-ready TensorFlow training pipeline.

The project is intentionally focused on common skin issues and educational use. It is not a medical diagnosis system.

## What Is In This Repo

- `frontend/`: Vite + React client for image upload, preview, and prediction display
- `backend/`: FastAPI inference service that loads a trained Keras model once at startup
- `model/`: Kaggle notebook and local model artifact location

## Canonical Classes

The training flow is built around this practical class set:

- `acne`
- `eczema`
- `psoriasis`
- `fungal`
- `warts`
- `normal`

The Kaggle notebook maps safe folder aliases into these canonical labels when possible. If the attached dataset does not include healthy skin images, the exported `labels.json` will not include `normal`, and the deployed app will honestly omit that class from predictions.

## Architecture

- Frontend: React + Vite
- Backend: FastAPI + TensorFlow/Keras
- Training: Kaggle Notebook + TensorFlow/Keras + MobileNetV2
- Model artifacts: `model/model.h5` and `model/labels.json`

## Training Pipeline

The Kaggle notebook lives at [model/neurodermai_kaggle_training.ipynb](/Users/vedgharat/Projects/neurodermai/model/neurodermai_kaggle_training.ipynb).

It does the following:

- reads image data from `/kaggle/input/...`
- builds a clean curated directory under `/kaggle/working/curated_dataset/`
- uses `image_dataset_from_directory`
- resizes to `224x224`
- applies augmentation
- uses MobileNetV2 transfer learning
- handles imbalance with class weights
- uses `EarlyStopping`, `ModelCheckpoint`, and `ReduceLROnPlateau`
- evaluates on a validation split
- saves `/kaggle/working/model.h5`
- saves `/kaggle/working/labels.json`
- runs a sample prediction cell at the end

### Expected Dataset Shape

The notebook is flexible about nesting. These are both acceptable:

```text
/kaggle/input/my-skin-dataset/
  acne/
  eczema/
  psoriasis/
  fungal/
  warts/
  normal/
```

```text
/kaggle/input/my-skin-dataset/
  train/
    acne/
    eczema/
  valid/
    acne/
    eczema/
```

The notebook scans path segments and tries to map them into the canonical class set. Use clear folder names wherever possible.

### Kaggle Steps

1. Create a new Kaggle Notebook and enable GPU.
2. Upload or attach your skin image dataset under `/kaggle/input/...`.
3. Upload this repository or copy the notebook file into Kaggle.
4. Open [model/neurodermai_kaggle_training.ipynb](/Users/vedgharat/Projects/neurodermai/model/neurodermai_kaggle_training.ipynb).
5. If autodetection does not find the right dataset, set `DATASET_DIR` in the notebook to the correct `/kaggle/input/...` path.
6. Run all cells.
7. Download `/kaggle/working/model.h5` and `/kaggle/working/labels.json`.
8. Place both files in [model/](/Users/vedgharat/Projects/neurodermai/model).

### Healthy Skin / `normal` Class Note

If your Kaggle input does not contain healthy images, the notebook will print a warning and continue training on the available disease classes only. If you want `normal`, attach an additional healthy-skin dataset and place those images in a folder named `normal` or `healthy` inside `/kaggle/input/...`.

## Backend Setup

The backend code lives in [backend/app/main.py](/Users/vedgharat/Projects/neurodermai/backend/app/main.py).

### Install

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### Environment

Copy [backend/.env.example](/Users/vedgharat/Projects/neurodermai/backend/.env.example) if you want custom paths or CORS origins.

```bash
MODEL_PATH=model/model.h5
LABELS_PATH=model/labels.json
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
MAX_UPLOAD_MB=10
```

### Run

From the repository root:

```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

### API

- `GET /health`
- `GET /metadata`
- `POST /predict`

`/predict` accepts `multipart/form-data` with a single `file` field.

`/metadata` reports whether the backend has successfully loaded a real Kaggle-exported model and which classes exist in `labels.json`.

Example response:

```json
{
  "prediction": "eczema",
  "confidence": 0.873421,
  "top_3": [
    { "label": "eczema", "probability": 0.873421 },
    { "label": "psoriasis", "probability": 0.081213 },
    { "label": "fungal", "probability": 0.028744 }
  ],
  "probabilities": {
    "acne": 0.006122,
    "eczema": 0.873421,
    "psoriasis": 0.081213,
    "fungal": 0.028744,
    "warts": 0.0105
  },
  "explanation": "Educational summary for the predicted class.",
  "precautions": [
    "Short educational precaution 1",
    "Short educational precaution 2"
  ],
  "disclaimer": "NeuroDermAI is an educational image-classification tool and not a medical diagnosis system."
}
```

## Frontend Setup

The React client lives in [frontend/src/pages/Dashboard.jsx](/Users/vedgharat/Projects/neurodermai/frontend/src/pages/Dashboard.jsx).

### Install

```bash
cd frontend
npm install
```

### Environment

Copy [frontend/.env.example](/Users/vedgharat/Projects/neurodermai/frontend/.env.example) and point it at the backend:

```bash
VITE_API_BASE_URL=http://localhost:8000
```

### Run

```bash
cd frontend
npm run dev
```

Open the Vite URL shown in the terminal, typically `http://localhost:5173`.

## Local End-to-End Run

1. Train the model in Kaggle and place `model.h5` and `labels.json` in [model/](/Users/vedgharat/Projects/neurodermai/model).
2. Start the backend on port `8000`.
3. Start the frontend on port `5173`.
4. Upload an image in the browser and review the returned prediction, confidence, top-3 list, probabilities, explanation, and precautions.

## Deployment Notes

The project is split so it can be deployed cleanly:

- Frontend: Vercel or any static host that supports Vite output
- Backend: Render, Hugging Face Spaces, or another Python host that can serve FastAPI and load TensorFlow

Recommended deployment notes:

- keep `model.h5` and `labels.json` together from the same training run
- set `VITE_API_BASE_URL` to the deployed backend URL
- set backend `CORS_ORIGINS` to the deployed frontend origin
- verify the host supports TensorFlow runtime requirements before deploying

## Reproducibility Notes

- No login, authentication, or database is included in phase 1
- No fake model or placeholder predictions are used
- The backend expects real Kaggle-exported artifacts
- The frontend reads real predictions from the backend API

## Disclaimer

NeuroDermAI is an educational classification project. It can be useful for experimentation, UI prototyping, and model deployment practice, but it is not medical-grade software and must not be used as a substitute for professional diagnosis or treatment.
