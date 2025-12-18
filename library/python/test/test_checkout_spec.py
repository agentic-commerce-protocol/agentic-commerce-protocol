from client.checkout_client import CheckoutClient
from models.checkout_models import (
    CartInitializeResponse,
    CartUpdateResponse,
    CartCompleteResponse,
    CartCompleteRequest,
    PaymentData,
)
from fixtures import get_cart_initialize_payload, get_address_payload, get_buyer_payload, get_cart_update_payload
import uuid
import pytest
from merchant.merchant_constants import TEST_PAYMENT_TOKEN_1, ITEM_LISTING_ID_OUT_OF_STOCK
from utils.constants import PAYMENT_PROVIDER

@pytest.mark.asyncio
async def test_checkout_session_create():
    client = CheckoutClient()
    cartInitializePayload = get_cart_initialize_payload()
    status, data, headers = await client.create_session(payload=cartInitializePayload.model_dump(), idem_key=str(uuid.uuid4()))
    assert status == 201
    assert headers.get('Content-Type', '').startswith('application/json')
    CartInitializeResponse.model_validate(data)
    
@pytest.mark.asyncio
async def test_checkout_session_create_no_fulfillment_address():
    client = CheckoutClient()
    cartInitializePayload = get_cart_initialize_payload(fulfillment_address=None)
    status, data, headers = await client.create_session(payload=cartInitializePayload.model_dump(), idem_key=str(uuid.uuid4()))
    assert status == 201
    assert headers.get('Content-Type', '').startswith('application/json')
    CartInitializeResponse.model_validate(data)

@pytest.mark.asyncio
async def test_checkout_session_update():
    client = CheckoutClient()
    cartInitializePayload = get_cart_initialize_payload()
    status, data, _ = await client.create_session(payload=cartInitializePayload.model_dump(), idem_key=str(uuid.uuid4()))
    cartInitializeResponse = CartInitializeResponse.model_validate(data)
    session_id = cartInitializeResponse.id
    # Update
    cartUpdatePayload = get_cart_update_payload()
    status, data, _ = await client.update_session(session_id, cartUpdatePayload.model_dump(), idem_key=str(uuid.uuid4()))
    assert status == 200
    CartUpdateResponse.model_validate(data)


@pytest.mark.asyncio
async def test_checkout_session_complete():
    client = CheckoutClient()
    cartInitializePayload = get_cart_initialize_payload()
    status, data, _ = await client.create_session(cartInitializePayload.model_dump(), idem_key=str(uuid.uuid4()))
    cartInitializeResponse = CartInitializeResponse.model_validate(data)
    session_id = cartInitializeResponse.id
    # Complete
    cartCompleteRequest = CartCompleteRequest(
        buyer=get_buyer_payload(),
        payment_data=PaymentData(
            token=TEST_PAYMENT_TOKEN_1,
            provider=PAYMENT_PROVIDER,
            billing_address= get_address_payload()
        )
    )
    status, data, _ = await client.complete_session(session_id=session_id, payload=cartCompleteRequest.model_dump(), idem_key=str(uuid.uuid4()))
    assert status == 200
    CartCompleteResponse.model_validate(data)

@pytest.mark.asyncio
async def test_checkout_multiple_updates():
    client = CheckoutClient()
    cartInitializePayload = get_cart_initialize_payload()
    status, data, _ = await client.create_session(cartInitializePayload.model_dump(), idem_key=str(uuid.uuid4()))
    cartInitializeResponse = CartInitializeResponse.model_validate(data)
    session_id = cartInitializeResponse.id
    # Update
    cartUpdatePayload = get_cart_update_payload(item_quantity=2)
    status, data, _ = await client.update_session(session_id, cartUpdatePayload.model_dump(), idem_key=str(uuid.uuid4()))
    assert status == 200
    CartUpdateResponse.model_validate(data)
    # Update again
    cartUpdatePayload.items[0].quantity = 3
    status, data, _ = await client.update_session(session_id, cartUpdatePayload.model_dump(), idem_key=str(uuid.uuid4()))
    assert status == 200
    CartUpdateResponse.model_validate(data)
    # Update again
    cartUpdatePayload.items[0].quantity = 1
    status, data, _ = await client.update_session(session_id, cartUpdatePayload.model_dump(), idem_key=str(uuid.uuid4()))
    assert status == 200
    CartUpdateResponse.model_validate(data)

@pytest.mark.asyncio
async def test_inventory_validation_out_of_stock_on_create():
    client = CheckoutClient()
    # Try more items than in stock, expect error message (requires backend impl):
    cartInitializePayload = get_cart_initialize_payload(item_listing_id=ITEM_LISTING_ID_OUT_OF_STOCK, item_quantity=1)
    status, data, _ = await client.create_session(cartInitializePayload.model_dump(), idem_key=str(uuid.uuid4()))
    assert status == 201
    CartInitializeResponse.model_validate(data)
    assert data.get("messages") is not None
    assert data.get("messages")[0].get("type") == "error"
    assert data.get("messages")[0].get("code") == "out_of_stock"
    assert data.get("messages")[0].get("content_type") == "plain"
    assert data.get("messages")[0].get("content") == "This item is out of stock"