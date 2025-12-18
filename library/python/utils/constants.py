API_VERSION = "2025-09-29"
USER_AGENT = "CheckoutSpecTest/1.0"
DEFAULT_LANGUAGE = "en-us"
API_TIMEOUT = 30
PAYMENT_PROVIDER = ""
CONTENT_TYPE_JSON = "application/json"
 
HEADER_KEY_API_VERSION = "API-Version"
HEADER_KEY_ACCEPT_LANGUAGE = "Accept-Language"
HEADER_KEY_TIMESTAMP = "Timestamp"
HEADER_KEY_SIGNATURE = "Signature"
HEADER_KEY_REQUEST_ID = "Request-Id"
HEADER_KEY_CONTENT_TYPE = "Content-Type"
HEADER_KEY_IDEMPOTENCY_KEY = "Idempotency-Key"
HEADER_KEY_USER_AGENT = "User-Agent"

REST_METHOD_POST = "POST"
REST_METHOD_GET = "GET"

CHECKOUT_INITIALIZE_PATH = "/checkout_sessions"
CHECKOUT_UPDATE_PATH = "/checkout_sessions/{checkout_session_id}"
CHECKOUT_GET_PATH = "/checkout_sessions/{checkout_session_id}"
CHECKOUT_COMPLETE_PATH = "/checkout_sessions/{checkout_session_id}/complete"
CHECKOUT_CANCEL_PATH = "/checkout_sessions/{checkout_session_id}/cancel"

DELEGATE_PAYMENT_PATH = "/delegated_payments"