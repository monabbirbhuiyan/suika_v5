# CourtListener-Only Fine-Tune Pipeline (Python)

This folder contains a minimal pipeline to train a model on CourtListener data only.

## What this does

1. Fetches records from CourtListener REST v4 with token auth.
2. Stores raw API records as JSONL for reproducibility.
3. Builds a clean text corpus from those records only.
4. Runs continued pretraining (CPT) on that corpus.

## 1) Install Python deps

```bash
pip install -r scripts/legal_finetune/requirements.txt
```

## 2) Set your CourtListener API token

Windows (PowerShell):

```powershell
$env:COURTLISTENER_API_TOKEN="YOUR_TOKEN"
```

Windows (cmd):

```cmd
set COURTLISTENER_API_TOKEN=YOUR_TOKEN
```

Windows (Git Bash / MINGW64):

```bash
export COURTLISTENER_API_TOKEN="YOUR_TOKEN"
```

If `python` opens the Microsoft Store shortcut, use `py` instead:

```bash
py -V
```

## 3) Fetch CourtListener data

Example: fetch SCOTUS opinions from 2018 onward.

```bash
py scripts/legal_finetune/courtlistener_fetch.py \
  --endpoint https://www.courtlistener.com/api/rest/v4/opinions/ \
  --param cluster__docket__court=scotus \
  --param cluster__date_filed__gte=2018-01-01 \
  --page-size 50 \
  --timeout-seconds 180 \
  --retries 6 \
  --sleep-seconds 0.4 \
  --max-records 20000
```

If your network drops mid-run, rerun the same command. The script now resumes from
`data/courtlistener/raw/opinions.fetch.state.json` automatically.

Outputs:

- `data/courtlistener/raw/opinions.jsonl`
- `data/courtlistener/raw/opinions.manifest.json`

## 4) Build training corpus

```bash
python scripts/legal_finetune/build_corpus.py \
  --input-jsonl data/courtlistener/raw/opinions.jsonl \
  --output-jsonl data/courtlistener/prepared/train_corpus.jsonl \
  --output-txt data/courtlistener/prepared/train_corpus.txt
```

## 5) Train (continued pretraining)

```bash
python scripts/legal_finetune/train_cpt.py \
  --model meta-llama/Llama-3.2-1B \
  --train-jsonl data/courtlistener/prepared/train_corpus.jsonl \
  --output-dir artifacts/legal-cpt
```

### Recommended start for RTX 3050 Ti

Use a small base model and fp16 settings first, then scale up if stable.

```bash
python scripts/legal_finetune/train_cpt.py \
  --model Qwen/Qwen2.5-0.5B \
  --train-jsonl data/courtlistener/prepared/train_corpus.jsonl \
  --output-dir artifacts/legal-cpt-3050ti \
  --max-length 512 \
  --batch-size 1 \
  --grad-accum 32 \
  --epochs 1 \
  --lr 2e-5 \
  --precision fp16
```

If you run out of VRAM, reduce `--max-length` to `384` or `256`.

## 6) Serve the fine-tuned model for the app

Start the local inference server:

```bash
py scripts/legal_finetune/serve_local_model.py \
  --model-dir artifacts/legal-cpt-3050ti \
  --host 127.0.0.1 \
  --port 8000 \
  --precision fp16
```

Then point the Next.js app at it via `.env.local`:

```env
AI_PROVIDER=local
LOCAL_AI_BASE_URL=http://127.0.0.1:8000/v1
LOCAL_AI_API_KEY=local-dev
LOCAL_AI_MODEL=artifacts/legal-cpt-3050ti
LOCAL_AI_CHAT_MODEL=artifacts/legal-cpt-3050ti
LOCAL_AI_WEAVING_MODEL=artifacts/legal-cpt-3050ti
LOCAL_AI_RELATIONSHIP_MODEL=artifacts/legal-cpt-3050ti
LOCAL_AI_CONCLUSION_MODEL=artifacts/legal-cpt-3050ti
```

After that, your existing app routes like `/api/ai/chat` will use the local model automatically.

## Important notes

- This is text-only domain adaptation (CPT), not instruction tuning.
- The model only learns from what exists in your prepared corpus.
- Keep your fetch params and manifest so your dataset is auditable.
- Respect CourtListener terms, attribution rules, and maintenance windows.
- For consumer GPUs like RTX 3050 Ti, prefer `--precision fp16` over `bf16`.
- The app does not load the model checkpoint directly. It calls a running inference server.
