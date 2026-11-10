from pydantic import BaseModel

class UpdateStatusBody(BaseModel):
    status: str