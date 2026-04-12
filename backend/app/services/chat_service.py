import uuid
import logging
from datetime import datetime
from typing import Optional, List, Tuple

from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.chat import ChatSession, ChatMessage
from app.services.assistant_service import AssistantService
from app.core.llm import LLMProvider

logger = logging.getLogger(__name__)


class ChatService:

    @staticmethod
    def create_session(
        db: Session,
        user_id: str,
        farm_id: Optional[str] = None,
        title: Optional[str] = None,
    ) -> ChatSession:
        session = ChatSession(
            user_id=uuid.UUID(user_id),
            farm_id=uuid.UUID(farm_id) if farm_id else None,
            title=title,
        )
        db.add(session)
        db.commit()
        db.refresh(session)
        logger.info(f"Created chat session {session.id} for user {user_id}")
        return session

    @staticmethod
    def list_sessions(
        db: Session,
        user_id: str,
        farm_id: Optional[str] = None,
        limit: int = 100,
    ) -> List[ChatSession]:
        q = db.query(ChatSession).filter(ChatSession.user_id == uuid.UUID(user_id))
        if farm_id:
            q = q.filter(ChatSession.farm_id == uuid.UUID(farm_id))
        return q.order_by(ChatSession.updated_at.desc()).limit(limit).all()

    @staticmethod
    def update_session(db: Session, session_id: str, user_id: str, title: str) -> ChatSession:
        session = ChatService.get_session(db, session_id, user_id)
        session.title = title
        db.commit()
        db.refresh(session)
        return session

    @staticmethod
    def delete_session(db: Session, session_id: str, user_id: str) -> None:
        session = ChatService.get_session(db, session_id, user_id)
        db.delete(session)
        db.commit()
        logger.info(f"Deleted chat session {session_id}")

    @staticmethod
    def get_session(db: Session, session_id: str, user_id: str) -> ChatSession:
        try:
            sid = uuid.UUID(session_id)
        except (ValueError, AttributeError):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid session ID")

        session = (
            db.query(ChatSession)
            .filter(ChatSession.id == sid, ChatSession.user_id == uuid.UUID(user_id))
            .first()
        )
        if not session:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
        return session

    @staticmethod
    def send_message(
        db: Session,
        session_id: str,
        user_id: str,
        farm_id: str,
        message: str,
    ) -> Tuple[ChatMessage, ChatMessage, List[str], str]:
        session = ChatService.get_session(db, session_id, user_id)

        # Auto-title from first user message
        if not session.title:
            session.title = message[:60] + ("…" if len(message) > 60 else "")
            db.add(session)

        # Build conversation history from previous messages (last 20 = 10 turns)
        history = [
            {"role": msg.role, "content": msg.content}
            for msg in session.messages[-20:]
        ]

        # Save user message first (flush to get ID without committing)
        user_msg = ChatMessage(
            session_id=session.id,
            role="user",
            content=message,
        )
        db.add(user_msg)
        db.flush()

        # Build farm context for grounding
        farm, crop = AssistantService.get_farm_context(db, farm_id)
        weather = AssistantService.get_weather_context(db, farm_id)
        irrigation = AssistantService.get_irrigation_context(db, farm_id)
        disease = AssistantService.get_disease_context(db, farm_id)

        context = AssistantService.build_context(farm, crop, weather, irrigation, disease)
        system_prompt = AssistantService.SYSTEM_PROMPT.format(context=context)
        data_references = AssistantService.build_data_references(farm, crop, weather, irrigation, disease)
        sources = AssistantService.determine_sources(data_references)
        confidence = AssistantService.calculate_confidence(
            weather is not None,
            irrigation is not None,
            disease is not None,
        )

        # Call LLM with history for multi-turn context
        try:
            response_text, _ = LLMProvider.complete(
                system_prompt=system_prompt,
                user_message=message,
                max_tokens=1000,
                history=history,
            )
        except Exception as e:
            logger.error(f"LLM call failed in session {session_id}: {e}")
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="AI service unavailable",
            )

        # Save assistant response
        assistant_msg = ChatMessage(
            session_id=session.id,
            role="assistant",
            content=response_text,
            citations_json={"sources": sources, "confidence": confidence},
        )
        db.add(assistant_msg)

        # Bump session updated_at so it sorts to top
        session.updated_at = datetime.utcnow()
        db.add(session)

        db.commit()
        db.refresh(user_msg)
        db.refresh(assistant_msg)

        logger.info(f"Session {session_id}: saved user + assistant messages")
        return user_msg, assistant_msg, sources, confidence
