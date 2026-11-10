import os
import json
from datetime import datetime, timezone, timedelta
from uuid import UUID

from repositories.schedule_repository import ScheduleRepository
from repositories.calendar_repository import CalendarRepository
from repositories.busy_times_repository import BusyTimesRepository
from services.ml_service import MLService
from services.feature_validator import FeatureValidator
from services.feature_discovery_service import FeatureDiscoveryService


DEFAULT_WEIGHTS = {
    "priority": 0.4,
    "urgency": 0.4,
    "duration_fit": 0.2,
}


class ScheduleService:

    # In-memory cache for promoted feature weights per user.
    # Persists across requests for the lifetime of the server process.
    # Base weights (priority/urgency/duration_fit) are in Supabase;
    # promoted weights live here until a DB schema change adds a column for them.
    _promoted_weights: dict[str, dict[str, float]] = {}

    def __init__(self):
        self.repo           = ScheduleRepository()
        self.task_repo      = CalendarRepository()
        self.busy_times_repo = None  # lazy — avoids circular import at startup
        self.ml             = MLService()
        self.validator      = FeatureValidator()
        self.discovery      = FeatureDiscoveryService(self.repo)
        # InterpretationService is lazy-loaded so the app starts without OPENAI_API_KEY
        self._interpreter   = None

    def _get_busy_times_repo(self):
        if self.busy_times_repo is None:
            from database.supabase_client import supabase
            self.busy_times_repo = BusyTimesRepository(supabase)
        return self.busy_times_repo

    def _get_interpreter(self):
        if self._interpreter is None:
            from services.interpretation_service import InterpretationService
            api_key = os.getenv("OPENAI_API_KEY", "")
            self._interpreter = InterpretationService(api_key)
        return self._interpreter

    # Public: generate a full schedule for a list of tasks

    def build_schedule(self, user_id: str, task_ids: list[str], filters: dict, allowed_days: list[str] | None = None, ignored_event_ids: list[str] | None = None) -> list[dict]:
        # 1. fetch tasks being scheduled
        tasks = self.task_repo.get_tasks_by_ids(task_ids)

        # 1b. fetch ALL user tasks so we can detect study/exam pairs across the full task list
        all_user_tasks = self.task_repo.get_tasks_by_user(user_id) or []
        all_task_dicts = [
            {
                "id": str(t.id),
                "title": t.title,
                "due_date": t.due_date.isoformat() if t.due_date else None,
            }
            for t in all_user_tasks
        ]
        # Detect "study for X" / "X exam" pairs → pinned dates for study tasks
        pinned_dates = self._find_study_exam_pairs(all_task_dicts)

        # Get existing schedules to include them as booked and in results
        existing_schedules = self.repo.get_schedules_for_user(UUID(user_id))

        # 2. load already-booked slots so we don't double-book
        booked = self._get_booked_slots(UUID(user_id))

        # 2b. load Google Calendar busy times (excluding user-ignored ones)
        booked = self._add_busy_times_to_booked(user_id, booked, ignored_event_ids or [])

        # Tasks being explicitly (re)scheduled — always recalculate their slot.
        # Only carry over existing slots for OTHER tasks not in this request.
        submitted_set = set(task_ids)

        results = []
        for s in existing_schedules:
            if s["task_id"] in submitted_set:
                # Will be rescheduled below — just block its old slot so other tasks
                # don't accidentally land there while we recalculate.
                start_str = s["scheduled_start"]
                end_str = s["scheduled_end"]
                start = datetime.fromisoformat(self._strip_tz(start_str))
                end = datetime.fromisoformat(self._strip_tz(end_str))
                date_str = start.date().isoformat()
                start_mins = start.hour * 60 + start.minute
                end_mins = end.hour * 60 + end.minute
                if (date_str, start_mins, end_mins) not in booked:
                    booked.append((date_str, start_mins, end_mins))
                continue

            start_str = s["scheduled_start"]
            end_str = s["scheduled_end"]
            start = datetime.fromisoformat(self._strip_tz(start_str))
            end = datetime.fromisoformat(self._strip_tz(end_str))
            date_str = start.date().isoformat()
            start_mins = start.hour * 60 + start.minute
            end_mins = end.hour * 60 + end.minute
            if (date_str, start_mins, end_mins) not in booked:
                booked.append((date_str, start_mins, end_mins))
            results.append({
                "task_id": s["task_id"],
                "title": s["title"],
                "description": s.get("description"),
                "start": start_str,
                "end": end_str,
                "score": 1.0,
            })

        new_tasks = tasks  # all submitted tasks get a fresh slot

        task_dicts = [
            {
                "id": str(t.id),
                "title": t.title,
                "description": t.description,
                "priority": t.priority,
                "due_date": t.due_date.isoformat() if t.due_date else None,
                "task_duration": t.task_duration,
            }
            for t in new_tasks
        ]

        # 3. rank tasks by filter preferences
        ranked = self._rank_tasks(task_dicts, filters)

        # 4. get weights (base + any promoted features) then boost by filters
        base_weights = self._get_weights(UUID(user_id))
        weights = self._apply_filter_boosts(base_weights, filters)
        promoted_keys = [k for k in weights if k not in ("priority", "urgency", "duration_fit")]

        # 5. for each task in ranked order, find its best available slot
        skipped = []
        for task in ranked:
            pinned = pinned_dates.get(task["id"])
            slot = self._find_best_slot_for_task(
                task, booked, weights, allowed_days or [],
                pinned_date=pinned, promoted_keys=promoted_keys,
            )
            if slot is None and pinned:
                # Pinned date had no free slot — fall back to full search
                print(f"[StudyExam] No slot on pinned date {pinned} for '{task['title']}', falling back")
                slot = self._find_best_slot_for_task(
                    task, booked, weights, allowed_days or [],
                    promoted_keys=promoted_keys,
                )
            if slot is None:
                skipped.append({"task_id": task["id"], "title": task["title"], "skipped": True, "reason": "no_slot"})
                continue

            duration_mins = task.get("task_duration") or 60
            end = slot + timedelta(minutes=duration_mins)
            booked.append((
                slot.date().isoformat(),
                slot.hour * 60 + slot.minute,
                slot.hour * 60 + slot.minute + duration_mins,
            ))

            # Score using full weight vector
            score_parts = (
                weights["priority"] * self._score_priority(task.get("priority")) +
                weights["urgency"] * self._score_urgency(task.get("due_date")) +
                weights["duration_fit"] * self._score_duration_fit(task.get("task_duration"), slot)
            )
            for pk in promoted_keys:
                score_parts += weights.get(pk, 0.0) * self._slot_feature_value(pk, slot)
            score = round(score_parts, 4)

            results.append({
                "task_id": task["id"],
                "title": task["title"],
                "description": task.get("description"),
                "start": slot.isoformat(),
                "end": end.isoformat(),
                "score": score,
            })

        return {"scheduled": results, "skipped": skipped}

    # Public: existing single-slot methods (kept for compatibility) 

    def accept_slot(self, user_id: UUID, task_id: UUID, proposed_start: datetime, scheduled_end: datetime):
        self.repo.log_behavior_event(user_id, task_id, proposed_start, "accepted")
        return self.repo.save_schedule(user_id, task_id, proposed_start, scheduled_end)

    def reject_slot(self, user_id: UUID, task_id: UUID, proposed_start: datetime):
        self.repo.log_behavior_event(user_id, task_id, proposed_start, "rescheduled")

    def get_schedule(self, user_id: UUID) -> list[dict]:
        return self.repo.get_schedules_for_user(user_id)

    # Task ranking (filters determine order, not slot)

    def _rank_tasks(self, tasks: list[dict], filters: dict) -> list[dict]:
        def sort_key(task):
            score = 0
            if filters.get("deadline") == "desc":
                score += self._score_urgency(task.get("due_date")) * 2
            elif filters.get("deadline") == "asc":
                score -= self._score_urgency(task.get("due_date")) * 2
            if filters.get("importance") == "desc":
                score += self._score_priority(task.get("priority")) * 2
            elif filters.get("importance") == "asc":
                score -= self._score_priority(task.get("priority")) * 2
            return score

        return sorted(tasks, key=sort_key, reverse=True)

    # Temporarily boost weights based on filter preferences 

    def _apply_filter_boosts(self, weights: dict, filters: dict) -> dict:
        w = weights.copy()
        if filters.get("deadline") in ("asc", "desc"):
            w["urgency"] = min(w["urgency"] * 1.75, 1.0)
        if filters.get("importance") in ("asc", "desc"):
            w["priority"] = min(w["priority"] * 1.75, 1.0)
        if filters.get("time") in ("asc", "desc"):
            w["duration_fit"] = min(w["duration_fit"] * 1.75, 1.0)
        total = sum(w.values()) or 1
        return {k: round(v / total, 4) for k, v in w.items()}

    # Find best available slot for a single task

    def _find_best_slot_for_task(
        self,
        task: dict,
        booked: list,
        weights: dict,
        allowed_days: list[str] | None = None,
        pinned_date: str | None = None,
        promoted_keys: list[str] | None = None,
    ) -> datetime | None:
        """
        booked is a list of (date_str, start_mins, end_mins) ranges.
        pinned_date: if set, only consider slots on that specific date.
        promoted_keys: extra learned features to include in slot scoring.
        """
        priority_score = self._score_priority(task.get("priority"))
        urgency_score = self._score_urgency(task.get("due_date"))

        now = datetime.now()
        best_score = -1
        best_slot = None
        duration_mins = task.get("task_duration") or 60
        promoted_keys = promoted_keys or []

        due_date = task.get("due_date")
        due_dt = self._parse_due_dt(due_date) if due_date else None

        for day_offset in range(7):  # search within the current week
            day = now + timedelta(days=day_offset)
            date_str = day.date().isoformat()

            if pinned_date and date_str != pinned_date:
                continue
            if allowed_days and date_str not in allowed_days:
                continue

            day_booked = [(s, e) for (d, s, e) in booked if d == date_str]

            for hour in range(6, 24):
                for minute in (0, 30):
                    slot_dt = day.replace(hour=hour, minute=minute, second=0, microsecond=0)
                    if slot_dt < now:
                        continue
                    if due_dt and slot_dt >= due_dt:
                        continue
                    slot_start_mins = hour * 60 + minute
                    slot_end_mins = slot_start_mins + duration_mins
                    if any(slot_start_mins < be and bs < slot_end_mins for bs, be in day_booked):
                        continue

                    score = (
                        weights["priority"] * priority_score +
                        weights["urgency"] * urgency_score +
                        weights["duration_fit"] * self._score_duration_fit(duration_mins, slot_dt)
                    )
                    for pk in promoted_keys:
                        score += weights.get(pk, 0.0) * self._slot_feature_value(pk, slot_dt)
                    score = round(score, 4)

                    if score > best_score:
                        best_score = score
                        best_slot = slot_dt

        return best_slot

    # ── Study / exam pairing ──────────────────────────────────────────────────

    def _find_study_exam_pairs(self, all_tasks: list[dict]) -> dict[str, str]:
        """
        Detect "study for X" / "X exam" pairs across ALL user tasks.
        Returns {study_task_id: target_date} where target_date is the day
        before the matched exam's due date.

        Study prefixes: "study for", "study", "review", "prep for", "prepare for"
        Exam suffixes:  "exam", "test", "midterm", "final", "quiz", "assessment"
        Matching: word-overlap on the subject words (stop words removed).
        """
        import re
        STUDY_PREFIXES = ["study for ", "prep for ", "prepare for ", "review for ", "study ", "review "]
        EXAM_KEYWORDS  = {"exam", "test", "midterm", "final", "quiz", "assessment", "exams"}
        STOP_WORDS     = {"for", "the", "a", "an", "my", "do", "to", "and", "of"}

        def subject_words(title: str) -> set[str]:
            words = re.sub(r'[^a-z0-9 ]', '', title.lower()).split()
            return {w for w in words if w not in STOP_WORDS and w not in EXAM_KEYWORDS}

        study_tasks = []  # {id, subject_words}
        exam_tasks  = []  # {subject_words, due_date}

        for t in all_tasks:
            title = (t.get("title") or "").strip()
            lower = title.lower()

            # Check study prefixes
            for prefix in STUDY_PREFIXES:
                if lower.startswith(prefix):
                    study_tasks.append({"id": t["id"], "words": subject_words(title)})
                    break

            # Check exam keywords anywhere in title
            title_words = set(re.sub(r'[^a-z0-9 ]', '', lower).split())
            if title_words & EXAM_KEYWORDS and t.get("due_date"):
                exam_tasks.append({"words": subject_words(title), "due_date": t["due_date"]})

        pairs: dict[str, str] = {}
        for study in study_tasks:
            if not study["words"]:
                continue
            best_exam = None
            best_overlap = 0
            for exam in exam_tasks:
                overlap = len(study["words"] & exam["words"])
                if overlap > best_overlap:
                    best_overlap = overlap
                    best_exam = exam

            if best_exam and best_overlap >= 1:
                try:
                    exam_date = datetime.fromisoformat(best_exam["due_date"][:10])
                    target = (exam_date - timedelta(days=1)).date().isoformat()
                    pairs[study["id"]] = target
                    print(f"[StudyExam] Paired '{study['words']}' → exam on {exam_date.date()}, pinned to {target}")
                except Exception:
                    pass

        return pairs

    # ── Promoted feature slot scoring ─────────────────────────────────────────

    def _slot_feature_value(self, key: str, slot: datetime) -> float:
        """
        Map a promoted latent feature to a per-slot compatibility score (0–1).
        These functions capture the slot-level interpretation of each feature —
        e.g. cognitive_load: how cognitively appropriate is this time of day?
        The perceptron learns which direction (high or low) the user actually prefers.
        """
        hour    = slot.hour
        weekday = slot.weekday()  # 0=Mon … 6=Sun

        if key == "cognitive_load":
            # Peak focus: 9–11am → 0.9; afternoon → 0.5; evening → 0.3
            if 9  <= hour < 12: return 0.9
            if 12 <= hour < 15: return 0.6
            if 15 <= hour < 18: return 0.5
            if 18 <= hour < 22: return 0.3
            return 0.2

        if key == "context_switch_cost":
            # Dedicated blocks (morning/evening) have lower switch cost
            if 9 <= hour < 12 or 19 <= hour < 22: return 0.2
            return 0.6

        if key == "weekday_preference":
            # 1.0 = weekday, 0.0 = weekend
            return 1.0 if weekday < 5 else 0.0

        if key == "day_avoidance":
            # 0.1 = Monday (commonly avoided), 0.9 = other days
            return 0.1 if weekday == 0 else 0.9

        # Unknown promoted feature: use a time-of-day proxy
        return 0.7 if 9 <= hour < 18 else 0.3

    # Helpers 

    @staticmethod
    def _strip_tz(s: str) -> str:
        """Remove timezone suffix so fromisoformat gives a naive local datetime."""
        import re
        return re.sub(r'([+-]\d{2}:\d{2}|Z)$', '', s)

    def _add_busy_times_to_booked(self, user_id: str, booked: list, ignored_event_ids: list[str]) -> list:
        """
        Fetch all BusyTimes for the user, skip any in ignored_event_ids,
        and expand them into (date_str, start_mins, end_mins) entries
        for each day in the next 7 days where the event applies.
        """
        DAY_MAP = {"MON": 0, "TUE": 1, "WED": 2, "THU": 3, "FRI": 4, "SAT": 5, "SUN": 6}
        ignored = set(ignored_event_ids)
        now = datetime.now()

        try:
            busy_times = self._get_busy_times_repo().get_all(user_id)
        except Exception:
            return booked

        for bt in busy_times:
            if bt.get("id") in ignored:
                continue
            start_time = bt.get("start_time")
            end_time = bt.get("end_time")
            if not start_time or not end_time:
                continue
            try:
                sh, sm = int(start_time[:2]), int(start_time[3:5])
                eh, em = int(end_time[:2]), int(end_time[3:5])
            except (ValueError, IndexError):
                continue
            start_mins = sh * 60 + sm
            end_mins = eh * 60 + em

            days_of_week = bt.get("days_of_week") or []
            allowed_weekdays = {DAY_MAP[d] for d in days_of_week if d in DAY_MAP}

            for day_offset in range(7):
                day = now + timedelta(days=day_offset)
                if allowed_weekdays and day.weekday() not in allowed_weekdays:
                    continue
                date_str = day.date().isoformat()
                booked.append((date_str, start_mins, end_mins))

        return booked

    def _get_booked_slots(self, user_id: UUID) -> list:
        """Returns list of (date_str, start_mins, end_mins) for all saved blocks."""
        existing = self.repo.get_schedules_for_user(user_id)
        booked = []
        for s in existing:
            try:
                start = datetime.fromisoformat(self._strip_tz(s["scheduled_start"]))
                end   = datetime.fromisoformat(self._strip_tz(s["scheduled_end"]))
            except Exception:
                continue
            booked.append((
                start.date().isoformat(),
                start.hour * 60 + start.minute,
                end.hour * 60 + end.minute,
            ))
        return booked

    def _score_priority(self, priority: int | None) -> float:
        if priority is None:
            return 0.5
        return min(priority, 5) / 5.0

    @staticmethod
    def _parse_due_dt(due_date: str) -> datetime:
        """
        Parse a due-date string to a naive local datetime so it compares
        correctly against datetime.now() (also naive local).

        The frontend stores datetime-local values without timezone info —
        treating them as UTC would shift them by the user's UTC offset and
        make near-deadline tasks appear already overdue.

        - Date-only  → end of that day (23:59:59)
        - Datetime   → exact time, timezone stripped so it stays as entered
        """
        if len(due_date) <= 10:
            return datetime.fromisoformat(due_date).replace(hour=23, minute=59, second=59)
        due = datetime.fromisoformat(due_date)
        # Strip any timezone so comparisons stay in local wall-clock time
        return due.replace(tzinfo=None)

    def _score_urgency(self, due_date: str | None) -> float:
        if due_date is None:
            return 0.3
        due = self._parse_due_dt(due_date)
        now = datetime.now()  # naive local time — matches how due dates are stored
        hours_left = (due - now).total_seconds() / 3600
        if hours_left <= 0:
            return 1.0
        if hours_left >= 14 * 24:
            return 0.1
        return round(1 - (hours_left / (14 * 24)), 4)

    def _score_duration_fit(self, task_duration: int | None, proposed_start: datetime) -> float:
        hour = proposed_start.hour
        if 18 <= hour < 24:
            return 1.0
        if 15 <= hour < 18:
            return 0.7
        if 12 <= hour < 15:
            return 0.5
        return 0.2

    def _get_weights(self, user_id: UUID) -> dict:
        """
        Base weights (priority/urgency/duration_fit) come from Supabase.
        Promoted feature weights are cached in _promoted_weights (in-memory).
        Returns the merged dict so the scheduler can use all dimensions.
        """
        base     = self.ml.get_learned_weights(str(user_id), self.repo)
        promoted = ScheduleService._promoted_weights.get(str(user_id), {})
        return {**base, **promoted}

    def get_last_rejected_slot(self, user_id: UUID, task_id: UUID) -> datetime | None:
        """Returns the most recently rejected slot for this task, or None."""
        events = self.repo.get_behavior_events_ordered(user_id)
        last = None
        for ev in events:
            if ev.get("task_id") == str(task_id) and ev.get("action") == "rescheduled":
                try:
                    last = datetime.fromisoformat(
                        ev["slot_offered"].replace("Z", "+00:00")
                    )
                except Exception:
                    pass
        return last

    async def process_slot_correction(
        self,
        user_id: UUID,
        task_id: UUID,
        rejected_slot: datetime,
        accepted_slot: datetime,
    ) -> None:
        """
        Full correction pipeline:
          OpenAI interpretation → FeatureValidator → perceptron update (with decay)

        Called after a user accepts a new slot, with the previously rejected slot
        passed in.  Stores latent features as JSONB alongside the event.
        """
        task = self.task_repo.get_task_by_id(task_id)
        task_dict = {
            "title":         task.title         if task else "unknown",
            "priority":      task.priority      if task else 3,
            "due_date":      task.due_date.isoformat() if (task and task.due_date) else None,
            "task_duration": task.task_duration if task else 60,
        }

        # Read which latent features have been promoted to real perceptron dimensions
        promoted_keys = self.repo.get_promoted_keys()

        # 1. OpenAI semantic interpretation (pass promoted keys so it returns per-slot values)
        interp = None
        try:
            interp = await self._get_interpreter().interpret_slot_correction(
                task_dict, rejected_slot, accepted_slot,
                promoted_features=promoted_keys,
            )
        except Exception:
            pass

        if interp is None:
            return  # OpenAI unavailable — skip training, don't block the accept

        print(f"[OPENAI INTERPRETATION] Task: {task_dict['title']}, Rejected: {rejected_slot}, Accepted: {accepted_slot}")
        print(f"Reasoning: {interp.get('reasoning', 'No reasoning provided')}")
        print(f"Interpretation: {json.dumps(interp, indent=2, default=str)}")

        original    = interp.get("original",  {})
        corrected   = interp.get("corrected", {})
        confidence  = interp.get("confidence")
        latent_vars = interp.get("latent_vars", {})
        if not isinstance(latent_vars, dict):
            latent_vars = {}

        # Derive correction_type and direction for the validator
        try:
            direction = FeatureValidator.slot_direction(rejected_slot.hour, accepted_slot.hour)
        except Exception:
            direction = None
        correction_type = "slot_hour"

        # 2. FeatureValidator gate (uses only the 3 base features for the gate check)
        passed, _ = self.validator.validate(
            original, corrected,
            str(user_id), correction_type, direction,
            float(confidence) if confidence is not None else None,
        )
        if not passed:
            return

        # 3. Build extended feature vectors:
        #    Base features come from OpenAI's original/corrected dicts.
        #    Promoted features: use OpenAI's per-slot values if returned,
        #    otherwise fall back to computing them from the slot time.
        base_keys    = ["priority", "urgency", "duration_fit"]
        all_keys     = base_keys + promoted_keys

        phi_orig_base = FeatureValidator.to_vector(original)   # [priority, urgency, duration_fit]
        phi_corr_base = FeatureValidator.to_vector(corrected)

        phi_orig_promoted = [
            float(original.get(k, self._slot_feature_value(k, rejected_slot)))
            for k in promoted_keys
        ]
        phi_corr_promoted = [
            float(corrected.get(k, self._slot_feature_value(k, accepted_slot)))
            for k in promoted_keys
        ]

        phi_orig = phi_orig_base + phi_orig_promoted
        phi_corr = phi_corr_base + phi_corr_promoted

        current_weights = self._get_weights(user_id)
        print(f"[ML INPUTS] Task: {task_dict['title']} | feature_keys: {all_keys}")
        print(f"Phi_orig: {phi_orig}  Phi_corr: {phi_corr}")
        print(f"Latent vars: {latent_vars} | Current weights: {current_weights}")

        # 4. Persist the event with latent features
        self.repo.log_behavior_event_with_features(
            user_id, task_id, accepted_slot, "accepted",
            phi_corr_base, latent_vars,
        )

        # 4b. Record latent keys for promotion tracking
        if latent_vars:
            self.discovery.record_latent_keys(latent_vars)

        # 5. Online perceptron update across all dimensions
        correction_ts = accepted_slot if accepted_slot.tzinfo else \
            accepted_slot.replace(tzinfo=timezone.utc)
        try:
            new_weights = self.ml.perceptron_update(
                str(user_id), phi_corr, phi_orig, correction_ts, self.repo,
                feature_keys=all_keys,
            )
            print(f"Updated weights: {new_weights}")
            # Cache promoted weights in-memory (base weights saved to DB inside perceptron_update)
            if promoted_keys:
                ScheduleService._promoted_weights[str(user_id)] = {
                    k: new_weights[k] for k in promoted_keys if k in new_weights
                }
        except Exception as e:
            print(f"[ML] perceptron_update failed: {e}")

    # Public: score a specific slot for a task

    def score_slot(self, task: dict, proposed_start: datetime, user_id: UUID) -> float:
        weights = self._get_weights(user_id)
        weights = self._apply_filter_boosts(weights, {})
        return round(
            weights["priority"] * self._score_priority(task.get("priority")) +
            weights["urgency"] * self._score_urgency(task.get("due_date")) +
            weights["duration_fit"] * self._score_duration_fit(task.get("task_duration"), proposed_start),
            4
        )

    # Public: find the best slot for a single task

    def find_best_slot(self, task: dict, user_id: UUID) -> dict:
        weights = self._get_weights(user_id)
        booked = self._get_booked_slots(user_id)
        slot = self._find_best_slot_for_task(task, booked, weights)
        if slot is None:
            raise ValueError("No available slot found in the next 7 days")
        score = self.score_slot(task, slot, user_id)
        return {"best_slot": slot, "score": score, "accepted": score >= 0.5}
