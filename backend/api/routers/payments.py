from typing import Any

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from backend.api.dependencies import get_current_user, get_db_session
from backend.api.schemas import MockPaymentRequest, MockPaymentResponse
from backend.database.models import User
from backend.services import payments as payments_service

router = APIRouter(prefix="/api/payments", tags=["payments"])


@router.post("/mock-pay", response_model=MockPaymentResponse)
async def mock_payment(
    payload: MockPaymentRequest,
    session: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
) -> dict[str, Any]:
    return await payments_service.mock_pay_order(
        session=session,
        user=current_user,
        order_id=payload.order_id,
    )
