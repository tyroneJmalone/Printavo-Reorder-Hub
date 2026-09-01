# Mint Printworks Client Reorder Portal
## Context, Options, and Proposed Plan

**Status:** Brainstorming only — nothing in this proposal has been built yet.

## 1. Current Application Context

Mint Printworks currently has a customer-facing reorder portal. A customer:

1. Enters an email address or company name.
2. Receives a list of matching Printavo orders.
3. Views order details, statuses, mockups, invoice links, and quantities.
4. Opens a reorder modal to specify sizes and quantities.
5. Submits the reorder request, which emails the sales team.

The application currently:

- Fetches order data live from Printavo's GraphQL API.
- Shows up to the 15 most recent matching invoices.
- Supports filtering the results by order status.
- Has no customer accounts or login system.
- Has no database or internal admin dashboard.
- Uses the customer's email as the search key.

## 2. Proposed Goal

Allow staff to generate a private link for selected customers or orders so the recipient can go directly to the appropriate reorder experience without searching.

There would be no need to generate links for every customer. Staff could create them only for customers who are likely to reorder or for specific orders that need follow-up.

## 3. Link Types

### Option A: Client-Level Portal Link

Example:

```text
your-site.com/portal/p_8f3c...
```

This link would display the same type of dashboard currently shown after an email search:

- Recent orders
- Status filters
- Mockup images
- Invoice links
- Reorder buttons
- Product, size, and quantity details

The link would be associated with one exact customer behind the scenes. The customer would not need to enter an email address.

This is likely the best option for repeat customers because one link can provide access to their relevant reorder history.

### Option B: Specific-Order Link

Example:

```text
your-site.com/order/o_41a9...
```

This link would display only one selected Printavo order and its reorder interface.

This could be useful for messages such as:

> Here is the reorder page for your softball uniforms.

The link should be tied to the Printavo internal order ID, not rely on a predictable visible order number in the URL.

### Recommendation

Support both options using the same link-management system:

- A client-level link for ongoing customer relationships.
- A specific-order link for targeted follow-up.

## 4. How Staff Would Generate Links

An internal management area could allow staff to:

1. Search for a customer or order.
2. Preview what the client will see.
3. Choose **Generate Client Portal Link** or **Generate Order Link**.
4. Copy the link to send manually.
5. Revoke or regenerate the link later.

The link-management area could show:

| Client | Type | Created | Expires | Status |
|---|---|---|---|---|
| ABC Athletics | Client portal | Today | Never | Active |
| Smith Family Reunion | Order #1042 | Today | 90 days | Active |

The link-generation area must be protected. The current application does not have an admin authentication system, so a protected staff access method would need to be selected before exposing these controls.

## 5. Security Model

A link-only portal would work like a private shared link:

- Anyone who has the link could use it.
- Each token would be long, random, and difficult to guess.
- The URL would not expose the customer's email address.
- The server would enforce whether the link is scoped to a customer or a single order.
- Reorder submissions would use the identity associated with the link instead of trusting editable customer fields sent by the browser.
- Staff could revoke a link if it was forwarded accidentally.
- Links could optionally expire.

### Higher-Security Alternative

For additional protection, opening a link could trigger a one-time code sent to the customer's email. This would make the portal more secure, but adds friction for the customer.

For the first version, secure random links with revocation may be sufficient unless the order information is considered particularly sensitive.

## 6. Live Data Versus a Snapshot

The recommended behavior is for links to show live Printavo data whenever they are opened.

Benefits:

- Status changes appear automatically.
- The customer sees current order information.
- A specific-order link continues to show the latest version of that order.
- Staff do not need to regenerate a link every time Printavo changes.

One product decision is whether a client-level portal should preserve the current limit of 15 recent invoices or show a larger/all-time history.

Possible choices:

1. Keep the current 15-order behavior for simplicity.
2. Show more orders for client portals.
3. Add pagination or a “load more” control.
4. Limit portals to selected orders rather than all matching orders.

## 7. Link Record and Storage

To support revocation, expiration, and management, each generated link would need a persistent record containing information such as:

- A random token hash
- Link type: client or order
- Customer email or Printavo customer ID
- Printavo order ID, when applicable
- Creation date
- Optional expiration date
- Revoked/active status
- Optional internal label
- Optional last-accessed timestamp

The application currently has no database.

### Storage Options

#### Persisted Opaque Tokens — Recommended

Store a hash of a random token and the link's scope in a small database table.

Advantages:

- Individual links can be revoked.
- Expiration can be changed.
- Staff can see and manage generated links.
- Access history can be tracked later.

Tradeoff:

- Requires adding persistent storage to the application.

#### Stateless Signed Links

Use a signed token containing the scope and expiration, without storing each link.

Advantages:

- No database required.
- Simpler initial implementation.

Tradeoffs:

- Individual links cannot easily be revoked before expiration.
- There is no natural link-management list.
- Usage tracking is more difficult.

Because the desired feature includes selectively generating links and potentially revoking them, persisted opaque tokens are the stronger long-term choice.

## 8. Proposed First Version

The first implementation could include:

- Client-level portal links.
- Specific-order links.
- A protected internal link-management screen.
- Search and preview before generating a link.
- Copy-link controls.
- Revoke and regenerate controls.
- Live Printavo data.
- The existing order dashboard and reorder modal.
- No customer account or password requirement.
- Optional expiration selected when the link is created.
- Server-side enforcement of the link's customer/order scope.

## 9. Possible Later Enhancements

After the basic link system works, possible additions include:

- Client-specific welcome messages.
- Custom branding or logos.
- A direct “email this link” action.
- Link usage tracking.
- Email verification codes.
- A reorder history for the customer.
- Customer-specific default status filters.
- A larger or paginated order history.
- Staff notes attached to a portal link.
- Automatic portal links in customer follow-up emails.

## 10. Decisions to Make Before Building

These are the main product and technical decisions to settle:

### Access

- Should possession of the link be enough?
- Should customers also verify their email with a one-time code?

### Scope

- Should the main client portal show the existing 15 recent orders?
- Should it show all available orders?
- Should staff be able to choose a specific set of orders?

### Expiration

- Should links never expire?
- Should staff select an expiration date?
- Should there be a default expiration such as 90 or 180 days?

### Link Management

- Should generating a new link automatically revoke the old one?
- Should a customer have one reusable portal link or multiple active links?
- Should staff be able to see when a link was last used?

### Staff Authentication

- Who should be allowed to generate and revoke links?
- Should the application add an admin login?
- Should portal management be integrated with an existing company authentication system?

### Customer Experience

- Should the portal look identical to the current results screen?
- Should it use customer-specific language such as “Welcome back, ABC Athletics”?
- Should the customer be able to return to the public search screen?

## 11. Suggested Recommendation for a Second Opinion

The proposed direction is:

1. Build one secure link system with two scopes: customer and order.
2. Use random opaque tokens stored persistently so links can be revoked.
3. Keep the customer experience passwordless at first.
4. Protect link generation and management behind staff authentication.
5. Use live Printavo data.
6. Derive the reorder customer's identity from the server-side link scope.
7. Start with the existing 15-order behavior and add pagination later if needed.

The biggest issue to resolve before implementation is not the customer-facing page; it is how staff authentication and link management should work securely.

## 12. Questions for Review

An assistant reviewing this proposal should specifically evaluate:

- Whether link-only access is appropriate for the order data being displayed.
- Whether adding a database just for portal links is justified.
- Whether the portal should use customer email, Printavo customer ID, or selected order IDs as its scope.
- Whether the first version should include both link types or start with one.
- Whether a 15-order limit is acceptable for client portals.
- What staff authentication approach best fits the existing application.
- Whether the proposed reorder identity protections are sufficient.
