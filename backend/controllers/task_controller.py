from fastapi import APIRouter, Depends
from fastapi import Body
from constants.routes import TASKS
from dependencies.dependencies import task_service
from dependencies.auth import get_current_user
from models.task_model import UpdateStatusBody
from fastapi import UploadFile, File


router = APIRouter(prefix=TASKS)

@router.get("")
def get_tasks(user=Depends(get_current_user)):
    user_id = user["id"]
    return task_service.get_tasks(user_id)

@router.get("/get_by_id/{id}")
def get_task_by_id(user=Depends(get_current_user), id: str = ""):
    user_id = user["id"]
    return task_service.get_task(id, user_id)


@router.delete("/delete/{task_id}")
def delete_task(task_id, user=Depends(get_current_user)):
    user_id = user["id"]
    return task_service.delete_task(task_id, user_id)

@router.post("/save")
def save_task(task_data: dict = Body(...), user=Depends(get_current_user)):
    user_id = user["id"]
    print('task:' + str(task_data))
    return task_service.create_task(task_data, user_id)

@router.patch("/update/{task_id}")
def update_task(task_id: str, task_data: dict = Body(...), user=Depends(get_current_user)):
    user_id = user["id"]
    return task_service.update_task(task_id, task_data, user_id)

@router.post("/split/{task_id}/{split}")
async def split_task(task_id: str, split: int, user=Depends(get_current_user)):
    user_id = user["id"]
    task_data = task_service.get_task(task_id, user_id)  # fetch the full task
    return await task_service.split_task(task_data, user_id, split)

@router.patch("/update/status/{task_id}")
def update_task_status(task_id: str, body: UpdateStatusBody, user=Depends(get_current_user)):
    user_id = user["id"]
    return task_service.update_task_status(task_id, body.status, user_id)

@router.post("/generate-from-file")
async def generate_from_file(
        file: UploadFile = File(...),
        user=Depends(get_current_user)
):
    user_id = user["id"]

    return await task_service.generate_tasks_from_file(
        file,
        user_id
    )