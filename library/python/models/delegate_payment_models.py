from enum import StrEnum
from typing import Any

from pydantic import Field

from models.common import Address, CoreAPIModel


class PaymentMethodType(StrEnum):
    CARD = "card"


class CardNumberType(StrEnum):
    FPAN = "fpan"
    NETWORK_TOKEN = "network_token"


class DisplayCardType(StrEnum):
    CREDIT = "credit"
    DEBIT = "debit"
    PREPAID = "prepaid"


class AllowanceReason(StrEnum):
    ONE_TIME = "one_time"


class RiskSignalType(StrEnum):
    CARD_TESTING = "card_testing"


class RiskAction(StrEnum):
    BLOCKED = "blocked"
    MANUAL_REVIEW = "manual_review"
    AUTHORIZED = "authorized"


class ErrorResponseType(StrEnum):
    INVALID_REQUEST = "invalid_request"
    RATE_LIMIT_EXCEEDED = "rate_limit_exceeded"
    PROCESSING_ERROR = "processing_error"
    SERVICE_UNAVAILABLE = "service_unavailable"


class PaymentMethod(CoreAPIModel):
    type: PaymentMethodType
    card_number_type: CardNumberType
    virtual: bool
    number: str
    exp_month: str | None = Field(None, max_length=2)
    exp_year: str | None = Field(None, max_length=4)
    name: str | None = None
    cvc: str | None = Field(None, max_length=4)
    checks_performed: list[str] | None = Field(default_factory=list)
    iin: str | None = Field(None, max_length=6)
    display_card_type: DisplayCardType
    display_wallet_type: str | None = None
    display_brand: str | None = None
    display_last4: str | None = Field(None, max_length=4)
    metadata: dict[str, Any] = Field(default_factory=dict)


class Allowance(CoreAPIModel):
    reason: AllowanceReason
    max_amount: int
    currency: str
    checkout_session_id: str
    merchant_id: str = Field(..., max_length=256)
    expires_at: str  # RFC 3339 string


class RiskSignal(CoreAPIModel):
    type: RiskSignalType
    score: int
    action: RiskAction


class DelegatePaymentRequest(CoreAPIModel):
    payment_method: PaymentMethod | None = None
    payment_method_encrypted: str | None = None
    allowance: Allowance
    billing_address: Address | None = None
    risk_signals: list[RiskSignal]
    metadata: dict[str, Any] = Field(default_factory=dict)


class DelegatePaymentResponse(CoreAPIModel):
    id: str
    created_at: str  # RFC 3339
    metadata: dict[str, Any] = Field(default_factory=dict)


class DelegatePaymentError(CoreAPIModel):
    type: ErrorResponseType
    code: str
    message: str
    param: str | None = None


class DelegatePaymentErrorResponse(CoreAPIModel):
    error: DelegatePaymentError
