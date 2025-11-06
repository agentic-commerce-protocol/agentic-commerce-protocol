from client.checkout_client import CheckoutClient
from models.delegate_payment_models import DelegatePaymentResponse, DelegatePaymentErrorResponse
from fixtures import get_delegate_payment_payload
import uuid
import pytest

@pytest.mark.asyncio
async def test_delegated_payment():
    client = CheckoutClient()
    payload = get_delegate_payment_payload().model_dump()
    status, data, _ = await client.delegated_payment(payload=payload, idem_key=str(uuid.uuid4()))
    assert status == 201
    DelegatePaymentResponse.model_validate(data)

@pytest.mark.asyncio
async def test_delegated_payment_missing_card_number_type():
    client = CheckoutClient()
    payload = get_delegate_payment_payload().model_dump()
    payload["payment_method"]["card_number_type"] = None
    status, data, _ = await client.delegated_payment(payload=payload, idem_key=str(uuid.uuid4()))
    assert status == 400
    DelegatePaymentErrorResponse.model_validate(data)
