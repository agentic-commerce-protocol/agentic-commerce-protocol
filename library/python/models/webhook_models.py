from decimal import Decimal
from enum import StrEnum

from pydantic import BaseModel, Field


class CoreAPIModel(BaseModel):
    class Config:
        json_encoders = {Decimal: lambda d: str(d)}


class WebhookEventType(StrEnum):
    ORDER_CREATE = "order_create"
    ORDER_UPDATE = "order_update"


class EventDataType(StrEnum):
    ORDER = "order"


class OrderStatus(StrEnum):
    CREATED = "created"
    MANUAL_REVIEW = "manual_review"
    CONFIRMED = "confirmed"
    CANCELED = "canceled"
    SHIPPED = "shipped"
    FULFILLED = "fulfilled"


class RefundType(StrEnum):
    STORE_CREDIT = "store_credit"
    ORIGINAL_PAYMENT = "original_payment"


class Refund(CoreAPIModel):
    type: RefundType
    amount: str


class EventData(CoreAPIModel):
    type: EventDataType
    checkout_session_id: str
    permalink_url: str
    status: OrderStatus
    refunds: list[Refund] = Field(default_factory=list)


class WebhookPayload(CoreAPIModel):
    type: WebhookEventType
    data: EventData
