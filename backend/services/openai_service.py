from services.ai_provider import complete_json

class AIService:
    def __init__(self, api_key: str | None = None):
        pass  # Credentials are resolved per request, never at startup.
        
    async def extract_task_fields(self, title: str, text: str, user_id: str, color: str):
        prompt = f"""
        Convert this note into one or more tasks. Only split into multiple tasks if clearly distinct.
        Return JSON: {{"tasks": [{{"title": "", "description": "", "task_duration": 0, 
        "importance": 1, "difficulty": 1, "due_date": null, "status": "to do", 
        "can_schedule": false, "user_id": "{user_id}"}}]}}
        Title: {title}
        Text: {text}
        """

        parsed, _, _ = await complete_json(prompt)

        tasks = parsed.get("tasks", [])
        for task in tasks:
                task["color"] = color  # stamp the sticky note color onto every task
                task["task_duration"] = int(task.get("task_duration") or 0)
                task["importance"] = int(task.get("importance") or 1)
                task["difficulty"] = int(task.get("difficulty") or 1)
                task["can_schedule"] = bool(task.get("can_schedule", False))
                task["user_id"] = user_id

        return tasks
    
    async def generate_workflow(self, title: str, description: str) -> dict:
        has_enough_info = len(description.strip()) > 30

        if has_enough_info:
            prompt = f"""
            You are a study planning assistant. Given this task, generate a focused work session workflow.
            Task: {title}
            Description: {description}
            Return JSON: {{"steps": [{{"label": "", "duration_seconds": 0}}]}}
            Keep it realistic, focused, and under 10 steps.
            """
        else:
            prompt = f"""
            Generate a general Pomodoro workflow for a task called "{title}".
            Return JSON: {{"steps": [{{"label": "", "duration_seconds": 0}}]}}
            Use the classic Pomodoro pattern: 25 min focus, 5 min break, repeat 4 cycles.
            """
        parsed, _, _ = await complete_json(prompt)
        return {
            "steps": parsed.get("steps", []),
            "is_pomodoro": not has_enough_info,
        }

    async def extract_tasks_from_document(self, title: str, text: str, user_id: str, color: str):
        from datetime import datetime

        prompt = f"""
        You are a productivity assistant.
    
        Convert this assignment into a SMALL SET of high-quality, actionable tasks.
    
        RULES:
        - Only create tasks for IMPORTANT, meaningful chunks of work
        - Do NOT create trivial or overly granular tasks
        - Typically between 2–6 tasks depending on complexity
        - Combine related steps into a single task when appropriate
    
        Each task MUST:
        - be clear and specific
        - be easy to start immediately
        - include a useful description (what to physically do)
        - include realistic task_duration (minutes)
        - include importance (1–3)
        - include difficulty (1–3)
        - All tasks should share the SAME due_date unless explicitly stated otherwise.
        - If no due date is provided, leave due_date as null.
    
        GOOD EXAMPLE:
        "Set up OAuth credentials and configure environment variables in your Next.js app"
    
        BAD EXAMPLE:
        "Work on OAuth"
        "Start project"
    
        Return JSON:
    
        {{
          "tasks": [
            {{
              "title": "",
              "description": "",
              "task_duration": 0,
              "importance": 1,
              "difficulty": 1,
              "due_date": "",
              "status": "to do",
              "can_schedule": true
            }}
          ]
        }}
    
        Today is {datetime.utcnow().isoformat()}
    
        Assignment:
        {text}
        """

        parsed, _, _ = await complete_json(prompt)

        tasks = parsed.get("tasks", [])

        for task in tasks:
            task["color"] = color
            task["task_duration"] = int(task.get("task_duration") or 30)
            task["importance"] = int(task.get("importance") or 2)
            task["difficulty"] = int(task.get("difficulty") or 2)
            task["user_id"] = user_id

            # 🔥 make sure tasks are usable in your UI
            task["can_schedule"] = (
                    bool(task.get("title")) and
                    task["task_duration"] > 0
            )

        return tasks