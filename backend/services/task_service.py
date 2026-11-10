from fastapi import UploadFile

class TaskService:
    def __init__(self, TaskRepo, pdf_parser, ai_service):
        self.TaskRepo = TaskRepo
        self.pdf_parser = pdf_parser
        self.ai_service = ai_service

    def create_task(self, task_data, user_id):
        return self.TaskRepo.create(task_data, user_id)

    def get_tasks(self, user_id):
        return self.TaskRepo.get_tasks(user_id)

    def get_task(self, task_id: str, user_id: str):
        return self.TaskRepo.get_task(task_id, user_id)

    def delete_task(self, task_id, user_id):
        return self.TaskRepo.delete_task(task_id, user_id)

    def update_task(self, task_id: str, task_data: dict, user_id: str):
        return self.TaskRepo.update_task(task_id, task_data, user_id)

    async def create_tasks_bulk(self, tasks_data: list, user_id: str):
        if len(tasks_data) == 1:
            return [self.create_task(tasks_data[0], user_id)]
        return await self.TaskRepo.insert_many(tasks_data, user_id)

    async def split_task(self, task_data: dict, user_id: str, split: int):
        if split <= 1:
            raise ValueError("Split must be greater than 1")

        original_id = task_data.get("id")
        original_duration = task_data["task_duration"]
        new_duration = original_duration // split

        created_tasks = []
        for i in range(split):
            new_task_data = task_data.copy()
            new_task_data.pop("id", None)
            new_task_data["task_duration"] = new_duration
            new_task_data["title"] += f" (Part {i+1})"
            created_tasks.append(new_task_data)

        created_tasks = await self.create_tasks_bulk(created_tasks, user_id)

        if original_id:
            self.TaskRepo.delete_task(original_id, user_id)

        return created_tasks

    def update_task_status(self, task_id: str, status: str, user_id: str):
        return self.TaskRepo.update_task(
            task_id,
            {"status": status},
            user_id
        )

    # 🔥 NEW FEATURE (PDF FLOW)
    async def generate_tasks_from_file(self, file: UploadFile, user_id: str):
        file_bytes = await file.read()

        if not file.filename.endswith(".pdf"):
            raise ValueError("Only PDF files are allowed")

        # 1. Extract text
        raw_text = self.pdf_parser.extract_text(file_bytes)

        # LIMIT SIZE (important for cost + speed)
        cleaned_text = raw_text[:8000]

        tasks = await self.ai_service.extract_tasks_from_document(
            file.filename,
            cleaned_text,
            user_id,
            "yellow"
        )

        return tasks