from pydantic import BaseModel

class Token(BaseModel):
    access_token: str
    token_type: str
    user_id: str
    name: str
    role: str
    mine_id: str | None = None

class LoginRequest(BaseModel):
    email: str
    password: str
