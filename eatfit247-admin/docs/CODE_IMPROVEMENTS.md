# Code Improvement Plan

Architectural deepening opportunities for eatfit247-admin, ordered by impact.
Work through these one by one — each is independent unless noted.

---

## 1. Collapse the CRUD API Service Layer (22 shallow modules) -- DONE

**Files:** All 22 simple CRUD `api.service.ts` files under `libs/admin/*/src/lib/`

**Problem:** 22 services with ~40-50 lines each, differing only in the endpoint string. Same methods everywhere: `getList`, `getById`, `create`, `update`, `updateStatus`, `getDropdown`. ~880 lines of near-identical code.

**Solution:** Created a generic `CrudApiService<T, TManage>` in `libs/core/src/lib/services/crud-api.service.ts`. All 22 services now extend it — pure CRUD services are ~5 lines, CRUD+extras services keep only their custom methods.

**Result:** ~600 lines removed. Build passes. All consumers unchanged.

---

## 2. Extract a Base List Module (4,000+ lines of duplication) -- DONE

**Files:** `libs/shared-ui/src/lib/base-list/base-list.component.ts` + 18 migrated list components

**Problem:** Every list component reimplemented identical methods: `setupSearch()` (RxJS debounce + switchMap), `loadData()` (pagination + loading state), `onPageChange()`, `onSortChange()`, `toggleStatus()` (confirmation dialog + API call + reload). Word-for-word identical across 22 components — only column definitions and entity type differ.

**Solution:** Created `BaseListComponent<T>` abstract class in shared-ui with a `ListApiService<T>` interface. Common columns (Status, Created By/Updated By, Created/Updated At) are auto-appended. Feature components declare only columns, routes, entity identity, and optional extra actions via `buildExtraActions()` or `buildActions()` override.

**Result:** 18 components migrated (~4,100 → ~1,075 lines in components + 202-line base class). ~2,800 lines of duplication removed. Build passes.

**Migrated:** banners, blogs, legal-pages, seo-page, success-stories, products, courier-providers, courier-provider-accounts, pocket-guide, faq, media-press, referrer, programs, issues, warehouses, courier-provider-warehouses, recipes, franchise.

**Not migrated (too different):** dashboard, members, diet-template, tax-master, promo-code, call-logs, admin-user, program-plans.

---

## 3. Collapse ApiBaseService (pure pass-through) -- DONE

**Files:** `libs/core/src/lib/services/api-base.service.ts` (deleted), `libs/core/src/lib/services/auth.service.ts`, all feature `api.service.ts` files

**Problem:** `ApiBaseService` injects `HttpService`, caches `apiUrl`, and provides a deprecated `buildParams()` no-op. The inheritance chain `AuthService -> ApiBaseService -> HttpService -> HttpClient` is three layers of indirection where two would do.

**Solution:** Removed `ApiBaseService`. All 10 services (auth, members, dashboard, faq, diet-template, 5 report services, google-calendar) now inject `HttpService` directly via `inject()`. Deleted `api-base.service.ts` and removed its barrel export.

**Result:** Eliminated one layer of indirection. All services are now flat — no inheritance chain to understand. Build passes.

---

## 4. Consolidate the LOV-Master Mega-Service -- DONE

**Files:** `libs/admin/lov-master/src/lib/api.service.ts` + 27 list components + 24 manage components

**Problem:** Single service with 27 entity patterns, each repeating the same 6 methods: `getXList`, `getXById`, `createX`, `updateX`, `updateXStatus`, `getXDropdown`. 60+ methods, all identical except for the endpoint string. List components (27) each reimplemented 230+ lines of identical search/pagination/sort/status-toggle logic.

**Solution:** Replaced the 1,177-line mega-service with 27 small services extending `CrudApiService` (~5 lines each, 201 lines total). Migrated all 27 list components to `BaseListComponent` (~35 lines each, 961 lines total vs ~6,200 before). Updated 24 manage components to use per-entity services with generic methods (`getById`, `create`, `update`).

**Result:** api.service.ts: 1,177 → 201 lines. List components: ~6,200 → 961 lines. ~6,000+ lines of duplication removed. Build passes.

---

## 5. Separate UI Side Effects from the HTTP Seam -- DONE

**Files:** `libs/core/src/lib/interceptors/http-error.interceptor.ts`, `libs/core/src/lib/services/error-notification.service.ts`, `libs/core/src/lib/interfaces/app-error.interface.ts`

**Problem:** `HttpErrorInterceptor` mixed error classification and UI feedback (snackbar). Components could not suppress the snackbar. Error types were untyped.

**Solution:** Split into three pieces:
1. `AppError` discriminated union (`ForbiddenError | NotFoundError | ValidationError | ServerError | NetworkError | UnknownAppError`) in `app-error.interface.ts`
2. `ErrorNotificationService` — subscribable service that shows snackbar and exposes `errors$` stream
3. Refactored interceptor that classifies errors and delegates to `ErrorNotificationService`
4. `SUPPRESS_ERROR_NOTIFICATION` HttpContext token — components can opt out of the default snackbar per-request

**Result:** Error classification separated from error display. Interceptor re-throws typed `AppError` objects. Components can suppress notifications or subscribe to `errors$` for custom handling. Build passes.

---

## 6. Deepen UploadFormComponent (state management overhaul)

**Status:** Pending

**Files:** `libs/shared-ui/src/lib/upload-form/`

**Problem:** Manages 15+ state transitions using magic number status codes (0, 1, -1, 100), exposes internal state via public `uploadedFiles` array (no observable), has fragile `ngOnChanges` sync logic. Callers must understand `FileHandle` internals. Error handling has `// TODO Show error`.

**Solution:** Extract upload orchestration into an `UploadService` with an observable-based API:
- `upload$(files): Observable<UploadEvent>` where `UploadEvent` is a discriminated union (`Queued | Uploading(progress) | Complete(url) | Failed(error)`)
- The component becomes a thin UI skin over the service
- Replace magic numbers with an enum

**Benefits:**
- Depth — the service hides file lifecycle complexity behind a stream interface
- Leverage — callers subscribe to events instead of polling an array
- Testable without DOM — the service is pure async logic

---

## 7. Fix the Token Refresh Race Condition -- DONE

**Files:** `libs/core/src/lib/services/token-refresh.service.ts` (new), `libs/core/src/lib/interceptors/auth.interceptor.ts`

**Problem:** When multiple requests received 401 simultaneously, each triggered `authService.refreshToken()` independently. With token rotation enabled, the second refresh call would use a now-invalid refresh token, causing cascading logouts.

**Solution:** Created `TokenRefreshService` that serializes concurrent refresh requests:
- Stores a reference to the in-flight refresh promise
- First 401 triggers the actual refresh; subsequent 401s share the same promise
- `ensureFreshToken(): Promise<string>` is the single interface
- Interceptor delegates to this service instead of calling `authService.refreshToken()` directly
- Promise auto-clears via `.finally()` so the next batch of 401s triggers a new refresh

**Result:** Concurrent 401s now share a single refresh call. No more token rotation confusion or cascading logouts. Build passes.

---

## 8. Make Navigation a Data-Driven Module -- DONE

**Files:** `libs/core/src/lib/services/navigation.service.ts` (new), `libs/core/src/lib/interfaces/nav-item.ts` (updated), `libs/shared-ui/src/lib/layout/base-layout.component.ts`

**Problem:** `BaseLayoutComponent` had 5 navigation sections with 40+ menu items hardcoded as object literals (~100 lines). Adding or reordering a menu item required a code change and rebuild.

**Solution:** Extracted navigation config into a `NavigationService` (`providedIn: 'root'`) that owns the `navSections` array. Replaced local `MenuItem`/`NavSection` interfaces with shared interfaces in `libs/core/src/lib/interfaces/nav-item.ts`. `BaseLayoutComponent` now injects `NavigationService` and reads `navSections` from it — zero rendering logic changes, template unchanged.

**Result:** Layout component does rendering only; navigation data is behind a service seam. Future role-based navigation requires changing the service, not the component. Build passes.
