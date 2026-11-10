from fastapi import APIRouter, Depends
from dependencies.auth import get_current_user
from services.ai_provider import AISettings, complete_json

router = APIRouter(prefix="/api/ai", tags=["AI settings"])


@router.post("/test")
async def test_connection(settings: AISettings, user=Depends(get_current_user)):
    # Test the chosen provider itself, without a fallback hiding a bad key.
    _, provider, model = await complete_json(
        'Return JSON: {"ok": true}', settings=settings, fallback=False
    )
    return {"ok": True, "provider": provider, "model": model}
