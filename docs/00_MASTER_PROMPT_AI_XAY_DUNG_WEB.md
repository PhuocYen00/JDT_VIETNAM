# MASTER PROMPT — Xây dựng hệ thống quản lý thiết bị CNTT và yêu cầu hỗ trợ kỹ thuật

Bạn là **Senior Full-stack Engineer + Solution Architect + UI/UX Engineer**. Hãy xây dựng một ứng dụng web hoàn chỉnh từ các tài liệu và bộ dữ liệu đính kèm.

## 1. Bối cảnh dự án

Tên đề tài:

**Xây dựng hệ thống quản lý thiết bị CNTT và yêu cầu hỗ trợ kỹ thuật tại Công ty TNHH JDT Việt Nam**

Đây là sản phẩm phục vụ **học tập, thực tập tốt nghiệp và minh họa quy trình quản lý nội bộ**. Bộ dữ liệu Excel đính kèm là **DỮ LIỆU MÔ PHỎNG**, không phải dữ liệu vận hành thực tế của JDT Việt Nam. Tuyệt đối không biến dữ liệu mô phỏng thành tuyên bố về hoạt động nội bộ thực tế của doanh nghiệp.

File dữ liệu chuẩn cần đọc:

`Bo_du_lieu_mau_JDT_Quan_ly_thiet_bi_CNTT_Ho_tro_ky_thuat.xlsx`

Các tài liệu đặc tả đi kèm là nguồn yêu cầu chính. Nếu có mâu thuẫn giữa suy đoán của bạn và tài liệu, **ưu tiên tài liệu**. Nếu thiếu chi tiết nhỏ, chọn phương án đơn giản, nhất quán, dễ bảo trì và ghi lại quyết định trong README.

## 2. Mục tiêu sản phẩm

Xây dựng một hệ thống web nội bộ cho phép:

1. Quản lý thông tin thiết bị CNTT.
2. Tiếp nhận và theo dõi yêu cầu hỗ trợ kỹ thuật.
3. Ghi nhận lịch sử xử lý từng yêu cầu.
4. Quản lý lịch sử bảo trì/sửa chữa thiết bị.
5. Quản lý linh kiện và giao dịch nhập/xuất linh kiện ở mức vừa phải.
6. Tổng hợp dashboard và báo cáo thống kê.
7. Import dữ liệu mô phỏng từ Excel và export dữ liệu khi cần.
8. Phân quyền theo vai trò Admin / IT Support / User.

## 3. Kiến trúc và công nghệ bắt buộc

Sử dụng **Modular Monolith + 3-layer architecture** trong một repository.

- Framework: **Next.js (App Router), phiên bản stable phù hợp thời điểm triển khai**
- Ngôn ngữ: **TypeScript, strict mode**
- UI: **React + Tailwind CSS + shadcn/ui**
- Database: **PostgreSQL**
- ORM: **Prisma**
- Validation: **Zod**
- Form: **React Hook Form** nếu cần form phía client
- Table: **TanStack Table** hoặc giải pháp tương đương cho bảng dữ liệu lớn
- Chart: **Recharts**
- Excel import/export: **SheetJS/xlsx**
- Authentication: ưu tiên **Auth.js Credentials** nếu tương thích tốt với phiên bản Next.js đang dùng; nếu không, triển khai session cookie bảo mật, nhưng không dùng OAuth/social login
- Password hashing: **bcrypt/bcryptjs**
- Icons: **Lucide**
- Local database: **Docker Compose cho PostgreSQL**
- Testing: unit/integration ở các phần nghiệp vụ quan trọng; có ít nhất smoke/E2E cho login, ticket workflow và import dữ liệu

Không dùng microservices, Kafka, Kubernetes, Redis, GraphQL, AI chatbot hoặc các công nghệ làm phức tạp dự án nếu không thật sự cần.

## 4. Ngôn ngữ và giao diện

- Toàn bộ giao diện chính: **Tiếng Việt**.
- Ngày: `dd/MM/yyyy`, thời gian `dd/MM/yyyy HH:mm`.
- Tiền tệ: `vi-VN`, VNĐ.
- UI theo phong cách **enterprise admin dashboard hiện đại, gọn, nghiêm túc**, ưu tiên desktop nhưng responsive.
- Không làm giao diện quá màu mè, quá nhiều gradient, glassmorphism hoặc animation không cần thiết.
- Sidebar trái + topbar; nội dung chính có breadcrumb, tiêu đề trang, filter và bảng.
- Luôn hiển thị chú thích nhỏ ở khu vực phù hợp: **“Dữ liệu mô phỏng phục vụ học tập và kiểm thử.”**

## 5. Vai trò và quyền

### ADMIN
- Toàn quyền hệ thống.
- Quản lý người dùng, bộ phận, thiết bị, ticket, bảo trì, linh kiện, báo cáo.
- Có thể import/export dữ liệu.

### IT_SUPPORT
- Xem thiết bị.
- Tiếp nhận, phân loại, cập nhật và hoàn thành ticket.
- Ghi lịch sử xử lý.
- Ghi nhận bảo trì/sửa chữa.
- Ghi giao dịch sử dụng linh kiện phù hợp.
- Xem báo cáo liên quan.

### USER
- Tạo yêu cầu hỗ trợ.
- Xem các yêu cầu do mình tạo.
- Xem trạng thái/timeline của yêu cầu.
- Đánh giá 1–5 sau khi yêu cầu hoàn thành.

Mọi kiểm tra quyền phải thực hiện ở server, không chỉ ẩn nút ở client.

## 6. Module bắt buộc

### 6.1 Dashboard
Hiển thị dữ liệu tính động từ database, không hardcode:
- Tổng thiết bị CNTT.
- Thiết bị đang sử dụng.
- Tổng yêu cầu hỗ trợ.
- Yêu cầu đã hoàn thành.
- Yêu cầu đang mở.
- Số lượt bảo trì/sửa chữa.
- Biểu đồ ticket theo trạng thái.
- Biểu đồ ticket theo nhóm sự cố.
- Ticket theo tháng.
- Ticket theo bộ phận.

### 6.2 Quản lý thiết bị CNTT
Danh sách + tìm kiếm + lọc + phân trang + sắp xếp.

Thông tin chính:
- Mã thiết bị.
- Loại thiết bị.
- Hãng.
- Model.
- Serial.
- Bộ phận.
- Người sử dụng.
- Trạng thái.
- Ngày mua.
- Hết bảo hành.
- Vị trí.
- Tình trạng.

Trang chi tiết thiết bị có các tab:
- Tổng quan.
- Yêu cầu hỗ trợ liên quan.
- Lịch sử bảo trì/sửa chữa.

### 6.3 Yêu cầu hỗ trợ kỹ thuật
- Tạo yêu cầu.
- Danh sách ticket.
- Filter theo trạng thái, mức ưu tiên, nhóm sự cố, bộ phận, người phụ trách, khoảng ngày.
- Trang chi tiết ticket.
- Phân công người phụ trách.
- Cập nhật trạng thái.
- Timeline lịch sử xử lý.
- Kết quả/hướng xử lý.
- Đánh giá 1–5 khi hoàn thành.

Giữ đúng nhóm trạng thái theo dữ liệu:
- Mới tiếp nhận
- Đang xử lý
- Chờ phản hồi
- Tạm hoãn
- Hoàn thành

Workflow hợp lệ mặc định:
- Mới tiếp nhận → Đang xử lý / Tạm hoãn
- Đang xử lý → Chờ phản hồi / Tạm hoãn / Hoàn thành
- Chờ phản hồi → Đang xử lý / Tạm hoãn / Hoàn thành
- Tạm hoãn → Đang xử lý / Hoàn thành
- Hoàn thành là trạng thái kết thúc; Admin có thể mở lại về Đang xử lý nếu cần

Mỗi thay đổi quan trọng phải tạo bản ghi lịch sử xử lý.

### 6.4 Bảo trì / sửa chữa
- Danh sách lịch sử bảo trì.
- Tạo bản ghi gắn với thiết bị.
- Loại công việc.
- Người thực hiện.
- Kết quả.
- Chi phí.
- Ngày kiểm tra tiếp theo.
- Có filter theo thiết bị, bộ phận, loại công việc, thời gian.

### 6.5 Linh kiện và giao dịch linh kiện
- Danh mục linh kiện.
- Tồn kho hiện tại.
- Mức tồn tối thiểu.
- Cảnh báo tồn thấp.
- Nhập / Xuất / Điều chỉnh.
- Lịch sử giao dịch.

**Lưu ý khi import Excel:** cột `Tồn kho mẫu` ở sheet linh kiện được xem là **số dư hiện tại tại thời điểm import**. Các giao dịch lịch sử trong sheet giao dịch chỉ được import làm lịch sử tham khảo, **không replay để cộng/trừ lại số tồn**, tránh tính hai lần. Sau khi hệ thống hoạt động, giao dịch mới phải cập nhật tồn kho trong cùng transaction database.

### 6.6 Báo cáo
- Các KPI dashboard.
- Thống kê ticket theo trạng thái, nhóm sự cố, bộ phận, thời gian.
- Thống kê thiết bị theo loại/trạng thái/bộ phận.
- Thống kê bảo trì.
- Cho phép export kết quả lọc sang Excel/CSV ở các danh sách chính.

### 6.7 Quản lý danh mục/người dùng
Admin quản lý:
- Bộ phận.
- Người dùng.
- Vai trò.
- Danh mục loại thiết bị.
- Nhóm sự cố.

## 7. Dữ liệu Excel phải được dùng thật

Không copy một vài dòng thành mock JSON rồi bỏ qua file Excel.

Hãy tạo script import/seed đọc trực tiếp workbook và import theo thứ tự quan hệ:
1. Danh mục/bộ phận.
2. Người dùng.
3. Thiết bị.
4. Yêu cầu hỗ trợ.
5. Lịch sử xử lý.
6. Bảo trì/sửa chữa.
7. Linh kiện.
8. Giao dịch linh kiện.

Yêu cầu import:
- Validate từng sheet bằng Zod hoặc schema tương đương.
- Chuyển Excel serial date thành Date đúng.
- Upsert theo mã nghiệp vụ (`PBxx`, `NVxxxx`, `TBxxxxx`, `YCxxxxx`...).
- Có log tổng số đọc / thành công / lỗi.
- Import theo batch, không tạo hàng chục nghìn query tuần tự nếu có cách tối ưu.
- Nếu quan hệ tham chiếu không tồn tại, ghi lỗi rõ ràng thay vì âm thầm bỏ qua.
- Sau import phải kiểm tra số lượng bản ghi và hiển thị kết quả.

Kỳ vọng từ file hiện tại:
- 11 bộ phận chính.
- 180 người dùng mẫu.
- 900 thiết bị CNTT.
- 3.500 yêu cầu hỗ trợ.
- 13.224 bản ghi lịch sử xử lý.
- 1.500 bản ghi bảo trì/sửa chữa.
- 120 linh kiện.
- 1.800 giao dịch linh kiện.

Các con số trên dùng để kiểm tra seed/import, nhưng ứng dụng phải luôn tính dữ liệu thực tế từ DB sau import.

## 8. Database design

Dùng UUID/CUID làm primary key nội bộ và giữ `code` nghiệp vụ là UNIQUE.

Tối thiểu có các model/bảng:
- Department
- User
- DeviceCategory
- Device
- TicketCategory
- Ticket
- TicketHistory
- Maintenance
- Part
- InventoryTransaction

Có thể dùng enum cho Role, TicketStatus, Priority, InventoryTransactionType nếu hợp lý.

Thêm index cho các trường thường filter/search như:
- code
- departmentId
- status
- categoryId
- requesterId
- assigneeId
- receivedAt
- deviceId

Không denormalize vô lý chỉ để khớp Excel; Excel là nguồn seed, database phải có thiết kế quan hệ sạch.

## 9. REST API / server boundary

Có boundary server rõ ràng. Có thể dùng Next.js Route Handlers.

Các nhóm endpoint cần có logic tương đương:
- `/api/devices`
- `/api/tickets`
- `/api/tickets/:id/history`
- `/api/maintenance`
- `/api/parts`
- `/api/inventory-transactions`
- `/api/reports`
- `/api/import`

CRUD phải có validation, auth, RBAC và error handling nhất quán.

## 10. Yêu cầu UX cho bảng dữ liệu lớn

- Server-side pagination hoặc query pagination thực sự.
- Search debounce.
- Filter có thể reset.
- Giữ filter trên URL query params khi phù hợp.
- Loading state, empty state, error state rõ ràng.
- Không render 3.500–13.000 dòng cùng lúc trên browser.
- Các form có validation message bằng tiếng Việt.
- Confirm trước thao tác xóa hoặc thay đổi nguy hiểm.

## 11. Cấu trúc source gợi ý

```text
src/
├─ app/
│  ├─ (auth)/
│  ├─ (dashboard)/
│  └─ api/
├─ components/
├─ modules/
│  ├─ auth/
│  ├─ users/
│  ├─ departments/
│  ├─ devices/
│  ├─ tickets/
│  ├─ maintenance/
│  ├─ inventory/
│  └─ reports/
├─ lib/
├─ schemas/
└─ types/
prisma/
scripts/
tests/
```

Mỗi module nên tự chứa component, schema, service/query và type liên quan; tránh dồn toàn bộ business logic vào page/component.

## 12. Security & quality

- Không lưu plain-text password.
- Session cookie HttpOnly/Secure/SameSite phù hợp.
- Authorization tại server.
- Zod validate mọi payload quan trọng.
- Không expose stack trace hoặc secret ra client.
- `.env.example` đầy đủ, không commit secret.
- Prisma migration rõ ràng.
- Có seed/import reproducible.
- ESLint, TypeScript strict không có lỗi nghiêm trọng.
- README ghi rõ cách chạy từ máy mới.

## 13. Những thứ không được làm

- Không tự bịa thêm thông tin nội bộ thật của JDT.
- Không gọi dữ liệu mô phỏng là dữ liệu thật.
- Không hardcode dashboard bằng các số liệu trong Excel.
- Không dùng mock array cho chức năng đã có database.
- Không tạo hàng loạt trang chỉ để “trông nhiều chức năng” nhưng không hoạt động.
- Không xây microservice.
- Không thêm AI/chatbot nếu chưa hoàn thành chức năng cốt lõi.
- Không thêm payment, LMS, thương mại điện tử hoặc chức năng ngoài phạm vi.

## 14. Trình tự triển khai bắt buộc

Không code ồ ạt ngay từ đầu. Thực hiện theo thứ tự:

### Phase 0 — Đọc và lập kế hoạch
1. Đọc toàn bộ tài liệu.
2. Inspect workbook và xác nhận sheet/column.
3. Viết `IMPLEMENTATION_PLAN.md` gồm kiến trúc, schema, routes, phases và rủi ro.
4. Chỉ bắt đầu code sau khi cấu trúc không còn mâu thuẫn.

### Phase 1 — Foundation
- Khởi tạo project.
- Docker PostgreSQL.
- Prisma schema + migration.
- Auth + RBAC.
- Layout dashboard.

### Phase 2 — Import data
- Script đọc Excel.
- Seed/import tất cả dữ liệu.
- Verify counts và FK.

### Phase 3 — Core modules
- Devices.
- Tickets + ticket history.
- Maintenance.
- Parts/inventory.

### Phase 4 — Dashboard & reports
- KPI.
- Charts.
- Filter/export.

### Phase 5 — Polish & test
- Validation.
- Permission tests.
- E2E smoke tests.
- Responsive/accessibility.
- README.

## 15. Definition of Done

Dự án chỉ được coi là hoàn thành khi:

- `npm install` + cấu hình `.env` + `docker compose up -d` + migration + import dataset có thể chạy theo README.
- Login hoạt động.
- RBAC hoạt động phía server.
- Import workbook thành công và số lượng bản ghi hợp lý.
- Dashboard lấy dữ liệu từ PostgreSQL.
- Devices, Tickets, Maintenance, Parts có danh sách và trang chi tiết/chức năng cốt lõi.
- Ticket workflow sinh TicketHistory.
- Inventory transaction mới cập nhật stock an toàn.
- Search/filter/pagination hoạt động trên dữ liệu lớn.
- Export hoạt động.
- Không có lỗi TypeScript/ESLint nghiêm trọng.
- Có ít nhất các test cốt lõi.
- Không có dữ liệu hoặc dashboard hardcode để giả lập chức năng.
- README giải thích rõ đây là hệ thống demo với dữ liệu mô phỏng.

## 16. Cách bạn phải phản hồi khi bắt đầu

Trong phản hồi đầu tiên, **chưa cần viết hàng trăm file code**. Hãy trả về:

1. Tóm tắt cách bạn hiểu bài toán.
2. Các sheet/column bạn đọc được từ Excel.
3. Kiến trúc cuối cùng.
4. ERD dạng Mermaid.
5. Danh sách route/page.
6. Prisma model dự kiến ở mức cấu trúc.
7. Kế hoạch 5 phase.
8. Các điểm cần lưu ý khi import dữ liệu.

Sau đó bắt đầu triển khai theo phase và luôn duy trì hệ thống chạy được sau mỗi phase.
