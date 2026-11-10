from fastapi import APIRouter
from models.sticky_note_model import StickyNoteCreate, StickyNoteSave, StickyNoteColorUpdate, StickyNotePositionUpdate
from constants.routes import STICKY_NOTES
from dependencies.auth import get_current_user
from fastapi import Depends
from fastapi import Body

from dependencies.dependencies import sticky_note_service

router = APIRouter(prefix=STICKY_NOTES)

@router.get("/note_to_task/{note_id}")
async def note_to_task(note_id: str, user=Depends(get_current_user)):
    user_id = user["id"]
    return await sticky_note_service.note_to_task(note_id, user_id)

@router.post("/send")
async def send_tasks_to_list(user=Depends(get_current_user), tasks: list[dict] = Body(...)):
    user_id = user["id"]
    created_tasks = await sticky_note_service.send_notes_as_tasks(tasks, user_id)
    return created_tasks

@router.post("/save")
def save_note_controller(note: StickyNoteSave, user=Depends(get_current_user)):

    user_id = user["id"]

    if note.id is not None:
        sticky = sticky_note_service.update_note(
            note.id, note.title, note.content, user_id,
            note.position.x, note.position.y, note.position.z)

    else:
        sticky = sticky_note_service.create_note(user_id, note.title, note.content, note.color,
            note.position.x, note.position.y, note.position.z )

    return sticky

# Endpoint to load your sticky notes
@router.get("")
def get_notes(user=Depends(get_current_user)):
    user_id = user["id"]
    return sticky_note_service.get_notes(user_id)

@router.delete("/delete/{note_id}")
def delete_note(note_id: str, user=Depends(get_current_user)):
    user_id = user["id"]
    deleted_id = sticky_note_service.delete_note(note_id, user_id)
    return {"deleted_id": deleted_id}

# Color updater
@router.patch("/{note_id}/color")
def update_note_color(
        note_id: str,
        update: StickyNoteColorUpdate,
        user=Depends(get_current_user)
):
    user_id = user["id"]
    sticky_note_service.update_color(note_id, update.color, user_id)

@router.patch("/{note_id}/position")
def update_note_position(note_id: str, update: StickyNotePositionUpdate,user=Depends(get_current_user)):
    user_id = user["id"]
    sticky_note_service.update_position(note_id, update.x, update.y, update.z, user_id)