from datetime import datetime, timezone
from math import exp
from collections import defaultdict
import numpy as np

DECAY_LAMBDA = 0.01
LEARNING_RATE = 0.1
DEFAULT_WEIGHTS = {"priority": 0.4, "urgency": 0.4, "duration_fit": 0.2}


class MLService:

    def get_learned_weights(self, user_id: str, repo) -> dict:
        """
        Primary weight source: perceptron_weights table.
        Falls back to DEFAULT_WEIGHTS if no weights have been learned yet.
        LogisticRegression is no longer used for scheduling decisions.
        """
        from uuid import UUID
        uid = UUID(user_id) if isinstance(user_id, str) else user_id
        stored = repo.get_perceptron_weights(uid)
        if stored:
            return stored
        return DEFAULT_WEIGHTS

    def perceptron_update(
        self,
        user_id: str,
        phi_corr: list[float],
        phi_orig: list[float],
        correction_timestamp: datetime,
        repo,
        *,
        reference_days: int | None = None,
        feature_keys: list[str] | None = None,
    ) -> dict:
        """
        Online perceptron update with exponential time decay.

        feature_keys defines which weight dimensions to use and in what order.
        Defaults to the canonical 3 base features. Pass a longer list (e.g.
        ["priority","urgency","duration_fit","cognitive_load"]) for variable-dim
        updates used by simulate.py when latent features have been promoted.
        """
        if feature_keys is None:
            feature_keys = ["priority", "urgency", "duration_fit"]
        _defaults = {"priority": 0.4, "urgency": 0.4, "duration_fit": 0.2}

        stored = repo.get_perceptron_weights(user_id)
        if stored:
            w = np.array([stored.get(k, 0.0) for k in feature_keys])
        else:
            w = np.array([_defaults.get(k, 0.0) for k in feature_keys])

        if reference_days is not None:
            # simulate.py passes days-since-first-correction in dataset
            days_ago = reference_days
        else:
            # backend passes the actual correction timestamp; decay = how old is it
            now = datetime.now(timezone.utc)
            if correction_timestamp.tzinfo is None:
                correction_timestamp = correction_timestamp.replace(tzinfo=timezone.utc)
            days_ago = max(0, (now - correction_timestamp).days)
        decay_weight = exp(-DECAY_LAMBDA * days_ago)

        w = w + LEARNING_RATE * decay_weight * (np.array(phi_corr) - np.array(phi_orig))
        w = np.clip(w, 0, None)
        norm_val = np.linalg.norm(w)
        w = w / (1 + DECAY_LAMBDA * norm_val)  # L2 regularisation
        s = w.sum() or 1
        w = w / s

        weights = {k: float(w[i]) for i, k in enumerate(feature_keys)}
        repo.save_perceptron_weights(user_id, weights)
        return weights

    def recompute_weights_from_history(self, user_id: str, repo) -> dict:
        """Rebuild perceptron weights from scratch, applying decay to each historical correction."""
        events = repo.get_behavior_events_ordered(user_id)

        # Group by task_id to find reject→accept correction pairs
        task_events: dict[str, list] = defaultdict(list)
        for ev in events:
            task_events[ev["task_id"]].append(ev)

        w = np.array([0.4, 0.4, 0.2])
        now = datetime.now(timezone.utc)

        for evs in task_events.values():
            for i in range(len(evs) - 1):
                if evs[i]["action"] == "rescheduled" and evs[i + 1]["action"] == "accepted":
                    phi_r = self._features_from_event(evs[i])
                    phi_a = self._features_from_event(evs[i + 1])

                    ts_str = evs[i].get("created_at") or evs[i].get("slot_offered", "")
                    try:
                        ts = datetime.fromisoformat(ts_str.replace("Z", "+00:00"))
                        if ts.tzinfo is None:
                            ts = ts.replace(tzinfo=timezone.utc)
                        days_ago = max(0, (now - ts).days)
                    except Exception:
                        days_ago = 0
                    decay_weight = exp(-DECAY_LAMBDA * days_ago)

                    w = w + LEARNING_RATE * decay_weight * (np.array(phi_a) - np.array(phi_r))
                    w = np.clip(w, 0, None)
                    norm_val = np.linalg.norm(w)
                    w = w / (1 + DECAY_LAMBDA * norm_val)
                    s = w.sum() or 1
                    w = w / s

        weights = {"priority": float(w[0]), "urgency": float(w[1]), "duration_fit": float(w[2])}
        repo.save_perceptron_weights(user_id, weights)
        return weights

    def _features_from_event(self, event: dict) -> list[float]:
        """Compute [priority_norm, urgency_norm, duration_fit] from a behavior event row."""
        priority = event.get("importance") or 3
        priority_norm = min(priority, 5) / 5.0

        due_date = event.get("due_date")
        now = datetime.now(timezone.utc)
        if due_date:
            try:
                due = datetime.fromisoformat(str(due_date).replace("Z", "+00:00"))
                if due.tzinfo is None:
                    due = due.replace(tzinfo=timezone.utc)
                days_left = (due - now).days
                if days_left <= 0:
                    urgency_norm = 1.0
                elif days_left >= 14:
                    urgency_norm = 0.1
                else:
                    urgency_norm = round(1 - days_left / 14, 4)
            except Exception:
                urgency_norm = 0.3
        else:
            urgency_norm = 0.3

        try:
            slot = datetime.fromisoformat(str(event.get("slot_offered", "")).replace("Z", "+00:00"))
            hour = slot.hour
            if 18 <= hour < 24:
                duration_fit = 1.0
            elif 15 <= hour < 18:
                duration_fit = 0.7
            elif 12 <= hour < 15:
                duration_fit = 0.5
            else:
                duration_fit = 0.2
        except Exception:
            duration_fit = 0.5

        return [priority_norm, urgency_norm, duration_fit]
