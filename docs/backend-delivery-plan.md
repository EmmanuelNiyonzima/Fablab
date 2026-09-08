# FabLab backend delivery plan

## Success criteria

The delivered system will provide a secure Flask API backed by PostgreSQL, preserve the current React user experience, produce balanced and auditable accounting records, and be testable and deployable without source-code secrets.

## Delivery stages

| Stage | Activities | Deliverables | Exit criteria |
| --- | --- | --- | --- |
| 0. Discovery | Confirm roles, approval workflows, fiscal calendar, allocation rules, hosting, and acceptance scenarios with stakeholders. Freeze API contracts. | Requirements log, API contract, data dictionary, risk register. | Stakeholders approve requirements and sample reports. |
| 1. Foundation | Create Flask app factory, configuration, SQLAlchemy, Alembic, JWT, health endpoint, user model, authentication, and test harness. | Secure backend skeleton and CI-ready tests. | App runs locally, health check passes, authentication tests pass, no secret is committed. |
| 2. Master data | Model and expose organizations, users/roles, chart of accounts, allocation policies, shared expenses, settings, and audit events. | CRUD APIs, migration files, role checks, seed command. | Every write is authorized, validated, audited, and integration-tested. |
| 3. Transaction engine | Implement draft expense/income flows, approvals, allocation calculations, attachments, journal posting, reversals, and contribution settlement. | Atomic accounting service and transaction APIs. | Debits equal credits, invalid postings roll back, no posted record is edited in place. |
| 4. Reporting | Build dashboard, general ledger, trial balance, income statement, cash-flow, budget-vs-actual, forecasts, exports, filtering, and pagination. | Report APIs and frontend integration. | Reports reconcile with journal lines and approved sample data. |
| 5. Frontend cutover | Replace local-storage financial mutations with API calls, unify token handling, provide loading/error states, and remove mock fallback behavior. | Integrated React client. | Core workflows work after page reload and on a clean browser profile. |
| 6. Quality and release | Security review, unit/integration/e2e tests, performance checks, backup/restore test, migration rehearsal, monitoring, deployment, and user acceptance testing. | Production deployment runbook and release candidate. | UAT sign-off, rollback plan tested, monitoring and backups active. |

## Working method for every backend activity

1. **Specify:** Write endpoint input, output, validation rules, permissions, error codes, and acceptance tests before implementation.
2. **Model and migrate:** Update SQLAlchemy models, create an Alembic migration, and review its upgrade and downgrade behavior.
3. **Implement:** Keep HTTP routes thin; place accounting, allocation, and reporting logic in services.
4. **Secure:** Require JWT authentication, check roles/permissions, validate all input, and append an audit record for financial changes.
5. **Test:** Add service unit tests and API tests covering success, validation, authorization, and rollback failure cases.
6. **Integrate:** Update the React API client, then test the UI against a clean API database.
7. **Review:** Verify balances, reconciliation samples, audit data, and migration safety before merging.

## Phase 1 implementation checklist

- [x] Flask application factory.
- [x] Environment-only database and JWT configuration.
- [x] SQLAlchemy, Alembic, CORS, and JWT extensions.
- [x] User model using password hashes.
- [x] Login, current-user, logout, and health endpoints.
- [x] Basic API tests.
- [ ] Create the first Alembic migration against the selected PostgreSQL instance.
- [ ] Provision the initial administrator through a one-time protected deployment command.
- [ ] Configure real environment secrets and allowed production frontend origin.
