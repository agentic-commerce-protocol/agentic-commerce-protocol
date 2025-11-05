from models.checkout_models import (
    CartInitializeRequest, 
    Item, 
    Address, 
    Buyer,
    CartUpdateRequest,
)
from utils.enums import CountryCode
from merchant.merchant_constants import ITEM_LISTING_ID
from models.delegate_payment_models import (
        DelegatePaymentRequest, PaymentMethod, CardNumberType, PaymentMethodType,
        Allowance, AllowanceReason, RiskSignal, RiskSignalType, RiskAction, DisplayCardType
    )

def get_address_payload():
    return Address(
        name="John Doe",
        line_one="123 Main St",
        line_two="",
        city="San Francisco",
        state="CA",
        country=CountryCode.US,
        postal_code="94101")

def get_buyer_payload():
    return Buyer(
        name="John Doe",
        email="john.doe@example.com",
        phone_number="1234567890"
    )

def get_cart_initialize_payload(item_quantity=1, item_listing_id=ITEM_LISTING_ID, fulfillment_address=get_address_payload()): 
    return CartInitializeRequest(
        items=[Item(id=item_listing_id, quantity=item_quantity)],
        fulfillment_address=fulfillment_address 
    )

def get_cart_update_payload(item_quantity=2, item_listing_id=ITEM_LISTING_ID, fulfillment_option_id="1234567890"):
    return CartUpdateRequest(
        items=[Item(id=item_listing_id, quantity=item_quantity)],
        fulfillment_address=get_address_payload(),
        fulfillment_option_id=fulfillment_option_id
    )

def get_invalid_currency_payload():
    p = get_cart_initialize_payload()
    p.currency = "eur"  # Invalid per USD-only
    return p

def get_quantity_payload(quantity):
    return get_cart_initialize_payload(quantity=quantity)

def get_incomplete_address_payload():
    p = get_cart_initialize_payload()
    p.fulfillment_address.postal_code = ""
    return p

def get_update_payload(listing_id=ITEM_LISTING_ID, quantity=2):
    p = get_cart_initialize_payload(listing_id=listing_id)
    p.items[0].quantity = quantity
    return p

def get_payment_payload(method="card"):
    # Placeholder – should match CartCompleteRequest expectations
    return {"payment_method": method, "credential": "test-credential"}

def get_delegate_payment_payload():
    """
    Returns a dummy payload matching DelegatePaymentRequest for delegated_payment endpoint.
    """
    payment_method = PaymentMethod(
        type=PaymentMethodType.CARD,
        card_number_type=CardNumberType.FPAN,
        virtual=False,
        number="eyJrdHkiOiJSU0EiLCJlbmMiOiJBMTI4Q0JDLUhTMjU2IiwiYWxnIjoiUlNBLU9BRVAiLCJ4NXQiOiJSS284M2R2SGdpdXhyeXgtSDNpZThQQXpRaFE9IiwieDVjIjpbIk1JSUdwakNDQlk2Z0F3SUJBZ0lNZEFEb0RXcjRcL0tnXC9ZXC9yQk1BMEdDU3FHU0liM0RRRUJDd1VBTUZBeEN6QUpCZ05WQkFZVEFrSkZNUmt3RndZRFZRUUtFeEJIYkc5aVlXeFRhV2R1SUc1MkxYTmhNU1l3SkFZRFZRUURFeDFIYkc5aVlXeFRhV2R1SUZKVFFTQlBWaUJUVTB3Z1EwRWdNakF4T0RBZUZ3MHlOVEExTWpjeE1ERXhNelphRncweU5qQTJNamd4TURFeE16VmFNSFl4Q3pBSkJnTlZCQVlUQWxWVE1SRXdEd1lEVlFRSUV3aEJjbXRoYm5OaGN6RVVNQklHQTFVRUJ4TUxRbVZ1ZEc5dWRtbHNiR1V4RlRBVEJnTlZCQW9UREZkaGJHMWhjblFnU1c1akxqRW5NQ1VHQTFVRUF4TWVZV1ptYVd4cFlYUmxjeTUwYzNNdWMzUm5MbmRoYkcxaGNuUXVZMjl0TUlJQklqQU5CZ2txaGtpRzl3MEJBUUVGQUFPQ0FROEFNSUlCQ2dLQ0FRRUEzNThDSDN4QjQwSmt0ZEtHY0hESUttQzFKM2t5UGpyWDllZkxQb0htaGlxNytYUHJRclM3NEk3blJ1dEh4VnE1Vnh2SlVOZXVJdDVPSkh5NVJEY2NhZ2hGZkYrdFpOTDJFMFZIVmU2NFwvNk5XQlBCWHloaVVsSlFPTjVZSURnbHdvTm5sQjZjK1RaTTdjK1wvNGs1MkRQcGw0NTR0bkRTaURkWGFVeXRqbUhXbitiTmJtV0R6UFlhazdGSkU0SnBINHlSQUFhXC9aODI3UjhwVVJIeFwvaW1CYjNKNmdKOGoyRUYrXC8xUzNQcWdvZm16dmMxeDNDWnNLcDRBZGwrVEx3Qk5nUkQ4dFwvVU1DOWFIdGV5S3ZoaEdZREZvd014eTJoSVRKaGtQZGczaXd5aXF6OTQ2cGhlZ29pelVtaW5WQjdxbmJzUjJ6dUF0KzYzeGYyY1FUK3piQlFJREFRQUJvNElEV0RDQ0ExUXdEZ1lEVlIwUEFRSFwvQkFRREFnV2dNQXdHQTFVZEV3RUJcL3dRQ01BQXdnWTRHQ0NzR0FRVUZCd0VCQklHQk1IOHdSQVlJS3dZQkJRVUhNQUtHT0doMGRIQTZMeTl6WldOMWNtVXVaMnh2WW1Gc2MybG5iaTVqYjIwdlkyRmpaWEowTDJkemNuTmhiM1p6YzJ4allUSXdNVGd1WTNKME1EY0dDQ3NHQVFVRkJ6QUJoaXRvZEhSd09pOHZiMk56Y0M1bmJHOWlZV3h6YVdkdUxtTnZiUzluYzNKellXOTJjM05zWTJFeU1ERTRNRllHQTFVZElBUlBNRTB3UVFZSkt3WUJCQUdnTWdFVU1EUXdNZ1lJS3dZQkJRVUhBZ0VXSm1oMGRIQnpPaTh2ZDNkM0xtZHNiMkpoYkhOcFoyNHVZMjl0TDNKbGNHOXphWFJ2Y25rdk1BZ0dCbWVCREFFQ0FqQVwvQmdOVkhSOEVPREEyTURTZ01xQXdoaTVvZEhSd09pOHZZM0pzTG1kc2IySmhiSE5wWjI0dVkyOXRMMmR6Y25OaGIzWnpjMnhqWVRJd01UZ3VZM0pzTUNrR0ExVWRFUVFpTUNDQ0htRm1abWxzYVdGMFpYTXVkSE56TG5OMFp5NTNZV3h0WVhKMExtTnZiVEFkQmdOVkhTVUVGakFVQmdnckJnRUZCUWNEQVFZSUt3WUJCUVVIQXdJd0h3WURWUjBqQkJnd0ZvQVUrTzlcLzhzMTRaNmplYjQ4a2pZanhod01Dcytzd0hRWURWUjBPQkJZRUZOeVVmcDNQQUd2QWt0TjBZVjdURUhCb0I2SEdNSUlCZmdZS0t3WUJCQUhXZVFJRUFnU0NBVzRFZ2dGcUFXZ0Fkd0JrRWNSc3BCTHNwNGtjb2dJdUFMeXJUeWdIMUI0MUo2dnFcL3RVRHlYM044QUFBQVpjUk9mUmRBQUFFQXdCSU1FWUNJUUM2VlwvQ09OZ2E1MVhEYmhxQ1lzUHdWQWYzc2crU2dYUVZ3VkJqd3hGNmdad0loQU1hdFFpUFVCU1hoSlBlcnpUVE5MYytQRTBXalhFelwvUUdLV0dEZlhKOXZlQUhVQXl6ajNGWWw4aEtGRVgxdkIzZnZKYnZLYVdjMUhDbWtGaGJETEZNTVVXT2NBQUFHWEVUbjBiUUFBQkFNQVJqQkVBaUJqK0pIXC9RSSt2ajNsMDdXNEMrR2FCSnlJZEtDd0FkTFNHTHRlc3R3dlF3UUlnTDBsNXVQQVwvTzJvMXpXdHIxQ3k3VW5rMnVvN3NUVUVSVXc1cjRuM2tGcVlBZGdBbEw1VENLeW5wYnA5QkduSUhLMmxjVzFMXC9sNmtOSlVDN1wvTnhSN0UzdUN3QUFBWmNST2ZSZEFBQUVBd0JITUVVQ0lRRGhcL2Y1d2M1VkhIYVJld1JcL05hTitwWVwvdUxyYmRDXC9FZDdIM2FIT2x4cHd3SWdhdjZqcUFRd2ozbkF5cCtkaENhWTJ3XC9LN0VaWXpWRWZuN0dcL2FIaFhwdk13RFFZSktvWklodmNOQVFFTEJRQURnZ0VCQUpTYlViTHNkaEN0UUxxVUYreFwvaWF4SDVvUjdSSTZMQ2hNM1BYZEJsVEhpSDVtdHdPRHpPRlNodDl3cGhOOHRlZnBxcXA0RjNHMlRQOXJodkRRNzgreWh0cFV4Um5NNVFvY0pidzh0cGxEbng4Q0RIOXI5K3dNbHpVWkVrQ0J2Vnc2TTRIU0R1UjdLVzVaaUUzcGxZYytFMXZ5RHVjQ2M4U3AwWjBqSjljVjhuKzVWM1BUa0V1bktxWk5HUHJ3RUJ2XC9FdGlOUTdHS05NR3lQVjVGaXpKdThqbjJzemxMT1lTSEJWSGt0OGFMcGJKOGFFMGdycmkrU2t1STV0UVdjeUR0Tkgrc1hFNkRVMXo0aXd0bWJTQXRzUjUwMDRJZ1UrcDc3SXZPd3Qrd0Zpam9odkNSWUxZUmV5OXpJRVB5MCs1RXJtMDhzSEJiSlpMRE52TkNITWNNPSIsIk1JSUVUakNDQXphZ0F3SUJBZ0lOQWU1ZkloMzhZanZVTXpxRlZ6QU5CZ2txaGtpRzl3MEJBUXNGQURCTU1TQXdIZ1lEVlFRTEV4ZEhiRzlpWVd4VGFXZHVJRkp2YjNRZ1EwRWdMU0JTTXpFVE1CRUdBMVVFQ2hNS1IyeHZZbUZzVTJsbmJqRVRNQkVHQTFVRUF4TUtSMnh2WW1Gc1UybG5iakFlRncweE9ERXhNakV3TURBd01EQmFGdzB5T0RFeE1qRXdNREF3TURCYU1GQXhDekFKQmdOVkJBWVRBa0pGTVJrd0Z3WURWUVFLRXhCSGJHOWlZV3hUYVdkdUlHNTJMWE5oTVNZd0pBWURWUVFERXgxSGJHOWlZV3hUYVdkdUlGSlRRU0JQVmlCVFUwd2dRMEVnTWpBeE9EQ0NBU0l3RFFZSktvWklodmNOQVFFQkJRQURnZ0VQQURDQ0FRb0NnZ0VCQUtkYXlkVU1HQ0VBSTlXWEQrdXUzVnhvYTJ1UFVHQVRlb0hMbCs2T2ltR1VTeVo1OWdTbkt2dWsybGE3N3FDazhIdUtmMVVmUjVOaERXNXhVVG9sSkFndmpPSDNpZGFTejYrenB6OHc3YlhmSWE3KzlVUVhcL2RoajJTXC9UZ1Zwclg5TkhzS3p5cXpza2VVOGZ4eTdxdVJVNmZCaE1hYk8xSUZrSlhpbkRZK1l1Umx1cWxKQkpEcm53OVVxaENTOThORTNRdkFERkJsVjVCczZpMEJEeFNFUG91VnExbFZXOU1kSWJQWWErb2V3TkV0c3NtU1N0UjhKdkErWjZjTFZ3ek0wbkxLV01qc0lZUEpMSkxuTnZCaEJXazBDcW84VlMrK1hGQmRacGFGd0d1ZTVSaWVHS0RrRk5tNUtRQ29ucEZtdnY3M1crZWthNDQwZUtIUnd1cDA4Q0F3RUFBYU9DQVNrd2dnRWxNQTRHQTFVZER3RUJcL3dRRUF3SUJoakFTQmdOVkhSTUJBZjhFQ0RBR0FRSFwvQWdFQU1CMEdBMVVkRGdRV0JCVDQ3M1wveXpYaG5xTjV2anlTTmlQR0hBd0t6NnpBZkJnTlZIU01FR0RBV2dCU1A4RXRcL3FDNUZKSzVOVVBwam1vdmU0dDBidkRBK0JnZ3JCZ0VGQlFjQkFRUXlNREF3TGdZSUt3WUJCUVVITUFHR0ltaDBkSEE2THk5dlkzTndNaTVuYkc5aVlXeHphV2R1TG1OdmJTOXliMjkwY2pNd05nWURWUjBmQkM4d0xUQXJvQ21nSjRZbGFIUjBjRG92TDJOeWJDNW5iRzlpWVd4emFXZHVMbU52YlM5eWIyOTBMWEl6TG1OeWJEQkhCZ05WSFNBRVFEQStNRHdHQkZVZElBQXdOREF5QmdnckJnRUZCUWNDQVJZbWFIUjBjSE02THk5M2QzY3VaMnh2WW1Gc2MybG5iaTVqYjIwdmNtVndiM05wZEc5eWVTOHdEUVlKS29aSWh2Y05BUUVMQlFBRGdnRUJBSm1ReUMxZlFvclVDMmJibUFOekVkU0lobElvVTRyN3JkXC85YzQ0Nlp3VGJ3MU1VY0JRSmZNUGcrTmNjbUJxaXhEN2I2UURqeW5DeThTSXdJVmJiMDYxNVhvRllDMjBVZ0RYMWIxMGQ2NXBIQmY5WmpRQ3hRTnFRbUpZYXVteHRmNHoxczREZmpHUnpOcFo1ZVdsMDZyXC80bmdHUG9KVnBqZW1FdXVubDFJZzQyM2c3bU5BMmV5bXcwbElZa041U1F3Q3VhaWZJRko2R2xhemhnREV3ZnBvbHU0dXNCQ09tbVFEbzhkSW03QTkrTzRvcmtqZ1RIWStHellaU1IrWTBmRnVrQWo2S1lYd2lkbE5hbEZNemhyaVNxSEt2b2ZsU2h4OHhwZnl3Z1ZjdnpmVE8zUFlrejZmaU5KQm9uZjZxOGFtYUVzeWJ3TWJEcUtXd0lYN2VTUFk9IiwiTUlJRFh6Q0NBa2VnQXdJQkFnSUxCQUFBQUFBQklWaFRDS0l3RFFZSktvWklodmNOQVFFTEJRQXdUREVnTUI0R0ExVUVDeE1YUjJ4dlltRnNVMmxuYmlCU2IyOTBJRU5CSUMwZ1VqTXhFekFSQmdOVkJBb1RDa2RzYjJKaGJGTnBaMjR4RXpBUkJnTlZCQU1UQ2tkc2IySmhiRk5wWjI0d0hoY05NRGt3TXpFNE1UQXdNREF3V2hjTk1qa3dNekU0TVRBd01EQXdXakJNTVNBd0hnWURWUVFMRXhkSGJHOWlZV3hUYVdkdUlGSnZiM1FnUTBFZ0xTQlNNekVUTUJFR0ExVUVDaE1LUjJ4dlltRnNVMmxuYmpFVE1CRUdBMVVFQXhNS1IyeHZZbUZzVTJsbmJqQ0NBU0l3RFFZSktvWklodmNOQVFFQkJRQURnZ0VQQURDQ0FRb0NnZ0VCQU13bGRwQjVCbmdpRnZYQWc3YUV5aWllXC9RVjJFY1d0aUhMOFJnSkR4N0tLblFSZkpNc3VTK0ZnZ2tiaFVxc01nVWR3Yk4xazBldjFMS01QZ2owTUs2NlgxN1lVaGhCNXV6c1RnSGVNQ09GSjBtcGlMeDllK3BabzM0a25sVGlmQnRjK3ljc21XUTF6M3JESTZTWU9neFhHNzF1TDBnUmd5a21tS1BacE9cL2JMeUNpUjVaMktZVmMzckhRVTNIVGdPdTV5THk2Yys5Qzd2XC9VOUFPRUdNK2lDSzY1VHBqb1djNHpkUVE0Z09zQzBwNkhwc2srUUxqSmc2VmZMdVFTU2FHamxPQ1pnZGJLZmRcLytSRk8rdUlFbjhyVUFWU05FQ01XRVpYcmlYNzYxM3QyU2Flcjlmd1JQdm0yTDdEV3pnVkdrV3FRUGFidW1EazNGMnhtbUZnaGNDQXdFQUFhTkNNRUF3RGdZRFZSMFBBUUhcL0JBUURBZ0VHTUE4R0ExVWRFd0VCXC93UUZNQU1CQWY4d0hRWURWUjBPQkJZRUZJXC93UzMrb0xrVWtyazFRK21PYWk5N2kzUnU4TUEwR0NTcUdTSWIzRFFFQkN3VUFBNElCQVFCTFFOdkFVS3IreUF6djk1WlVSVW03bGdBSlFheXpFNGFHS0Fjenltdm1kTG02QUMydXBBclQ5Zkh4RDRxXC9jMmRLZzhkRWUzamdyMjVzYndNcGpqTTVSY09PNUxsWGJLcjhFcGJzVThZdDVDUnN1WlJqKzl4VGFHZFdQb080enpVaHc4bG9cL3M3YXdsT3F6SkNLNmZCZFJveVYzWHBZS0JvdkhkN05BRGRCaisxRWJkZFRLSmQrODJjRUhoWFhpcGEwMDk1TUo2Uk1HM056ZHZRWG1jSWZlZzdqTFFpdENod3NcL3p5clZRNFBrWDQyNjhOWFNiN2hMaTE4WUl2RFFWRVRJNTNPOXpKcmxBR29tZWNzTXg4Nk95WFNoa0RPT3l5R2VNbGhMeFM2N3R0VmI5K0U3Z1VKVGIwbzJITE8wMkpRWlI3cmtwZURNZG16dGNwSFdEOWYiXSwia2lkIjoiNjFiYTdiNWMwZTU3ZTIzOSJ9.YC2X7EhkCikAYNFRZrFX0MWaahjMHiI8cqkPlJW3w1Mb92kOg6nx_hovDS-x5h6zcUmXIowNM5uxQx92u-UGAqn8ezNo5NFR842gs25lokSCkirzpOfWNVqw8Urn0XP3LQcY-Sd6LcP-2TQtHbvSd-73PB926jp8Z70kPh9CPAdrGMlM2N7LKbExv6oiqpbgLYrQyFT2ah5gzO1qL06pniWRaTUgoiIIotk2xgnP0cM4izbRR34eVKv0PA0S8mdT4uB7Ym7xZaUc-kSc77V-CK3RDowBtT3H5Qom54QjHfc1MMH0PgT2Zw-44BS7Idhsv7PS4unIsJWdq8uGfVk6KQ.GYJ4HKfpj_C5kKfBMzyEyg.Qqn7lxO3LTAVRd-Chod5J2gIM_pkqWyxSIbL74QkcMpp-BRu17TU9DMR2OIarmf4CcNNxfP8dBysCDab8sOLwg.Wr7lS_4Ox7QrU39gTb4xUA",
        exp_month="12",
        exp_year="2030",
        name="Jane Doe",
        cvc="123",
        checks_performed=[],
        iin="411111",
        display_card_funding_type=DisplayCardType.CREDIT,
        display_wallet_type=None,
        display_brand="Visa",
        display_last4="1111",
        metadata={"a": "b"}
    )
    allowance = Allowance(
        reason=AllowanceReason.ONE_TIME,
        max_amount=100,
        currency="USD",
        checkout_session_id="dummy_session",
        merchant_id="dummy_merchant",
        expires_at="2025-12-31T23:59:59Z"
    )
    billing_address = Address(
        name="Jane Doe",
        line_one="456 Second St",
        line_two="",
        city="New York",
        state="NY",
        country="US",
        postal_code="10001"
    )
    
    return DelegatePaymentRequest(
        payment_method=payment_method,
        allowance=allowance,
        billing_address=billing_address.model_dump(),
        risk_signals=RiskSignal(
            type = RiskSignalType.CARD_TESTING,
            action=RiskAction.AUTHORIZED,
            score=10,
        ),
        metadata={}
    )

def get_headers_with_omissions(omits):
    base = ["Authorization", "Accept-Language", "User-Agent", "Idempotency-Key", "Request-Id", "Content-Type", "Signature", "Timestamp", "API-Version"]
    return [h for h in base if h not in omits]