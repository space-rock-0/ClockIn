from collections import defaultdict

REQUIRED_KEYS = {"priority_norm", "urgency_norm", "duration_fit"}
CONFIDENCE_THRESHOLD = 0.65


class FeatureValidator:
    """
    Gates whether a correction event should enter perceptron training.

    Used by both the backend (slot corrections) and simulate.py (Jira changelog).

    A correction passes only if ALL three conditions hold:
      1. This user/author has ≥ 2 prior corrections of the same correction_type
      2. ≥ 50% of those prior corrections went in the same direction
      3. OpenAI confidence ≥ 0.65 (when confidence is provided)

    correction_type  — field name: "slot_hour", "priority", "timespent", "status", etc.
    direction        — "up"/"down", "earlier"/"later", "forward"/"backward", or None

    State is in-memory (keyed by user_id). Survives the process lifetime.
    """

    # Class-level alias so simulate.py can reference FeatureValidator.REQUIRED_KEYS
    REQUIRED_KEYS = REQUIRED_KEYS

    def __init__(self):
        self.accepted_count  = 0
        self.rejected_count  = 0
        self.rejection_reasons: dict[str, int] = {
            "insufficient_history":   0,
            "inconsistent_direction": 0,
            "low_confidence":         0,
            "feature_invalid":        0,
            "no_change":              0,
        }
        # user_id → correction_type → [direction]
        self._history: dict = defaultdict(lambda: defaultdict(list))
        # last 10 decisions for debugging
        self._debug_log: list[str] = []

    # ── direction helpers ─────────────────────────────────────────────────────

    @staticmethod
    def slot_direction(rejected_hour: int, accepted_hour: int) -> str | None:
        if accepted_hour < rejected_hour:
            return "earlier"
        if accepted_hour > rejected_hour:
            return "later"
        return None

    @staticmethod
    def priority_direction(rejected_priority: float, accepted_priority: float) -> str | None:
        if accepted_priority > rejected_priority:
            return "up"
        if accepted_priority < rejected_priority:
            return "down"
        return None

    # ── public validate ───────────────────────────────────────────────────────

    def validate(
        self,
        original: dict,
        corrected: dict,
        user_id: str,
        correction_type: str,
        direction: str | None,
        confidence: float | None = None,
    ) -> tuple[bool, str]:
        debug = f"{str(user_id)[:8]} | {correction_type:<14} | dir={direction} | conf={confidence}"

        # 1. Feature integrity
        for block in (original, corrected):
            if not REQUIRED_KEYS.issubset(block.keys()):
                return self._reject("feature_invalid", debug)
            for k in REQUIRED_KEYS:
                v = block[k]
                if not isinstance(v, (int, float)) or not (0.0 <= float(v) <= 1.0):
                    return self._reject("feature_invalid", debug)

        orig_vec = [float(original[k]) for k in sorted(REQUIRED_KEYS)]
        corr_vec = [float(corrected[k]) for k in sorted(REQUIRED_KEYS)]
        if orig_vec == corr_vec:
            return self._reject("no_change", debug)

        history = self._history[user_id][correction_type]

        # Condition 1 — need ≥ 2 prior corrections of the same type
        if len(history) < 2:
            history.append(direction)
            return self._reject("insufficient_history", debug)

        # Condition 2 — ≥ 50% same direction (skip if direction ambiguous)
        if direction is not None:
            prior = [d for d in history if d is not None]
            if prior:
                same = sum(1 for d in prior if d == direction)
                if same / len(prior) < 0.5:
                    history.append(direction)
                    return self._reject("inconsistent_direction", debug)

        # Condition 3 — confidence gate
        if confidence is not None and confidence < CONFIDENCE_THRESHOLD:
            history.append(direction)
            return self._reject("low_confidence", debug)

        history.append(direction)
        self.accepted_count += 1
        if len(self._debug_log) < 10:
            self._debug_log.append(f"PASS                           {debug}")
        return True, "passed"

    # ── helper ───────────────────────────────────────────────────────────────

    def _reject(self, reason: str, debug: str = "") -> tuple[bool, str]:
        self.rejected_count += 1
        self.rejection_reasons[reason] += 1
        if len(self._debug_log) < 10:
            self._debug_log.append(f"FAIL({reason:<24}) {debug}")
        return False, reason

    @staticmethod
    def to_vector(features: dict) -> list[float]:
        return [
            float(features["priority_norm"]),
            float(features["urgency_norm"]),
            float(features["duration_fit"]),
        ]
