# Mint Printworks - Reorder Portal

## Overview
A customer-facing reorder portal that integrates with Printavo (order management software) via their GraphQL API v2. Customers can look up their order history by email, view mockup images, open invoice details, and submit reorder requests that notify the sales team via email.

## Recent Changes
- 2026-02-23: Line item detail enhancement - reorder modal now shows actual product line items with per-item size/qty entry, email includes product-specific breakdown
- 2026-02-23: Initial build - Printavo API integration, Resend email, reorder portal UI

## Architecture
- **Frontend**: React + Vite + TanStack Query + Shadcn UI + Tailwind CSS
- **Backend**: Express.js with Printavo GraphQL API v2 integration
- **Email**: Resend (via Replit connector) for reorder notification emails
- **No database** - all data comes from Printavo API in real-time

## Key Files
- `server/printavo.ts` - Printavo GraphQL API v2 client (statuses, orders)
- `server/email.ts` - Resend email integration for reorder notifications
- `server/routes.ts` - API routes (/api/statuses, /api/orders/:email, /api/reorder)
- `client/src/pages/home.tsx` - Main app page (customer lookup + order dashboard)
- `shared/schema.ts` - TypeScript types and Zod validation schemas

## API Routes
- `GET /api/statuses` - Fetch all Printavo order statuses
- `GET /api/orders?q={searchValue}&type={email|company}` - Fetch orders by email or company name
- `POST /api/reorder` - Send reorder notification email to sales team

## Configuration
- Printavo API: Uses PRINTAVO_API_EMAIL and PRINTAVO_API_TOKEN secrets
- Resend: Connected via Replit connector for sending transactional emails
- Sales email notifications go to: info@mintprintworks.com
- Printavo subdomain: mintprintworks

## Printavo API Notes
- Uses GraphQL API v2 at https://www.printavo.com/api/v2
- Auth: email + token headers
- Query `invoices` (not `orders`) for invoice data
- Field names: `nickname` (not orderNickname), `status` (not orderstatus), `fullImageUrl` on Mockup
- Query complexity limit: 25000 - use `first` param on nested collections
- `sortDescending: true` (not `sortDirection: DESC`)
