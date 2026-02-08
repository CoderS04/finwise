from fastapi import APIRouter, Depends, Body, Request
from pydantic import BaseModel
from app.core.dependencies import get_current_user
from app.ai.chat_controller import handle_chat
from app.core.rate_limiter import rate_limit


class ChatMessage(BaseModel):
    user_message: str


router = APIRouter(prefix="/chat", tags=["AI Chat"])


@router.post("/")
@rate_limit(max_requests=10, window_seconds=60)  # 10 requests per minute
def chat(
    message: ChatMessage,
    request: Request,
    user = Depends(get_current_user)
):
    return handle_chat(user.id, message.user_message)
