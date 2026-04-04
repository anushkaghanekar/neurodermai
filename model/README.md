# Model Artifacts

This directory stores the trained inference artifacts exported from Kaggle:

- `model.h5`
- `labels.json`

The repository intentionally does not commit a fake or placeholder model. After training with the Kaggle notebook in this folder, download the generated files from `/kaggle/working/` and place them here so the backend can load them locally.

If your attached Kaggle dataset does not contain healthy images, the final `labels.json` will not include `normal`. In that case the backend and frontend will only expose the classes that were actually trained.
