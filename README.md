# 🍉 Suika

![Version](https://img.shields.io/badge/version-v5-blue)
![Status](https://img.shields.io/badge/status-active-success)
![Philosophy](https://img.shields.io/badge/focus-sensemaking-purple)
![License](https://img.shields.io/badge/license-MIT-black)

> **From Chaos to Clarity**  
> A sensemaking and progress-visualization tool for exploratory, thinking-heavy work — where progress happens _before_ tasks exist.

---

## Why Suika

Most productivity tools assume:

- Work is linear
- Progress = completed tasks
- Clarity comes before action

That breaks for:

- ADHD creatives
- Researchers & PhD students
- Solo developers designing systems
- Anyone working in ambiguity

**Suika is built on one belief:**

> **Understanding is progress.**

---

## What Suika Is

- A mirror of thinking
- A progress interpreter
- A pre-task system

## What Suika Is Not

- ❌ Task manager
- ❌ Kanban board
- ❌ Whiteboard
- ❌ Note-taking app
- ❌ Collaboration platform (v5)

---

## Core Ideas

### Fragments

Small, imperfect pieces of thinking:

- Questions
- Ideas
- Constraints
- Observations
- Conclusions (emerge later)

### Problem Spaces

Containers for uncertainty — not project plans.

### Resolution

“Clear enough for now.”  
Not finished. Not final. Always reversible.

---

## AI’s Role

**AI suggests. Humans decide.**

AI:

- Proposes connections
- Explains reasoning
- Estimates confidence

You:

- Accept
- Edit
- Reject

Nothing becomes real without you.

---

## The Clarity Graph

A read-only visualization of understanding over time.

No:

- Dragging
- Arranging
- Styling

> The graph is a **reflection**, not a canvas.

---

## Progress (No Tasks)

Progress is shown through:

- Questions surfaced
- Fragments resolved
- Contradictions revealed

No progress bars.  
No velocity metrics.  
Progress tells a **story**, not a score.

---

## What Suika Will _Not_ Do

- Collaboration
- Deadlines
- Tasks
- Exports
- Integrations
- AI content generation

These are intentional exclusions.

---

## Final Truth

Suika doesn’t help you do more.  
It helps you **see the work your mind is already doing**.

That’s the product.  
That’s the moat.  
That’s the soul.

---

## AI Setup (Gemini)

The project includes a server-side chat endpoint at:

- `POST /api/ai/chat`

### Environment variables

Add the following values to your `.env` file:

- `GOOGLE_AI_API_KEY=AIza...`
- `GOOGLE_AI_MODEL=gemini-2.0-flash` (optional, defaults to this model)

## AI Setup (Nvidia / DeepSeek)

You can keep Gemini code and switch to a separate Nvidia provider at runtime.

### Environment variables

- `AI_PROVIDER=nvidia`
- `NVIDIA_API_KEY=nvapi-...`
- `NVIDIA_AI_MODEL=meta/llama-3.1-8b-instruct` (optional, faster default)
- `NVIDIA_AI_CHAT_MODEL=...` (optional)
- `NVIDIA_AI_WEAVING_MODEL=...` (optional)
- `NVIDIA_AI_RELATIONSHIP_MODEL=...` (optional)
- `NVIDIA_AI_CONCLUSION_MODEL=...` (optional)
- `NVIDIA_AI_THINKING=false` (optional, set `true` for deeper reasoning but higher latency)

When `AI_PROVIDER` is not set (or set to `gemini`), existing Gemini behavior remains active.

### Smoke test all AI features

Run the AI feature smoke suite with either provider:

```bash
# Nvidia
AI_PROVIDER=nvidia npm run test:ai

# Gemini
AI_PROVIDER=gemini npm run test:ai
```

### Example request

```bash
curl -X POST http://localhost:3000/api/ai/chat \
	-H "Content-Type: application/json" \
	-b "<your auth cookies>" \
	-d '{
		"messages": [
			{"role": "user", "content": "Who are you?"}
		],
		"maxTokens": 200,
		"temperature": 0.7
	}'
```

### Response shape

```json
{
  "reply": "..."
}
```
