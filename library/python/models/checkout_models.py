from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from enum import StrEnum
from typing import Any

from pydantic import Field, field_validator, model_validator

from utils.enums import CurrencyCode
from models.common import Address, CoreAPIModel, ErrorResponse


class PaymentProviderType(StrEnum):
    STRIPE = "stripe"


class PaymentMethodType(StrEnum):
    CARD = "card"


class CartStatus(StrEnum):
    NOT_READY_FOR_PAYMENT = "not_ready_for_payment"
    READY_FOR_PAYMENT = "ready_for_payment"
    COMPLETED = "completed"
    CANCELED = "canceled"


class TotalType(StrEnum):
    ITEMS_BASE_AMOUNT = "items_base_amount"
    ITEMS_DISCOUNT = "items_discount"
    SUBTOTAL = "subtotal"
    DISCOUNT = "discount"
    FULFILLMENT = "fulfillment"
    TAX = "tax"
    FEE = "fee"
    TIP = "tip"
    TOTAL = "total"


class MessageType(StrEnum):
    INFO = "info"
    ERROR = "error"


class MessageContentType(StrEnum):
    PLAIN = "plain"
    MARKDOWN = "markdown"


class MessageErrorCode(StrEnum):
    MISSING = "missing"
    INVALID = "invalid"
    OUT_OF_STOCK = "out_of_stock"
    PAYMENT_DECLINED = "payment_declined"
    REQUIRES_SIGN_IN = "requires_sign_in"
    REQUIRES_3DS = "requires_3ds"


class LinkType(StrEnum):
    TERMS_OF_USE = "terms_of_use"
    PRIVACY_POLICY = "privacy_policy"
    SELLER_SHOP_POLICIES = "seller_shop_policies"
    PRODUCT_LINK = "product_link"
    RETURN_POLICY = "return_policy"


class FulfillmentOptionType(StrEnum):
    SHIPPING = "shipping"
    DIGITAL = "digital"


class TargetType(StrEnum):
    BUYER_FIRST_NAME = "buyer_first_name"
    BUYER_LAST_NAME = "buyer_last_name"
    BUYER_EMAIL = "buyer_email"
    BUYER_PHONE_NUMBER = "buyer_phone_number"
    SHIPPING_ADDRESS = "shipping_address"
    SHIPPING_ADDRESS_LINE_ONE = "shipping_address_line_one"
    SHIPPING_ADDRESS_LINE_TWO = "shipping_address_line_two"
    SHIPPING_ADDRESS_CITY = "shipping_address_city"
    SHIPPING_ADDRESS_STATE = "shipping_address_state"
    SHIPPING_ADDRESS_COUNTRY = "shipping_address_country"
    SHIPPING_ADDRESS_POST_CODE = "shipping_address_post_code"
    BILLING_ADDRESS = "billing_address"
    BILLING_ADDRESS_LINE_ONE = "billing_address_line_one"
    BILLING_ADDRESS_LINE_TWO = "billing_address_line_two"
    BILLING_ADDRESS_CITY = "billing_address_city"
    BILLING_ADDRESS_STATE = "billing_address_state"
    BILLING_ADDRESS_COUNTRY = "billing_address_country"
    BILLING_ADDRESS_POST_CODE = "billing_address_post_code"
    CART_ITEM = "cart_item"
    CART = "cart"
    SHIPPING_OPTION = "shipping_option"
    PAYMENT_METHOD = "payment_method"


class Buyer(CoreAPIModel):
    name: str | None = None
    email: str
    phone_number: str | None = None


class Item(CoreAPIModel):
    id: str
    quantity: int


class PaymentProvider(CoreAPIModel):
    merchant_id: str | None = None
    provider: PaymentProviderType
    supported_payment_methods: list[PaymentMethodType] = Field(default_factory=list)

    @field_validator("provider", mode="before")
    def _convert_provider(cls, value: str | PaymentProviderType) -> PaymentProviderType:
        if isinstance(value, PaymentProviderType):
            return value
        normalized = value.lower()
        try:
            return PaymentProviderType(normalized)
        except ValueError:
            # Fallback for legacy payloads that provided a payment method instead of a provider.
            return PaymentProviderType.STRIPE

    @field_validator("supported_payment_methods", mode="before")
    def _convert_methods(
        cls, value: list[str] | list[PaymentMethodType]
    ) -> list[PaymentMethodType]:
        return [
            item if isinstance(item, PaymentMethodType) else PaymentMethodType(item.lower())
            for item in value or []
        ]


class Message(CoreAPIModel):
    type: MessageType
    content_type: MessageContentType
    content: str
    code: MessageErrorCode | None = None
    path: str | None = None

    @field_validator("type", mode="before")
    def _convert_type(cls, value: str | MessageType) -> MessageType:
        if isinstance(value, MessageType):
            return value
        return MessageType(value)

    @field_validator("content_type", mode="before")
    def _convert_content_type(cls, value: str | MessageContentType) -> MessageContentType:
        if isinstance(value, MessageContentType):
            return value
        return MessageContentType(value)

    @field_validator("code", mode="before")
    def _convert_code(cls, value: str | MessageErrorCode | None) -> MessageErrorCode | None:
        if value is None or isinstance(value, MessageErrorCode):
            return value
        return MessageErrorCode(value)


class Link(CoreAPIModel):
    type: LinkType
    value: str = Field(alias="url")

    @field_validator("type", mode="before")
    def _convert_type(cls, value: str | LinkType) -> LinkType:
        if isinstance(value, LinkType):
            return value
        return LinkType(value)


class ItemSummary(CoreAPIModel):
    id: str
    quantity: int


class LineItem(CoreAPIModel):
    id: str
    item: ItemSummary
    base_amount: Decimal
    discount: Decimal
    subtotal: Decimal
    tax: Decimal
    total: Decimal

    @field_validator("base_amount", "discount", "subtotal", "tax", "total", mode="before")
    def _convert_decimal(cls, value: Decimal | str) -> Decimal:
        if isinstance(value, Decimal):
            return value
        return Decimal(value)


class Total(CoreAPIModel):
    type: TotalType
    display_text: str
    amount: Decimal

    @field_validator("type", mode="before")
    def _convert_type(cls, value: str | TotalType) -> TotalType:
        if isinstance(value, TotalType):
            return value
        return TotalType(value)

    @field_validator("amount", mode="before")
    def _convert_decimal(cls, value: Decimal | str) -> Decimal:
        if isinstance(value, Decimal):
            return value
        return Decimal(value)


class FulfillmentOption(CoreAPIModel):
    type: FulfillmentOptionType
    id: str
    title: str
    subtitle: str | None = None
    carrier: str | None = None
    earliest_delivery_time: datetime | None = None
    latest_delivery_time: datetime | None = None
    subtotal: Decimal
    tax: Decimal
    total: Decimal

    @model_validator(mode="before")
    def _rename_carrier(cls, data: dict[str, Any]) -> dict[str, Any]:
        if "carrier" not in data and "carrier_info" in data:
            data["carrier"] = data.pop("carrier_info")
        return data

    @field_validator("type", mode="before")
    def _convert_type(cls, value: str | FulfillmentOptionType) -> FulfillmentOptionType:
        if isinstance(value, FulfillmentOptionType):
            return value
        return FulfillmentOptionType(value)

    @field_validator("subtotal", "tax", "total", mode="before")
    def _convert_decimal(cls, value: Decimal | str) -> Decimal:
        if isinstance(value, Decimal):
            return value
        return Decimal(value)


class ShippingOption(FulfillmentOption):
    @field_validator("type", mode="before")
    def _ensure_shipping(cls, value: str | FulfillmentOptionType) -> FulfillmentOptionType:
        option_type = (
            value if isinstance(value, FulfillmentOptionType) else FulfillmentOptionType(value)
        )
        return option_type


class Target(CoreAPIModel):
    id: str | None = None
    type: TargetType


class CartError(CoreAPIModel):
    code: MessageErrorCode
    content: str
    content_type: MessageContentType
    path: str | None = None

    @property
    def type(self) -> MessageErrorCode:
        return self.code

    @property
    def text(self) -> str:
        return self.content

    @property
    def target(self) -> Target:
        return Target(type=_target_type_from_path(self.path))

    @property
    def is_recoverable(self) -> bool:
        return True

    @classmethod
    def from_message(cls, message: Message) -> CartError:
        if message.code is None:
            raise ValueError("Error messages must include a code.")
        return cls(
            code=message.code,
            content=message.content,
            content_type=message.content_type,
            path=message.path,
        )


class Cart(CoreAPIModel):
    id: str
    buyer: Buyer | None = None
    status: CartStatus
    currency: CurrencyCode
    line_items: list[LineItem] = Field(default_factory=list)
    fulfillment_address: Address | None = None
    fulfillment_options: list[FulfillmentOption] = Field(default_factory=list)
    fulfillment_option_id: str | None = None
    totals: list[Total] = Field(default_factory=list)
    messages: list[Message] = Field(default_factory=list)
    links: list[Link] = Field(default_factory=list)

    @field_validator("status", mode="before")
    def _convert_status(cls, value: str | CartStatus) -> CartStatus:
        if isinstance(value, CartStatus):
            return value
        return CartStatus(value.lower())

    @field_validator("currency", mode="before")
    def _convert_currency(cls, value: str | CurrencyCode) -> CurrencyCode:
        if isinstance(value, CurrencyCode):
            return value
        return CurrencyCode(value.upper())

    @property
    def shipping_address(self) -> Address | None:
        return self.fulfillment_address

    @property
    def shipping_options(self) -> list[ShippingOption]:
        shipping_options: list[ShippingOption] = []
        for option in self.fulfillment_options:
            if option.type == FulfillmentOptionType.SHIPPING:
                shipping_options.append(ShippingOption(**option.dict()))
        return shipping_options

    @property
    def shipping_option_id(self) -> str | None:
        return self.fulfillment_option_id


class CartInitializeResponse(Cart):
    payment_provider: PaymentProvider

    @property
    def errors(self) -> list[CartError]:
        return [
            CartError.from_message(message)
            for message in self.messages
            if message.type == MessageType.ERROR
        ]


class CartUpdateResponse(Cart):
    @property
    def errors(self) -> list[CartError]:
        return [
            CartError.from_message(message)
            for message in self.messages
            if message.type == MessageType.ERROR
        ]


class Order(CoreAPIModel):
    id: str
    checkout_session_id: str
    permalink_url: str


class CartCompleteResponse(Cart):
    order: Order | None = None

    @property
    def errors(self) -> list[CartError]:
        return [
            CartError.from_message(message)
            for message in self.messages
            if message.type == MessageType.ERROR
        ]


class PaymentData(CoreAPIModel):
    token: str
    provider: PaymentProviderType
    billing_address: Address | None = None

    class Config:
        allow_population_by_field_name = True

    @field_validator("provider", mode="before")
    def _convert_provider(cls, value: str | PaymentProviderType) -> PaymentProviderType:
        if isinstance(value, PaymentProviderType):
            return value
        normalized = value.lower()
        try:
            return PaymentProviderType(normalized)
        except ValueError:
            return PaymentProviderType.STRIPE


class CartInitializeRequest(CoreAPIModel):
    buyer: Buyer | None = None
    items: list[Item]
    fulfillment_address: Address | None = None

    @property
    def shipping_address(self) -> Address | None:
        return self.fulfillment_address

    @shipping_address.setter
    def shipping_address(self, value: Address | None) -> None:
        self.fulfillment_address = value


class CartUpdateRequest(CoreAPIModel):
    buyer: Buyer | None = None
    items: list[Item] | None = None
    fulfillment_address: Address | None = None
    fulfillment_option_id: str | None = None

    @property
    def shipping_address(self) -> Address | None:
        return self.fulfillment_address

    @shipping_address.setter
    def shipping_address(self, value: Address | None) -> None:
        self.fulfillment_address = value

    @property
    def shipping_option_id(self) -> str | None:
        return self.fulfillment_option_id

    @shipping_option_id.setter
    def shipping_option_id(self, value: str | None) -> None:
        self.fulfillment_option_id = value


class CartCompleteRequest(CoreAPIModel):
    buyer: Buyer | None = None
    payment_data: PaymentData

    @property
    def payment_method(self) -> PaymentData:
        return self.payment_data

    @payment_method.setter
    def payment_method(self, value: PaymentData) -> None:
        self.payment_data = value


class CheckoutErrorResponse(ErrorResponse):
    pass


def _target_type_from_path(path: str | None) -> TargetType:
    if not path:
        return TargetType.CART
    normalized = path.lower()
    if normalized.startswith("$.buyer.first_name"):
        return TargetType.BUYER_FIRST_NAME
    if normalized.startswith("$.buyer.last_name"):
        return TargetType.BUYER_LAST_NAME
    if normalized.startswith("$.buyer.email"):
        return TargetType.BUYER_EMAIL
    if normalized.startswith("$.buyer.phone_number"):
        return TargetType.BUYER_PHONE_NUMBER
    if normalized.startswith("$.fulfillment_address.line_one"):
        return TargetType.SHIPPING_ADDRESS_LINE_ONE
    if normalized.startswith("$.fulfillment_address.line_two"):
        return TargetType.SHIPPING_ADDRESS_LINE_TWO
    if normalized.startswith("$.fulfillment_address.city"):
        return TargetType.SHIPPING_ADDRESS_CITY
    if normalized.startswith("$.fulfillment_address.state"):
        return TargetType.SHIPPING_ADDRESS_STATE
    if normalized.startswith("$.fulfillment_address.country"):
        return TargetType.SHIPPING_ADDRESS_COUNTRY
    if normalized.startswith("$.fulfillment_address.postal_code"):
        return TargetType.SHIPPING_ADDRESS_POST_CODE
    if normalized.startswith("$.fulfillment_address"):
        return TargetType.SHIPPING_ADDRESS
    if normalized.startswith("$.payment_data.billing_address.line_one"):
        return TargetType.BILLING_ADDRESS_LINE_ONE
    if normalized.startswith("$.payment_data.billing_address.line_two"):
        return TargetType.BILLING_ADDRESS_LINE_TWO
    if normalized.startswith("$.payment_data.billing_address.city"):
        return TargetType.BILLING_ADDRESS_CITY
    if normalized.startswith("$.payment_data.billing_address.state"):
        return TargetType.BILLING_ADDRESS_STATE
    if normalized.startswith("$.payment_data.billing_address.country"):
        return TargetType.BILLING_ADDRESS_COUNTRY
    if normalized.startswith("$.payment_data.billing_address.postal_code"):
        return TargetType.BILLING_ADDRESS_POST_CODE
    if normalized.startswith("$.payment_data.billing_address"):
        return TargetType.BILLING_ADDRESS
    if normalized.startswith("$.payment_data"):
        return TargetType.PAYMENT_METHOD
    if normalized.startswith(("$.line_items", "$.items")):
        return TargetType.CART_ITEM
    if normalized.startswith("$.fulfillment_option_id"):
        return TargetType.SHIPPING_OPTION
    if normalized.startswith("$.fulfillment_options"):
        return TargetType.SHIPPING_OPTION
    return TargetType.CART
