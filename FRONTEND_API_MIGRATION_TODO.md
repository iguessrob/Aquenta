# Frontend API Migration TODO (No Mock Data)

## Priority 1 - Completed in this task
- [x] Add backend login endpoint for frontend auth: `POST /api/User/login`
- [x] Enable CORS in API (`Program.cs`) for frontend calls
- [x] Connect login page (`auth.html` + `script/auth.js`) to live API
- [x] Persist login session in browser (`aquentaUser`, `aquentaLoggedIn`)
- [x] Protect admin page (`script/admin.js`) so unauthenticated users are redirected to `auth.html`
- [x] Connect admin dashboard summary + chart to database data through:
  - [x] `GET /api/Membership`
  - [x] `GET /api/Billing`
  - [x] `GET /api/Payment`

## Priority 2 - Replace remaining hardcoded frontend data

### Billing page
- [ ] Replace placeholder alerts and TODO handlers in `script/billing.js` with real API calls
- [ ] Populate billing table from `GET /api/Billing`
- [ ] Wire save/update actions to `POST /api/Billing` and `PUT /api/Billing`
- [ ] Wire payment/invoice actions to `POST /api/Payment`

### Tariffs page
- [ ] Remove generated mock tariff rows in `script/tariffs.js`
- [ ] Load tariff rows from `GET /api/Tariffs`
- [ ] Wire add/edit/delete buttons to:
  - [ ] `POST /api/Tariffs`
  - [ ] `PUT /api/Tariffs`
  - [ ] `DELETE /api/Tariffs?id={id}`

### Customer pages
- [ ] `customer/customer-records.html` + scripts: load from `GET /api/Concessioner`
- [ ] `customer/add-concessioner.html`: submit to `POST /api/Concessioner`
- [ ] `customer/edit-concessioner.html`: update via `PUT /api/Concessioner`
- [ ] `customer/view-customer.html`: fetch detail via `GET /api/Concessioner/{id}`

## Priority 3 - Consistency and hardening
- [ ] Move DB connection string out of source code into configuration (`appsettings*.json` / env vars)
- [ ] Add proper password hashing in backend instead of plain text comparison
- [ ] Add API error message banner components in frontend (instead of `alert` only)
- [ ] Add logout button and clear session from all protected pages
- [ ] Add a shared API base URL config (dev/staging/prod)

## Verification checklist
- [ ] Backend starts on `http://localhost:5024`
- [ ] Login succeeds with real `tbl_User` credentials
- [ ] Invalid credentials are rejected with `401`
- [ ] Admin dashboard renders values from DB (no hardcoded totals)
- [ ] No CORS errors in browser console
