# RFC: ACP Extensions Framework

**Status:** Draft
**Version:** 2026-01-27
**Scope:** Extension mechanism for optional, composable capabilities

This RFC defines the **ACP Extensions Framework**, a mechanism that enables
merchants to advertise and platforms to discover optional capabilities that
extend the core checkout specification. The first extension defined under this
framework is the **Discount Extension**.

---

## 1. Scope & Goals

- Provide a **standardized extension mechanism** for ACP that enables optional
  capabilities without breaking backward compatibility.
- Enable **capability discovery** so platforms can determine what extensions a
  merchant supports.
- Adopt **industry-standard patterns** for capability discovery and schema
  composition.
- Define a **Discount Extension** as the first implementation, delivering
  rich discount and promotion support.

**Out of scope:** Extension registration/discovery services, extension
marketplaces, dynamic extension loading at runtime.

### 1.1 Normative Language

The key words **MUST**, **MUST NOT**, **SHOULD**, **MAY** follow RFC 2119/8174.

---

## 2. Motivation

### 2.1 Enabling Optional Capabilities

This framework introduces a formal extension mechanism for ACP. It provides
standardized patterns for:

- Merchants to **advertise** which optional capabilities they support
- Platforms to **discover and negotiate** capabilities
- New capabilities to be **added composably** without modifying the core specification

### 2.3 Discount Extension

The Discount Extension enhances the existing `coupons` array with:

- **Rich response structure** for applied discounts
- **Allocation details** showing where discounts were applied
- **Automatic discount support** for merchant-initiated promotions
- **Comprehensive error codes** for rejection reasons

---

## 3. Protocol Extension Mechanism

### 3.1 Extension Declaration

Merchants advertise extension support in the checkout response via a `protocol`
object:

```json
{
  "id": "checkout_session_123",
  "protocol": {
    "version": "2026-01-27",
    "extensions": ["discount"]
  },
  "status": "ready_for_payment",
  ...
}
```

### 3.2 Protocol Object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `version` | string | Yes | ACP protocol version (YYYY-MM-DD format) |
| `extensions` | array | No | List of active extension identifiers |

### 3.3 Extension Identifiers

Extension identifiers are lowercase strings that uniquely identify an
extension. Core ACP extensions use simple names:

| Extension | Identifier | Description |
|-----------|------------|-------------|
| Discount | `discount` | Discount code support with rich applied discounts |
| Fulfillment | `fulfillment` | Extended fulfillment options (future) |
| Loyalty | `loyalty` | Loyalty points and rewards (future) |
| Subscription | `subscription` | Recurring billing support (future) |

Third-party extensions **SHOULD** use reverse-domain naming to avoid conflicts:

```json
{
  "extensions": ["discount", "com.example.custom-extension"]
}
```

### 3.4 Extension Negotiation

1. **Platform Request**: Platform sends checkout request. Platform **MAY**
   indicate preferred extensions via `Accept-Extensions` header.

2. **Merchant Response**: Merchant includes `protocol.extensions` array listing
   active extensions for this session.

3. **Schema Resolution**: Platform interprets response using base schema
   composed with active extension schemas.

### 3.5 Backward Compatibility

- The `protocol` object is **OPTIONAL** in responses
- Merchants not supporting extensions omit the `protocol` object
- Platforms **MUST** handle responses with or without `protocol`
- Extension-specific fields are ignored by clients that don't support them

---

## 4. Extension Schema Composition

### 4.1 Pattern

Extensions add fields to the base checkout schema using JSON Schema
composition. Each extension defines:

1. **New field definitions** added to the checkout object
2. **New types** used by those fields
3. **Error codes** for extension-specific messages

### 4.2 Example: Discount Extension

The discount extension adds a `discounts` object to the checkout:

```json
{
  "$defs": {
    "discounts_object": {
      "type": "object",
      "properties": {
        "codes": {
          "type": "array",
          "items": { "type": "string" }
        },
        "applied": {
          "type": "array",
          "items": { "$ref": "#/$defs/applied_discount" }
        }
      }
    }
  }
}
```

### 4.3 Composition Rules

- Extensions **MUST NOT** modify existing required fields
- Extensions **MUST NOT** change the semantics of existing fields
- Extensions **MAY** add new optional fields to the checkout object
- Extensions **MAY** add new values to the `messages[].code` enum

---

## 5. Request Headers

### 5.1 Accept-Extensions Header

Platforms **MAY** indicate preferred extensions:

```http
POST /checkout_sessions HTTP/1.1
Accept-Extensions: discount, fulfillment
Content-Type: application/json
```

Merchants **SHOULD** activate requested extensions if supported. This header is
**OPTIONAL**; merchants may activate extensions based on their own logic.

### 5.2 Response Headers

Merchants **MAY** include active extensions in response headers:

```http
HTTP/1.1 201 Created
Content-Type: application/json
ACP-Extensions: discount
```

This is informational; the `protocol.extensions` array in the response body is
authoritative.

---

## 6. Extension Lifecycle

### 6.1 States

Extensions follow this lifecycle:

| State | Description |
|-------|-------------|
| `draft` | Extension under development, not for production use |
| `experimental` | Extension available for testing, may change |
| `stable` | Extension is production-ready and versioned |
| `deprecated` | Extension is being phased out |
| `retired` | Extension is no longer supported |

### 6.2 Versioning

Extensions version independently from the core protocol. Extension versions
use the same YYYY-MM-DD format:

```json
{
  "protocol": {
    "version": "2026-01-27",
    "extensions": ["discount@2026-01-27"]
  }
}
```

If no version is specified, the latest stable version is assumed.

---

## 7. Security Considerations

- Extensions **MUST NOT** introduce new authentication or authorization
  mechanisms that bypass the core protocol's security model
- Extension-specific data follows the same PCI/PII handling rules as core data
- Merchants **MUST** validate extension inputs with the same rigor as core
  fields

---

## 8. Reference Implementation

See the following files for the reference implementation:

- `spec/unreleased/json-schema/schema.extension.json` - Extension schema
- `spec/unreleased/json-schema/schema.discount.json` - Discount extension
- `spec/unreleased/openapi/openapi.agentic_checkout.yaml` - Updated API spec

---

## 10. Conformance Checklist

- [ ] Supports `protocol` object in checkout responses
- [ ] Lists active extensions in `protocol.extensions` array
- [ ] Handles `Accept-Extensions` header (optional)
- [ ] Ignores unknown extension fields gracefully
- [ ] Validates extension-specific inputs
- [ ] Returns extension-specific error codes in `messages[]`

---

## 11. Change Log

- **2026-01-27**: Initial draft defining extensions framework

