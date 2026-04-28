# Project Context

## Product Summary

`kosten_bot` is a small commerce platform for selling fishing products. The current implementation is centered on Telegram Mini App flows, with a bot for entry, a FastAPI backend for business logic, and a React frontend for the storefront.

## Current Architecture

- `backend/bot`: Telegram bot on `aiogram`
- `backend/api`: FastAPI application with catalog, orders, payments, and admin routes
- `backend/database`: SQLAlchemy models and async database access
- `backend/services`: business logic for catalog, orders, and payments
- `frontend`: React + Vite Mini App frontend

## Current Domain Model

The project already contains these core entities:

- users
- products
- orders
- order items
- payments

Order lifecycle currently uses these statuses:

- `requires_payment`
- `paid`
- `processing`
- `shipped`
- `delivered`
- `cancelled`

## Important Product Direction

Treat the current codebase as a Telegram-first MVP that should evolve into a multi-channel commerce platform.

The next strategic direction is integration with VK as a new acquisition and sales channel for an audience of about 800 users. When planning or implementing changes, prefer decisions that:

1. reduce hard dependency on Telegram-only identity;
2. preserve the existing catalog/order/payment domain model;
3. keep the backend ready for multi-channel entry points such as Telegram, VK, and direct web;
4. improve production readiness for a small but real customer audience.

## Key Constraints

- The current user model is tightly coupled to `telegram_id`.
- Payment flow is still mock-based and not production-ready.
- Admin operations rely on a separate admin token.
- Production hardening is still needed for auth, CORS, observability, and operational workflows.

## Working Guidance

When working on this repository, use `docs/project_plan_and_requirements.md` as the main source for project goals, rollout stages, functional requirements, and non-functional requirements.
