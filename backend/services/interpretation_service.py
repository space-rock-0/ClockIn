import asyncio
from fastapi import HTTPException
from datetime import datetime
from services.ai_provider import complete_json


class InterpretationService:
    """
    Calls OpenAI to semantically interpret scheduling corrections.

    Two modes:
      - interpret_change(field, from_val, to_val)
          For Jira-style changelog rows (used by simulate.py).
      - interpret_slot_correction(task, rejected_slot, accepted_slot)
          For ClockIn slot accept/reject events.

    Both return the base features (priority_norm, urgency_norm, duration_fit)
    plus any latent variables OpenAI infers (cognitive_load, context_switch_cost,
    etc.).  Latent variables are returned under the key "latent_vars" as a flat
    dict and should be stored in a JSONB column alongside the event.
    """

    CONFIDENCE_THRESHOLD = 0.65

    MAX_RETRIES     = 3
    MAX_CONCURRENT  = 20

    def __init__(self, api_key: str, max_concurrent: int = 20, max_retries: int = 3):
        self._sem        = asyncio.Semaphore(max_concurrent)
        self._max_retries = max_retries
        self.skipped: list[str] = []

    # ── Jira changelog interpretation (simulate.py) ──────────────────────────

    async def interpret_change(self, field: str, from_val: str, to_val: str) -> dict | None:
        cache_key = f"change|{field}|{from_val}|{to_val}"

        prompt = f"""You are analyzing task management corrections to understand scheduling behavior.

A user corrected a task by changing {field} from "{from_val}" to "{to_val}".

Return ONLY a JSON object:
{{
  "original": {{
    "priority_norm": <float 0.0-1.0>,
    "urgency_norm":  <float 0.0-1.0>,
    "duration_fit":  <float 0.0-1.0>
  }},
  "corrected": {{
    "priority_norm": <float 0.0-1.0>,
    "urgency_norm":  <float 0.0-1.0>,
    "duration_fit":  <float 0.0-1.0>
  }},
  "latent_vars": {{
    "cognitive_load":        <float 0.0-1.0 or null>,
    "context_switch_cost":   <float 0.0-1.0 or null>
  }},
  "reasoning":  "<one sentence: why did the user make this correction?>",
  "confidence": <float 0.0-1.0, how certain you are in this interpretation>
}}

Rules:
- original  = features for "{from_val}" — the REJECTED scheduling state
- corrected = features for "{to_val}"   — the ACCEPTED scheduling state
- priority_norm: importance  (Blocker=1.0, Critical=0.9, Major=0.7, Medium=0.5, Minor=0.3, Trivial=0.1)
- urgency_norm:  time pressure (Done/Resolved=1.0, In Progress=0.5, Reopened=0.3, To Do=0.0)
- duration_fit:  session fit  (short/easy=1.0, very long/blocked=0.1)
- cognitive_load: estimated mental effort to complete this task (higher = more demanding)
- context_switch_cost: cost of switching to/from this task given its nature (higher = harder to switch)
- Set latent vars to null if you cannot confidently infer them
- confidence: 0.0=very uncertain, 1.0=completely certain
- All non-null feature values must be floats strictly between 0.0 and 1.0."""

        return await self._call(cache_key, prompt)

    # ── ClockIn slot correction interpretation ────────────────────────────────

    async def interpret_slot_correction(
        self,
        task: dict,
        rejected_slot: datetime,
        accepted_slot: datetime,
        promoted_features: list[str] | None = None,
    ) -> dict | None:
        title    = task.get("title", "untitled task")
        priority = task.get("priority", 3)
        due_date = task.get("due_date", "unknown")
        duration = task.get("task_duration", 60)

        rej_str = rejected_slot.strftime("%A %I:%M %p") if rejected_slot else "unknown"
        acc_str = accepted_slot.strftime("%A %I:%M %p") if accepted_slot else "unknown"

        promoted = promoted_features or []
        cache_key = f"slot|{title}|{priority}|{rej_str}|{acc_str}|{'_'.join(promoted)}"

        # Build promoted feature lines for original/corrected blocks
        promoted_orig_lines = "\n".join(
            f'    "{k}": <float 0.0-1.0, how compatible is {rej_str} for this task given its {k}>,'
            for k in promoted
        )
        promoted_corr_lines = "\n".join(
            f'    "{k}": <float 0.0-1.0, how compatible is {acc_str} for this task given its {k}>,'
            for k in promoted
        )
        promoted_rules = "\n".join(
            f'- {k} (in original/corrected): per-slot compatibility score — '
            f'how well does that time of day suit this task\'s {k} (0=poor fit, 1=perfect fit)'
            for k in promoted
        )

        prompt = f"""You are analyzing a scheduling correction in a personal task manager.

Task: "{title}"
Priority: {priority}/5
Due date: {due_date}
Estimated duration: {duration} minutes

The system proposed scheduling this task at: {rej_str}
The user moved it to:                        {acc_str}

IMPORTANT: Pay special attention to any day-of-week changes (e.g., Monday→Friday, weekday→weekend).
These reveal strong preferences about when the user wants to work.

Return ONLY a JSON object:
{{
  "original": {{
    "priority_norm": <float 0.0-1.0>,
    "urgency_norm":  <float 0.0-1.0>,
    "duration_fit":  <float 0.0-1.0>{(',' + chr(10) + promoted_orig_lines) if promoted else ''}
  }},
  "corrected": {{
    "priority_norm": <float 0.0-1.0>,
    "urgency_norm":  <float 0.0-1.0>,
    "duration_fit":  <float 0.0-1.0>{(',' + chr(10) + promoted_corr_lines) if promoted else ''}
  }},
  "latent_vars": {{
    "cognitive_load":        <float 0.0-1.0 or null>,
    "context_switch_cost":   <float 0.0-1.0 or null>,
    "weekday_preference":    <float -1.0 to 1.0 or null (negative=prefers weekends, positive=prefers weekdays)>,
    "day_avoidance":         <float 0.0-1.0 or null (how strongly user avoids specific days like Monday)>
  }},
  "reasoning":  "<1-2 sentences: why did the user move this task? Include if day-of-week change is significant.>",
  "confidence": <float 0.0-1.0>
}}

Rules:
- original  = features of the REJECTED slot ({rej_str})
- corrected = features of the ACCEPTED slot ({acc_str})
- priority_norm: how important this task is given its priority and due date (0=trivial, 1=critical)
- urgency_norm:  time pressure at the accepted slot time (1=very urgent, 0=no rush)
- duration_fit:  how well the accepted slot fits the task's estimated duration (1=perfect fit)
- cognitive_load (latent_vars): estimated mental demand of this task (0=mindless, 1=deeply complex)
- context_switch_cost (latent_vars): how disruptive switching to/from this task is (0=easy, 1=very costly)
- weekday_preference (latent_vars): -1.0=strong weekend, 0.0=no preference, 1.0=strong weekday
- day_avoidance (latent_vars): how much user avoids a specific day (Monday=0.9, random=0.0)
{promoted_rules}
- Set latent_vars to null if you cannot confidently infer them
- All non-null values must be floats strictly within the specified ranges."""

        return await self._call(cache_key, prompt)

    # ── shared call helper ────────────────────────────────────────────────────

    async def _call(self, cache_key: str, prompt: str) -> dict | None:
        async with self._sem:
            for attempt in range(self._max_retries):
                try:
                    result, _, _ = await complete_json(prompt)
                    return result
                except HTTPException:
                    # The shared router has already attempted configured fallbacks.
                    return None
                except Exception:
                    if attempt < self._max_retries - 1:
                        await asyncio.sleep(1.0 * (attempt + 1))
                    else:
                        msg = f"SKIPPED after {self._max_retries} retries: {cache_key}"
                        self.skipped.append(msg)
                        return None
