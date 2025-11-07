from decimal import Decimal
from enum import StrEnum
from pydantic import BaseModel, field_validator

from utils.enums import CountryCode


class ErrorResponseType(StrEnum):
    INVALID_REQUEST = "invalid_request"
    REQUEST_NOT_IDEMPOTENT = "request_not_idempotent"
    PROCESSING_ERROR = "processing_error"
    SERVICE_UNAVAILABLE = "service_unavailable"

class CoreAPIModel(BaseModel):
    class Config:
        json_encoders = {Decimal: lambda d: str(d)}

class ErrorResponse(CoreAPIModel):
    type: ErrorResponseType
    code: str
    message: str
    param: str | None = None
    
class Address(CoreAPIModel):
    name: str
    line_one: str
    line_two: str | None = None
    city: str
    state: str
    country: CountryCode
    postal_code: str
    phone_number: str | None = None

    @field_validator("country", mode="before")
    def _convert_country(cls, value: str | CountryCode) -> CountryCode:
        if isinstance(value, CountryCode):
            return value
        return CountryCode(value.upper())