# IMPLEMENTATION PLAN — 5 PHASE

## Phase 0 — Phân tích
- Đọc MASTER_PROMPT, PROJECT_SPEC và DATASET_MAPPING.
- Inspect workbook thực tế.
- Xác nhận cột và counts.
- Vẽ ERD.
- Chốt Prisma schema.
- Chốt route tree.

**Kết quả:** `IMPLEMENTATION_PLAN.md`, ERD, route map.

## Phase 1 — Foundation
- Next.js + TypeScript strict.
- Tailwind + shadcn/ui.
- Docker Compose PostgreSQL.
- Prisma migration.
- Auth và RBAC.
- Dashboard shell: sidebar, topbar, breadcrumb.

**Kiểm tra:** login, logout, route protection, DB connection.

## Phase 2 — Import & seed
- Xlsx parser.
- Excel date parser.
- Zod row schema.
- Import categories/departments/users/devices/tickets/history/maintenance/parts/transactions.
- Upsert và batch.
- Import report.

**Kiểm tra:** counts, FK, sample records, no duplicate business codes.

## Phase 3 — Core business
### Devices
- List/filter/search/pagination.
- Detail.
- Edit.
- Related tickets/maintenance.

### Tickets
- List/filter/search/pagination.
- Create/detail/edit assignment.
- Workflow status.
- Auto history.
- Rating.

### Maintenance
- List/create/detail.

### Inventory
- Parts list/detail.
- Transaction create.
- Stock transactional update.
- Low-stock warning.

## Phase 4 — Dashboard & reports
- KPI query.
- Status/category/month/department charts.
- Export filtered tables.
- Admin import page with import report.

## Phase 5 — Hardening
- Unit tests: workflow, inventory stock, import conversion.
- E2E smoke: login → ticket create → support process → complete → user rating.
- Permission tests.
- Empty/loading/error states.
- Accessibility pass.
- Responsive pass.
- README from clean machine.

## Final demo flow
1. Login User.
2. Tạo ticket cho thiết bị.
3. Login IT Support.
4. Tiếp nhận → Đang xử lý → cập nhật timeline → Hoàn thành.
5. User xem trạng thái và đánh giá.
6. Mở Device detail xem lịch sử.
7. Tạo maintenance.
8. Xuất linh kiện và quan sát tồn kho.
9. Dashboard cập nhật từ DB.
10. Export report.
