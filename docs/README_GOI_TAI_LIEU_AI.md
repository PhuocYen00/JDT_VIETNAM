# Gói tài liệu giao cho AI lập trình

Nên upload/cung cấp cho AI coding agent các file theo thứ tự:

1. `00_MASTER_PROMPT_AI_XAY_DUNG_WEB.md` — prompt chính, bắt buộc đọc trước.
2. `01_PROJECT_SPEC_JDT_WEB.md` — đặc tả nghiệp vụ và kỹ thuật.
3. `02_DATASET_MAPPING_JDT.md` — ánh xạ Excel → DB.
4. `03_IMPLEMENTATION_PLAN_AI.md` — trình tự triển khai.
5. `Bo_du_lieu_mau_JDT_Quan_ly_thiet_bi_CNTT_Ho_tro_ky_thuat.xlsx` — dataset mô phỏng.

## Cách dùng

### Với Codex / Claude Code / Cursor Agent
Tạo repository rỗng, đặt 5 file trên vào thư mục `docs/` (file Excel có thể ở `data/`), sau đó gửi nội dung ngắn:

> Hãy đọc toàn bộ tài liệu trong `docs/` và file Excel trong `data/`. Bắt đầu bằng Phase 0 theo MASTER_PROMPT. Chưa code hàng loạt cho đến khi bạn đã trình bày architecture, ERD, database schema, route map và import strategy. Sau đó triển khai tuần tự từng phase, giữ project chạy được sau mỗi phase.

### Nguyên tắc
- Không bỏ qua Excel.
- Không thay dataset bằng mock JSON.
- Không tự thêm phạm vi lớn ngoài đặc tả.
- Dữ liệu là mô phỏng.
- Nếu agent muốn thay công nghệ, chỉ chấp nhận khi có lý do kỹ thuật rõ và không làm tăng độ phức tạp đáng kể.
