from pydantic import BaseModel


class LoginRequest(BaseModel):
    email: str
    password: str


class SignupRequest(BaseModel):
    email: str
    password: str
    username: str


class AuthResponse(BaseModel):
    access_token: str
    user_id: str
    email: str
