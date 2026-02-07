from fastapi import APIRouter, Depends, Body
from pydantic import BaseModel
from app.core.dependencies import get_current_user
from app.ai.chat_controller import handle_chat


class ChatMessage(BaseModel):
    user_message: str


router = APIRouter(prefix="/chat", tags=["AI Chat"])


@router.post("/")
def chat(
    message: ChatMessage,
    user = Depends(get_current_user)
):
    return handle_chat(user.id, message.user_message)
