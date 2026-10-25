# HỆ THỐNG QUẢN LÝ THIẾT BỊ CNTT VÀ YÊU CẦU HỖ TRỢ KỸ THUẬT
### Công ty TNHH JDT Việt Nam

Hệ thống web application nội bộ quản lý danh mục thiết bị CNTT, quy trình tiếp nhận – xử lý yêu cầu hỗ trợ kỹ thuật, lịch sử bảo dưỡng và quản lý kho linh kiện.

---

## 1. Công nghệ sử dụng
- **Frontend / Fullstack Framework:** Next.js 15 (App Router), React 19, TypeScript (Strict mode)
- **UI & Styling:** Tailwind CSS, Lucide Icons, Radix UI primitives
- **Database:** PostgreSQL 16 (chạy qua Docker Compose)
- **ORM:** Prisma Client & Migrations
- **Xác thực:** Secure HttpOnly Session Cookie với JWT (thư viện `jose`) & mã hóa mật khẩu `bcryptjs`
- **Data Tables & Charts:** TanStack Table, Recharts
- **Xử lý Excel:** SheetJS (`xlsx`)

---

## 2. Tài khoản Demo phục vụ thử nghiệm & Đánh giá

Hệ thống hỗ trợ đăng nhập linh hoạt bằng cả **Email** hoặc **Mã nhân viên**:

| Vai trò | Email đăng nhập | Mã nhân viên | Mật khẩu chung | Mô tả quyền hạn |
|---|---|---|---|---|
| **ADMIN** | `admin@jdt.local` | `ADMIN01` | `Abcd@1234` | Toàn quyền quản trị: Danh mục, người dùng, phòng ban, import dữ liệu |
| **IT_SUPPORT** | `itsupport@jdt.local` | `IT0001` | `Abcd@1234` | Tiếp nhận, xử lý yêu cầu (ticket), cập nhật lịch sử, ghi bảo trì, xuất kho linh kiện |
| **USER** | `user@jdt.local` | `USER01` | `Abcd@1234` | Tạo yêu cầu hỗ trợ mới, theo dõi tiến độ và đánh giá (1–5 sao) sau hoàn thành |

*Ghi chú:* Toàn bộ 180 nhân sự được import từ danh sách nhân sự mẫu (ví dụ: `NV0001`, `NV0163`...) cũng đều có thể đăng nhập bằng email hoặc mã nhân viên với mật khẩu chung `Abcd@1234`.

---

## 3. Hướng dẫn cài đặt & Khởi chạy từ máy mới

### Yêu cầu môi trường
- **Node.js:** phiên bản v18 trở lên (khuyến nghị v20+ hoặc v22)
- **Docker Desktop** (để chạy PostgreSQL)

### Các bước khởi chạy

1. **Cài đặt thư viện dependencies:**
   ```bash
   npm install
   ```

2. **Khởi động cơ sở dữ liệu PostgreSQL:**
   ```bash
   docker compose up -d
   ```
   *Cơ sở dữ liệu PostgreSQL 16 sẽ được khởi chạy trên cổng `5434` (được cấu hình trong `.env`).*

3. **Chạy Migration tạo bảng cơ sở dữ liệu:**
   ```bash
   npx prisma migrate dev
   ```

4. **Nạp toàn bộ dữ liệu từ file Excel:**
   ```bash
   npm run db:import
   ```
   *(Script sẽ tự động đọc file `data/Bo_du_lieu_mau_JDT_Quan_ly_thiet_bi_CNTT_Ho_tro_ky_thuat.xlsx` và nạp 900 thiết bị, 180 người dùng, 3.500 ticket, 13.224 lịch sử, 1.500 bảo trì, 120 linh kiện vào PostgreSQL trong ~7 giây).*

5. **Chạy ứng dụng ở chế độ phát triển (Development):**
   ```bash
   npm run dev
   ```
   Truy cập trình duyệt tại địa chỉ: [http://localhost:3000](http://localhost:3000)

6. **Biên dịch bản chạy Production:**
   ```bash
   npm run build
   npm run start
   ```

---

## 4. Cấu trúc thư mục dự án

```text
├── data/                    # File dữ liệu chuẩn Excel
├── docs/                    # Tài liệu đặc tả kỹ thuật và nghiệp vụ
├── prisma/                  # Prisma schema và migrations
│   └── schema.prisma        # Định nghĩa 10 models cơ sở dữ liệu
├── scripts/
│   ├── seed-initial.ts      # Seed tài khoản quản trị và demo ban đầu
│   └── import-dataset.ts    # Script đọc và nạp toàn bộ dữ liệu từ file Excel
├── src/
│   ├── app/
│   │   ├── (auth)/login/    # Giao diện đăng nhập
│   │   ├── (dashboard)/     # Các màn hình quản trị và vận hành
│   │   └── api/auth/        # Các route handler xác thực (login, logout, me)
│   ├── components/
│   │   └── layout/          # Sidebar, Topbar, Breadcrumbs
│   ├── lib/
│   │   ├── auth.ts          # Session và RBAC server-side
│   │   ├── excel-parser.ts  # Parser SheetJS và chuyển đổi serial date
│   │   ├── prisma.ts        # Prisma client singleton
│   │   └── utils.ts         # Tiện ích định dạng ngày, tiền tệ, classnames
│   └── types/               # Type definitions dùng chung
└── tests/                   # Kịch bản kiểm thử tự động
```

---

## 5. Các kịch bản kiểm thử tự động (Automated Test Suite)

Dự án đi kèm bộ kịch bản kiểm thử tự động toàn diện kiểm tra mọi phân hệ nghiệp vụ và bảo mật:

```bash
# 1. Kiểm thử xác thực, session token, tài khoản bị khóa và chính sách mật khẩu mạnh
npx tsx tests/test-auth-security.ts

# 2. Kiểm thử phân quyền tiêu cực (RBAC Negative Testing - 403 Forbidden)
npx tsx tests/test-rbac-negative.ts

# 3. Kiểm thử hồ sơ cá nhân, đổi mật khẩu và khôi phục an toàn
npx tsx tests/test-profile-and-password.ts

# 4. Kiểm thử xuất báo cáo song hành Excel và PDF chuẩn tiếng Việt UTF-8
npx tsx tests/test-reports-pdf-excel.ts

# 5. Kiểm thử phân hệ Thiết bị CNTT (phân trang server, tìm kiếm, lọc)
npx tsx tests/test-devices-module.ts

# 6. Kiểm thử phân hệ Yêu cầu hỗ trợ (vòng đời ticket, ma trận trạng thái, rating)
npx tsx tests/test-tickets-module.ts

# 7. Kiểm thử phân hệ Bảo trì & Sửa chữa
npx tsx tests/test-maintenance-module.ts

# 8. Kiểm thử phân hệ Kho linh kiện & giao dịch nguyên tử ($transaction, chống âm kho)
npx tsx tests/test-inventory-module.ts

# 9. Kiểm thử tính toán số liệu Dashboard trực tiếp từ PostgreSQL
npx tsx tests/test-dashboard-stats.ts

# 10. Kiểm thử các chức năng Quản trị hệ thống (Admin, Audit Log, Quản lý tài khoản)
npx tsx tests/test-admin-modules.ts

# 11. Kiểm thử tích hợp toàn diện vòng đời (Integration Smoke Test)
npx tsx tests/integration-smoke.ts
```

---

## 6. Định hướng phát triển tương lai (Future Roadmap)

Nhằm tiếp tục mở rộng quy mô ứng dụng và tối ưu hóa quy trình quản trị hạ tầng CNTT tại doanh nghiệp, hệ thống định hướng các tính năng nâng cấp tiếp theo:

1. **Nhận diện thiết bị & Quản lý kho bằng mã phản hồi nhanh (QR Code / Barcode):**
   - Tự động sinh mã QR định danh cho từng thiết bị CNTT (`TB00001`...) và linh kiện kho (`LK0001`...).
   - Hỗ trợ nhân viên kỹ thuật sử dụng camera điện thoại/máy quét để truy xuất hồ sơ thiết bị, kiểm tra bảo hành hoặc quét xuất kho tức thì không cần nhập tay.

2. **Đính kèm tài liệu & Hình ảnh đa phương tiện (Ticket File Attachments):**
   - Cho phép người dùng tải lên hình ảnh chụp màn hình thông báo lỗi, video sự cố hoặc biên bản bàn giao dạng PDF khi tạo hoặc xử lý ticket.
   - Lưu trữ an toàn trên giải pháp lưu trữ đối tượng (Object Storage tương thích S3 / MinIO) với cơ chế phân quyền truy cập nghiêm ngặt.

3. **Thiết lập cam kết mức dịch vụ (SLA - Service Level Agreement):**
   - Định nghĩa ngưỡng thời gian phản hồi (First Response Time) và thời gian giải quyết sự cố (Resolution Time) theo ma trận mức độ ưu tiên (ví dụ: Khẩn cấp $\le 2$ giờ, Cao $\le 8$ giờ, Trung bình $\le 24$ giờ).
   - Tự động leo thang cảnh báo (Escalation) tới cấp quản lý khi ticket sắp hoặc đã vượt quá thời hạn cam kết.

4. **Tích hợp kênh thông báo đa nền tảng (Email & Webhook thông minh):**
   - Gửi email tự động qua giao thức SMTP khi tiếp nhận ticket, phân công kỹ thuật viên hoặc hoàn tất yêu cầu.
   - Kết nối Webhook nội bộ đến các kênh liên lạc như Microsoft Teams, Telegram hoặc Slack của Đội ngũ CNTT khi phát sinh sự cố diện rộng.

5. **Nâng cao an toàn xác thực với Two-Factor Authentication (2FA / OTP):**
   - Áp dụng cơ chế xác thực hai lớp dựa trên mã OTP sinh theo thời gian (TOTP RFC 6238) tương thích với Google Authenticator hoặc Microsoft Authenticator, đặc biệt bắt buộc đối với nhóm người dùng có vai trò Quản trị viên (ADMIN).

6. **Phân tích dự báo hỏng hóc thiết bị (Predictive Maintenance & Analytics):**
   - Ứng dụng mô hình thống kê phân tích tần suất hỏng hóc và tuổi thọ linh kiện để đưa ra khuyến nghị bảo dưỡng chủ động trước khi sự cố xảy ra, tối ưu hóa vòng đời thiết bị và tiết kiệm ngân sách thay thế linh kiện.

