# DATASET MAPPING — JDT IT Asset & Support

Tài liệu này dùng để AI lập trình ánh xạ workbook Excel sang PostgreSQL.

## 1. Workbook

File: `Bo_du_lieu_mau_JDT_Quan_ly_thiet_bi_CNTT_Ho_tro_ky_thuat.xlsx`

Các sheet:

- `00_Huong_dan`: metadata/hướng dẫn; không import nghiệp vụ.
- `01_Danh_muc`: nguồn danh mục.
- `02_Nguoi_dung`: 180 người dùng mẫu.
- `03_Thiet_bi_CNTT`: 900 thiết bị.
- `04_Yeu_cau_ho_tro`: 3.500 ticket.
- `05_Lich_su_xu_ly`: 13.224 lịch sử.
- `06_Bao_tri_sua_chua`: 1.500 lượt.
- `07_Linh_kien`: 120 linh kiện.
- `08_Giao_dich_linh_kien`: 1.800 giao dịch.
- `09_Dashboard`: bảng tổng hợp Excel để đối chiếu; không dùng làm nguồn dữ liệu nghiệp vụ.

## 2. Quan hệ mã

- `Mã bộ phận` → `Department.code`
- `Mã người dùng` → `User.employeeCode`
- `Mã thiết bị` → `Device.code`
- `Mã yêu cầu` → `Ticket.code`
- `Mã lịch sử` → `TicketHistory.code`
- `Mã bảo trì` → `Maintenance.code`
- `Mã linh kiện` → `Part.code`
- `Mã giao dịch` → `InventoryTransaction.code`

## 3. Import 02_Nguoi_dung

| Excel | DB |
|---|---|
| Mã người dùng | User.employeeCode |
| Họ và tên | User.fullName |
| Mã bộ phận | Department.code → User.departmentId |
| Bộ phận | Chỉ dùng đối chiếu tên |
| Chức danh | User.title |
| Email mẫu | User.email |
| Số điện thoại mẫu | User.phone |
| Trạng thái | User.status |

## 4. Import 03_Thiet_bi_CNTT

| Excel | DB |
|---|---|
| Mã thiết bị | Device.code |
| Loại thiết bị | DeviceCategory.name → categoryId |
| Hãng | brand |
| Model | model |
| Serial mẫu | serial |
| Mã bộ phận | departmentId |
| Bộ phận | đối chiếu |
| Trạng thái | status |
| Người sử dụng | employeeCode → assignedUserId; nullable |
| Ngày mua | purchaseDate |
| Hết bảo hành | warrantyEndDate |
| Vị trí | location |
| Tình trạng | condition |

## 5. Import 04_Yeu_cau_ho_tro

| Excel | DB |
|---|---|
| Mã yêu cầu | Ticket.code |
| Thời điểm tiếp nhận | receivedAt |
| Người yêu cầu | requester.employeeCode → requesterId |
| Mã bộ phận | departmentId |
| Bộ phận | đối chiếu |
| Mã thiết bị | Device.code → deviceId |
| Nhóm sự cố | TicketCategory.name → categoryId |
| Mô tả | description |
| Mức ưu tiên | priority |
| Trạng thái | status |
| Kênh tiếp nhận | channel |
| Người phụ trách | assignee.employeeCode → assigneeId |
| Thời gian xử lý (giờ) | resolutionHours |
| Thời điểm hoàn thành | completedAt |
| Kết quả/Hướng xử lý | resolution |
| Đánh giá | rating |

## 6. Import 05_Lich_su_xu_ly

| Excel | DB |
|---|---|
| Mã lịch sử | TicketHistory.code |
| Mã yêu cầu | Ticket.code → ticketId |
| Thời điểm | happenedAt |
| Hành động | action |
| Nội dung cập nhật | content |
| Người thực hiện | User.employeeCode → actorId |

## 7. Import 06_Bao_tri_sua_chua

| Excel | DB |
|---|---|
| Mã bảo trì | Maintenance.code |
| Mã thiết bị | Device.code → deviceId |
| Loại thiết bị | đối chiếu |
| Bộ phận | đối chiếu |
| Ngày thực hiện | performedAt |
| Loại công việc | maintenanceType |
| Người thực hiện | User.employeeCode → performerId |
| Kết quả | result |
| Chi phí mẫu (VNĐ) | cost |
| Ngày kiểm tra tiếp theo | nextCheckAt |

## 8. Import 07_Linh_kien

| Excel | DB |
|---|---|
| Mã linh kiện | Part.code |
| Tên linh kiện | name |
| Đơn vị tính | unit |
| Tồn kho mẫu | stockQuantity |
| Mức tồn tối thiểu | minimumStock |
| Đơn giá mẫu (VNĐ) | unitPrice |
| Vị trí lưu | storageLocation |
| Trạng thái | status |
| Cảnh báo | Không nhất thiết lưu; có thể derive `stockQuantity <= minimumStock` |

## 9. Import 08_Giao_dich_linh_kien

| Excel | DB |
|---|---|
| Mã giao dịch | InventoryTransaction.code |
| Ngày | happenedAt |
| Mã linh kiện | Part.code → partId |
| Tên linh kiện | đối chiếu |
| Loại giao dịch | type |
| Số lượng | quantity |
| Tham chiếu | reference |
| Ghi chú | note |

## 10. Quy tắc tồn kho rất quan trọng

Trong import ban đầu:

- `Part.stockQuantity` lấy trực tiếp từ cột **Tồn kho mẫu**.
- `08_Giao_dich_linh_kien` import làm lịch sử.
- KHÔNG cộng/trừ các giao dịch lịch sử vào tồn kho lần nữa.

Sau khi hệ thống vận hành:

- Tạo transaction `Nhập`: cộng tồn.
- `Xuất`: trừ tồn và không cho âm kho.
- `Điều chỉnh`: thay đổi theo nghiệp vụ được thiết kế.
- Việc tạo transaction và cập nhật stock phải chạy trong cùng DB transaction.

## 11. Excel dates

Workbook chứa date/time dạng Excel serial. Khi parse phải chuyển sang Date đúng timezone/giá trị lịch. Không coi số serial là Unix timestamp.

## 12. Validation

- Code không được rỗng.
- Foreign key code phải tồn tại.
- Rating nếu có: 1–5.
- Quantity > 0.
- Cost >= 0.
- Priority và TicketStatus phải thuộc danh mục hợp lệ.
- completedAt nullable khi ticket chưa hoàn thành.
- Không tự sửa dữ liệu sai mà không log; báo row/column cụ thể.
