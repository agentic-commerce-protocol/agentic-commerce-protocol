import json 
import hmac
import base64
import hashlib
from datetime import datetime, UTC
import uuid
from typing import Any, Dict, Optional, Tuple
from urllib.parse import urljoin
import aiohttp
from merchant.merchant_headers import CustomHeaders
from utils.constants import (
    API_VERSION,
    REST_METHOD_POST,
    REST_METHOD_GET,
    USER_AGENT,
    DEFAULT_LANGUAGE, 
    API_TIMEOUT, 
    CHECKOUT_INITIALIZE_PATH, 
    CHECKOUT_UPDATE_PATH, 
    CHECKOUT_GET_PATH, 
    CHECKOUT_COMPLETE_PATH, 
    DELEGATE_PAYMENT_PATH,
    HEADER_KEY_API_VERSION,
    HEADER_KEY_ACCEPT_LANGUAGE,
    HEADER_KEY_TIMESTAMP,
    HEADER_KEY_SIGNATURE,
    HEADER_KEY_REQUEST_ID,
    HEADER_KEY_IDEMPOTENCY_KEY,
    HEADER_KEY_USER_AGENT,
    HEADER_KEY_CONTENT_TYPE,
    CONTENT_TYPE_JSON,
)
from merchant.merchant_constants import CHECKOUT_BASE_URL, PAYMENT_BASE_URL, PRIVATE_KEY

class CheckoutClient:
    
    def _headers(self, body: Optional[Dict[str, Any]], idem_key: Optional[str] = None, omit: Optional[list] = None, overrides: Optional[dict] = None, ts_offset: Optional[int] = None) -> Dict[str, str]:
        request_id = str(uuid.uuid4())
        date_time_now = datetime.now(UTC)
        timestamp = date_time_now.isoformat().replace("+00:00", "Z")

        to_sign = timestamp.encode() + json.dumps(body or {}).encode()
        signature = hmac.new(base64.b64decode(PRIVATE_KEY), to_sign, hashlib.sha256).digest()
        headers = {
            HEADER_KEY_API_VERSION: API_VERSION,
            HEADER_KEY_ACCEPT_LANGUAGE: DEFAULT_LANGUAGE,
            HEADER_KEY_TIMESTAMP: timestamp,
            HEADER_KEY_SIGNATURE: base64.b64encode(signature).decode(),
            HEADER_KEY_REQUEST_ID: request_id,
            HEADER_KEY_IDEMPOTENCY_KEY: "",
            HEADER_KEY_USER_AGENT: USER_AGENT,
            HEADER_KEY_CONTENT_TYPE: CONTENT_TYPE_JSON,
        }

        if idem_key:
            headers[HEADER_KEY_IDEMPOTENCY_KEY] = idem_key

        headers.update(CustomHeaders().generate())

        if omit:
            for k in omit:
                headers.pop(k, None)
        if overrides:
            headers.update(overrides)

        return headers
    
    async def _request(self, method: str, path: str, body: Optional[Dict[str, Any]], idem_key: Optional[str] = None, omit: Optional[list] = None, overrides: Optional[dict] = None, ts_offset: Optional[int] = None) -> Tuple[int, Dict[str, Any], Dict[str, str]]:
        url = path if path.startswith("http") else urljoin(CHECKOUT_BASE_URL.rstrip('/') + '/', path.lstrip('/'))
        headers = self._headers(body, idem_key=idem_key, omit=omit, overrides=overrides, ts_offset=ts_offset)
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=API_TIMEOUT)) as session:
            async with session.request(method, url, json=body, headers=headers) as resp:
                try:
                    data = await resp.json()
                except Exception:
                    data = await resp.text()
                return resp.status, data, dict(resp.headers)
    
    async def create_session(self, payload: Dict[str, Any], idem_key: Optional[str] = None, omit: Optional[list] = None, overrides: Optional[dict] = None, ts_offset: Optional[int] = None):
        return await self._request(REST_METHOD_POST, CHECKOUT_INITIALIZE_PATH, payload, idem_key=idem_key, omit=omit, overrides=overrides, ts_offset=ts_offset)
    
    async def update_session(self, session_id: str, payload: Dict[str, Any], idem_key: Optional[str] = None, omit: Optional[list] = None, overrides: Optional[dict] = None, ts_offset: Optional[int] = None):
        return await self._request(REST_METHOD_POST, CHECKOUT_UPDATE_PATH.format(checkout_session_id=session_id), payload, idem_key=idem_key, omit=omit, overrides=overrides, ts_offset=ts_offset)
    
    async def get_session(self, session_id: str, omit: Optional[list] = None, overrides: Optional[dict] = None, ts_offset: Optional[int] = None):
        return await self._request(REST_METHOD_GET, CHECKOUT_GET_PATH.format(checkout_session_id=session_id), None, idem_key=None, omit=omit, overrides=overrides, ts_offset=ts_offset)
    
    async def complete_session(self, session_id: str, payload: Optional[Dict[str, Any]] = None, idem_key: Optional[str] = None, omit: Optional[list] = None, overrides: Optional[dict] = None, ts_offset: Optional[int] = None):
        return await self._request(REST_METHOD_POST, CHECKOUT_COMPLETE_PATH.format(checkout_session_id=session_id), payload or {}, idem_key=idem_key, omit=omit, overrides=overrides, ts_offset=ts_offset)

    async def delegated_payment(self, payload: Dict[str, Any], idem_key: Optional[str] = None, omit: Optional[list] = None, overrides: Optional[dict] = None, ts_offset: Optional[int] = None):
        return await self._request(
            REST_METHOD_POST,
            PAYMENT_BASE_URL + DELEGATE_PAYMENT_PATH,
            payload,
            idem_key=idem_key,
            omit=omit,
            overrides=overrides,
            ts_offset=ts_offset,
        )
