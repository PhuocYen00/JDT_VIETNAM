import path from "path";
import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import {
  readExcelWorkbook,
  getSheetRows,
  parseExcelDate,
  parseNumber,
  parseString,
} from "../src/lib/excel-parser";

const prisma = new PrismaClient();

const WORKBOOK_PATH = path.join(
  process.cwd(),
  "data",
  "Bo_du_lieu_mau_JDT_Quan_ly_thiet_bi_CNTT_Ho_tro_ky_thuat.xlsx"
);

async function main() {
  const startTime = Date.now();
  console.log("================================================================");
  console.log("BẮT ĐẦU IMPORT DATASET EXCEL VÀO POSTGRESQL (PHASE 2)");
  console.log(`Đường dẫn workbook: ${WORKBOOK_PATH}`);
  console.log("================================================================");

  // 1. Đọc file Excel
  console.log("Đang đọc workbook bằng SheetJS...");
  const wb = readExcelWorkbook(WORKBOOK_PATH);
  console.log("✔ Đọc workbook thành công. Danh sách sheet:", wb.SheetNames.join(", "));

  // 2. Hash mật khẩu chung Abcd@1234 một lần
  console.log("Đang khởi tạo mã băm mật khẩu chung (Abcd@1234)...");
  const commonPasswordHash = await bcrypt.hash("Abcd@1234", 10);

  // -------------------------------------------------------------
  // BƯỚC 1: IMPORT DANH MỤC (01_Danh_muc)
  // -------------------------------------------------------------
  console.log("\n[1/10] Import Danh mục nền (Phòng ban, Loại thiết bị, Nhóm sự cố)...");
  const rawDanhMuc = getSheetRows<Record<string, unknown>>(wb, "01_Danh_muc");

  // Departments
  const deptCodes = new Set<string>();
  const departmentsToInsert: { code: string; name: string }[] = [];

  for (const r of rawDanhMuc) {
    const code = parseString(r["Mã bộ phận"]);
    const name = parseString(r["Tên bộ phận"]);
    if (code && name && !deptCodes.has(code)) {
      deptCodes.add(code);
      departmentsToInsert.push({ code, name });
    }
  }

  for (const d of departmentsToInsert) {
    await prisma.department.upsert({
      where: { code: d.code },
      update: { name: d.name },
      create: { code: d.code, name: d.name },
    });
  }

  const allDepts = await prisma.department.findMany();
  const deptMap = new Map(allDepts.map((d) => [d.code, d.id]));
  console.log(`✔ Đã nạp ${departmentsToInsert.length} phòng ban.`);

  // Device Categories
  const devCatNames = new Set<string>();
  for (const r of rawDanhMuc) {
    const cat = parseString(r["Loại thiết bị CNTT"]);
    if (cat) devCatNames.add(cat);
  }

  for (const name of devCatNames) {
    await prisma.deviceCategory.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  const allDevCats = await prisma.deviceCategory.findMany();
  const devCatMap = new Map(allDevCats.map((c) => [c.name, c.id]));
  console.log(`✔ Đã nạp ${devCatNames.size} loại thiết bị CNTT.`);

  // Ticket Categories
  const ticketCatNames = new Set<string>();
  for (const r of rawDanhMuc) {
    const cat = parseString(r["Nhóm sự cố"]);
    if (cat) ticketCatNames.add(cat);
  }

  for (const name of ticketCatNames) {
    await prisma.ticketCategory.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  const allTicketCats = await prisma.ticketCategory.findMany();
  const ticketCatMap = new Map(allTicketCats.map((c) => [c.name, c.id]));
  console.log(`✔ Đã nạp ${ticketCatNames.size} nhóm sự cố ticket.`);

  // -------------------------------------------------------------
  // BƯỚC 2: IMPORT NGƯỜI DÙNG (02_Nguoi_dung)
  // -------------------------------------------------------------
  console.log("\n[2/10] Import 180 Người dùng (02_Nguoi_dung)...");
  const rawUsers = getSheetRows<Record<string, unknown>>(wb, "02_Nguoi_dung");

  for (const r of rawUsers) {
    const employeeCode = parseString(r["Mã người dùng"]);
    if (!employeeCode) continue;

    const fullName = parseString(r["Họ và tên"]);
    const deptCode = parseString(r["Mã bộ phận"]);
    const title = parseString(r["Chức danh"]);
    const email = parseString(r["Email mẫu"]).toLowerCase();
    const phone = parseString(r["Số điện thoại mẫu"]);
    const status = parseString(r["Trạng thái"]) || "Đang làm việc";

    const departmentId = deptMap.get(deptCode) || allDepts[0].id;

    // Role assignment: PB11 (CNTT) hoặc Chức danh "Nhân viên CNTT" -> IT_SUPPORT
    let role: Role = "USER";
    if (deptCode === "PB11" || title.includes("CNTT")) {
      role = "IT_SUPPORT";
    }

    await prisma.user.upsert({
      where: { employeeCode },
      update: {
        fullName,
        departmentId,
        title,
        email,
        phone,
        status,
        role,
        passwordHash: commonPasswordHash,
      },
      create: {
        employeeCode,
        fullName,
        departmentId,
        title,
        email,
        phone,
        status,
        role,
        passwordHash: commonPasswordHash,
      },
    });
  }

  // Đảm bảo tài khoản ADMIN chuẩn tồn tại
  const itDeptId = deptMap.get("PB11") || allDepts[0].id;
  await prisma.user.upsert({
    where: { email: "admin@jdt.local" },
    update: {
      employeeCode: "ADMIN01",
      role: "ADMIN",
      departmentId: itDeptId,
      passwordHash: commonPasswordHash,
    },
    create: {
      employeeCode: "ADMIN01",
      fullName: "Quản trị viên Hệ thống",
      departmentId: itDeptId,
      title: "Trưởng ban CNTT",
      email: "admin@jdt.local",
      phone: "0900000001",
      status: "Đang làm việc",
      role: "ADMIN",
      passwordHash: commonPasswordHash,
    },
  });

  const allUsers = await prisma.user.findMany();
  const userMapByCode = new Map(allUsers.map((u) => [u.employeeCode, u.id]));
  console.log(`✔ Đã nạp thành công ${allUsers.length} người dùng vào cơ sở dữ liệu.`);

  // -------------------------------------------------------------
  // BƯỚC 3: IMPORT THIẾT BỊ CNTT (03_Thiet_bi_CNTT)
  // -------------------------------------------------------------
  console.log("\n[3/10] Import 900 Thiết bị CNTT (03_Thiet_bi_CNTT)...");
  const rawDevices = getSheetRows<Record<string, unknown>>(wb, "03_Thiet_bi_CNTT");

  let unmappedDeviceUsers = 0;
  const devicesToCreate: {
    code: string;
    categoryId: string;
    brand: string;
    model: string;
    serial: string;
    departmentId: string;
    assignedUserId: string | null;
    status: string;
    purchaseDate: Date | null;
    warrantyEndDate: Date | null;
    location: string;
    condition: string;
  }[] = [];

  for (const r of rawDevices) {
    const code = parseString(r["Mã thiết bị"]);
    if (!code) continue;

    const catName = parseString(r["Loại thiết bị"]);
    const categoryId = devCatMap.get(catName);
    if (!categoryId) {
      console.warn(`[Cảnh báo] Không tìm thấy category: ${catName} cho thiết bị ${code}`);
      continue;
    }

    const brand = parseString(r["Hãng"]);
    const model = parseString(r["Model"]);
    const serial = parseString(r["Serial mẫu"]);
    const deptCode = parseString(r["Mã bộ phận"]);
    const departmentId = deptMap.get(deptCode) || allDepts[0].id;
    const status = parseString(r["Trạng thái"]) || "Đang sử dụng";

    // Strict user mapping rule: Nếu mã người dùng không xác định chắc chắn trong User map -> assignedUserId = null
    const userCode = parseString(r["Người sử dụng"]);
    let assignedUserId: string | null = null;
    if (userCode && userMapByCode.has(userCode)) {
      assignedUserId = userMapByCode.get(userCode)!;
    } else {
      assignedUserId = null;
      if (userCode) unmappedDeviceUsers++;
    }

    const purchaseDate = parseExcelDate(r["Ngày mua"]);
    const warrantyEndDate = parseExcelDate(r["Hết bảo hành"]);
    const location = parseString(r["Vị trí"]);
    const condition = parseString(r["Tình trạng"]);

    devicesToCreate.push({
      code,
      categoryId,
      brand,
      model,
      serial,
      departmentId,
      assignedUserId,
      status,
      purchaseDate,
      warrantyEndDate,
      location,
      condition,
    });
  }

  // Xóa cũ và insert theo batch 300
  await prisma.device.deleteMany();
  for (let i = 0; i < devicesToCreate.length; i += 300) {
    const chunk = devicesToCreate.slice(i, i + 300);
    await prisma.device.createMany({ data: chunk });
  }

  const allDevices = await prisma.device.findMany();
  const deviceMapByCode = new Map(allDevices.map((d) => [d.code, d.id]));
  console.log(`✔ Đã nạp ${allDevices.length} thiết bị CNTT.`);
  console.log(`  (Số thiết bị không xác định người sử dụng: ${devicesToCreate.filter(d => d.assignedUserId === null).length}, unmapped mã lạ: ${unmappedDeviceUsers})`);

  // -------------------------------------------------------------
  // BƯỚC 4: IMPORT YÊU CẦU HỖ TRỢ (04_Yeu_cau_ho_tro)
  // -------------------------------------------------------------
  console.log("\n[4/10] Import 3.500 Yêu cầu hỗ trợ (04_Yeu_cau_ho_tro)...");
  const rawTickets = getSheetRows<Record<string, unknown>>(wb, "04_Yeu_cau_ho_tro");

  const ticketsToCreate: {
    code: string;
    receivedAt: Date;
    requesterId: string;
    departmentId: string;
    deviceId: string | null;
    categoryId: string;
    description: string;
    priority: string;
    status: string;
    channel: string;
    assigneeId: string | null;
    resolutionHours: number | null;
    completedAt: Date | null;
    resolution: string | null;
    rating: number | null;
  }[] = [];

  for (const r of rawTickets) {
    const code = parseString(r["Mã yêu cầu"]);
    if (!code) continue;

    const receivedAt = parseExcelDate(r["Thời điểm tiếp nhận"]) || new Date();
    const reqCode = parseString(r["Người yêu cầu"]);
    const requesterId = userMapByCode.get(reqCode);
    if (!requesterId) {
      console.warn(`[Cảnh báo] Người yêu cầu không tồn tại: ${reqCode} ở ticket ${code}`);
      continue;
    }

    const deptCode = parseString(r["Mã bộ phận"]);
    const departmentId = deptMap.get(deptCode) || allDepts[0].id;

    const devCode = parseString(r["Mã thiết bị"]);
    const deviceId = devCode ? deviceMapByCode.get(devCode) || null : null;

    const catName = parseString(r["Nhóm sự cố"]);
    const categoryId = ticketCatMap.get(catName) || allTicketCats[0].id;

    const description = parseString(r["Mô tả"]);
    const priority = parseString(r["Mức ưu tiên"]) || "Trung bình";
    const status = parseString(r["Trạng thái"]) || "Mới tiếp nhận";
    const channel = parseString(r["Kênh tiếp nhận"]) || "Biểu mẫu nội bộ";

    const assCode = parseString(r["Người phụ trách"]);
    const assigneeId = assCode ? userMapByCode.get(assCode) || null : null;

    const resHoursVal = r["Thời gian xử lý (giờ)"];
    const resolutionHours = resHoursVal !== "" && resHoursVal !== null && resHoursVal !== undefined
      ? parseNumber(resHoursVal)
      : null;

    const completedAt = parseExcelDate(r["Thời điểm hoàn thành"]);
    const resolution = parseString(r["Kết quả/Hướng xử lý"]) || null;

    const ratingVal = r["Đánh giá"];
    const rating = ratingVal !== "" && ratingVal !== null && ratingVal !== undefined
      ? Math.round(parseNumber(ratingVal))
      : null;

    ticketsToCreate.push({
      code,
      receivedAt,
      requesterId,
      departmentId,
      deviceId,
      categoryId,
      description,
      priority,
      status,
      channel,
      assigneeId,
      resolutionHours,
      completedAt,
      resolution,
      rating,
    });
  }

  // Clear existing tickets (cascades to histories)
  await prisma.ticketHistory.deleteMany();
  await prisma.ticket.deleteMany();

  // Batch insert tickets in chunks of 500
  for (let i = 0; i < ticketsToCreate.length; i += 500) {
    const chunk = ticketsToCreate.slice(i, i + 500);
    await prisma.ticket.createMany({ data: chunk });
  }

  const allTickets = await prisma.ticket.findMany({ select: { id: true, code: true } });
  const ticketMapByCode = new Map(allTickets.map((t) => [t.code, t.id]));
  console.log(`✔ Đã nạp thành công ${allTickets.length} ticket hỗ trợ kỹ thuật.`);

  // -------------------------------------------------------------
  // BƯỚC 5: IMPORT LỊCH SỬ XỬ LÝ (05_Lich_su_xu_ly)
  // -------------------------------------------------------------
  console.log("\n[5/10] Import 13.224 Lịch sử xử lý ticket (05_Lich_su_xu_ly)...");
  const rawHistories = getSheetRows<Record<string, unknown>>(wb, "05_Lich_su_xu_ly");

  const historiesToCreate: {
    code: string;
    ticketId: string;
    happenedAt: Date;
    action: string;
    content: string;
    actorId: string;
  }[] = [];

  for (const r of rawHistories) {
    const code = parseString(r["Mã lịch sử"]);
    const ticketCode = parseString(r["Mã yêu cầu"]);
    const ticketId = ticketMapByCode.get(ticketCode);
    if (!ticketId) continue;

    const happenedAt = parseExcelDate(r["Thời điểm"]) || new Date();
    const action = parseString(r["Hành động"]) || "Cập nhật";
    const content = parseString(r["Nội dung cập nhật"]) || "";

    const actorCode = parseString(r["Người thực hiện"]);
    const actorId = userMapByCode.get(actorCode) || allUsers[0].id;

    historiesToCreate.push({
      code,
      ticketId,
      happenedAt,
      action,
      content,
      actorId,
    });
  }

  // Batch insert histories in chunks of 1000
  for (let i = 0; i < historiesToCreate.length; i += 1000) {
    const chunk = historiesToCreate.slice(i, i + 1000);
    await prisma.ticketHistory.createMany({ data: chunk });
  }

  const countHistories = await prisma.ticketHistory.count();
  console.log(`✔ Đã nạp thành công ${countHistories} bản ghi lịch sử xử lý ticket.`);

  // -------------------------------------------------------------
  // BƯỚC 6: IMPORT BẢO TRÌ SỬA CHỮA (06_Bao_tri_sua_chua)
  // -------------------------------------------------------------
  console.log("\n[6/10] Import 1.500 Lượt bảo trì/sửa chữa (06_Bao_tri_sua_chua)...");
  const rawMaint = getSheetRows<Record<string, unknown>>(wb, "06_Bao_tri_sua_chua");

  const maintToCreate: {
    code: string;
    deviceId: string;
    performedAt: Date;
    maintenanceType: string;
    performerId: string;
    result: string;
    cost: number;
    nextCheckAt: Date | null;
  }[] = [];

  for (const r of rawMaint) {
    const code = parseString(r["Mã bảo trì"]);
    const devCode = parseString(r["Mã thiết bị"]);
    const deviceId = deviceMapByCode.get(devCode);
    if (!deviceId) continue;

    const performedAt = parseExcelDate(r["Ngày thực hiện"]) || new Date();
    const maintenanceType = parseString(r["Loại công việc"]) || "Kiểm tra định kỳ";

    const perfCode = parseString(r["Người thực hiện"]);
    const performerId = userMapByCode.get(perfCode) || allUsers[0].id;

    const result = parseString(r["Kết quả"]) || "Hoạt động ổn định";
    const cost = parseNumber(r["Chi phí mẫu (VNĐ)"]);
    const nextCheckAt = parseExcelDate(r["Ngày kiểm tra tiếp theo"]);

    maintToCreate.push({
      code,
      deviceId,
      performedAt,
      maintenanceType,
      performerId,
      result,
      cost,
      nextCheckAt,
    });
  }

  await prisma.maintenance.deleteMany();
  for (let i = 0; i < maintToCreate.length; i += 500) {
    const chunk = maintToCreate.slice(i, i + 500);
    await prisma.maintenance.createMany({ data: chunk });
  }

  const countMaint = await prisma.maintenance.count();
  console.log(`✔ Đã nạp thành công ${countMaint} bản ghi bảo trì/sửa chữa.`);

  // -------------------------------------------------------------
  // BƯỚC 7: IMPORT LINH KIỆN (07_Linh_kien)
  // -------------------------------------------------------------
  console.log("\n[7/10] Import 120 Linh kiện kho (07_Linh_kien)...");
  const rawParts = getSheetRows<Record<string, unknown>>(wb, "07_Linh_kien");

  for (const r of rawParts) {
    const code = parseString(r["Mã linh kiện"]);
    if (!code) continue;

    const name = parseString(r["Tên linh kiện"]);
    const unit = parseString(r["Đơn vị tính"]) || "Cái";

    // QUY TẮC SỐNG CÒN: Tồn kho mẫu là số dư hiện tại
    const stockQuantity = Math.round(parseNumber(r["Tồn kho mẫu"]));
    const minimumStock = Math.round(parseNumber(r["Mức tồn tối thiểu"]));
    const unitPrice = parseNumber(r["Đơn giá mẫu (VNĐ)"]);
    const storageLocation = parseString(r["Vị trí lưu"]) || "Kho kỹ thuật";
    const status = parseString(r["Trạng thái"]) || "Đang sử dụng";

    await prisma.part.upsert({
      where: { code },
      update: {
        name,
        unit,
        stockQuantity,
        minimumStock,
        unitPrice,
        storageLocation,
        status,
      },
      create: {
        code,
        name,
        unit,
        stockQuantity,
        minimumStock,
        unitPrice,
        storageLocation,
        status,
      },
    });
  }

  const allParts = await prisma.part.findMany();
  const partMapByCode = new Map(allParts.map((p) => [p.code, p.id]));
  console.log(`✔ Đã nạp thành công ${allParts.length} linh kiện (stockQuantity lấy từ Tồn kho mẫu).`);

  // -------------------------------------------------------------
  // BƯỚC 8: IMPORT GIAO DỊCH LINH KIỆN (08_Giao_dich_linh_kien)
  // -------------------------------------------------------------
  console.log("\n[8/10] Import 1.800 Giao dịch linh kiện (08_Giao_dich_linh_kien)...");
  console.log("  (Quy tắc: Chỉ import làm lịch sử, tuyệt đối không tính lại số tồn)");
  const rawTrans = getSheetRows<Record<string, unknown>>(wb, "08_Giao_dich_linh_kien");

  const transToCreate: {
    code: string;
    happenedAt: Date;
    partId: string;
    type: string;
    quantity: number;
    reference: string | null;
    note: string | null;
  }[] = [];

  for (const r of rawTrans) {
    const code = parseString(r["Mã giao dịch"]);
    const partCode = parseString(r["Mã linh kiện"]);
    const partId = partMapByCode.get(partCode);
    if (!partId) continue;

    const happenedAt = parseExcelDate(r["Ngày"]) || new Date();
    const type = parseString(r["Loại giao dịch"]) || "Nhập";
    const quantity = Math.round(parseNumber(r["Số lượng"]));
    const reference = parseString(r["Tham chiếu"]) || null;
    const note = parseString(r["Ghi chú"]) || null;

    transToCreate.push({
      code,
      happenedAt,
      partId,
      type,
      quantity,
      reference,
      note,
    });
  }

  await prisma.inventoryTransaction.deleteMany();
  for (let i = 0; i < transToCreate.length; i += 500) {
    const chunk = transToCreate.slice(i, i + 500);
    await prisma.inventoryTransaction.createMany({ data: chunk });
  }

  const countTrans = await prisma.inventoryTransaction.count();
  console.log(`✔ Đã nạp thành công ${countTrans} bản ghi giao dịch kho lịch sử.`);

  // -------------------------------------------------------------
  // BƯỚC 9: ĐỐI SOÁT TỰ ĐỘNG VỚI SHEET 09_Dashboard
  // -------------------------------------------------------------
  console.log("\n[9/10] ĐỐI SOÁT TRỰC TIẾP TRUY VẤN POSTGRESQL VỚI SỐ LIỆU MẪU...");

  const [
    dbTotalDevices,
    dbActiveDevices,
    dbTotalTickets,
    dbCompletedTickets,
    dbOpenTickets,
    dbTotalMaint,
    dbTotalParts,
    dbTotalTrans,
  ] = await Promise.all([
    prisma.device.count(),
    prisma.device.count({ where: { status: "Đang sử dụng" } }),
    prisma.ticket.count(),
    prisma.ticket.count({ where: { status: "Hoàn thành" } }),
    prisma.ticket.count({ where: { status: { not: "Hoàn thành" } } }),
    prisma.maintenance.count(),
    prisma.part.count(),
    prisma.inventoryTransaction.count(),
  ]);

  const statusGrouping = await prisma.ticket.groupBy({
    by: ["status"],
    _count: { id: true },
  });

  const categoryGrouping = await prisma.ticket.groupBy({
    by: ["categoryId"],
    _count: { id: true },
  });

  const elapsedSeconds = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log("----------------------------------------------------------------");
  console.log("BẢNG TỔNG HỢP ĐỐI SOÁT THỰC TẾ TRONG POSTGRESQL:");
  console.log(`- Tổng thiết bị CNTT: ${dbTotalDevices} (Kỳ vọng: 900)`);
  console.log(`- Thiết bị đang sử dụng: ${dbActiveDevices} (Kỳ vọng: 743)`);
  console.log(`- Tổng ticket: ${dbTotalTickets} (Kỳ vọng: 3.500)`);
  console.log(`- Ticket đã hoàn thành: ${dbCompletedTickets} (Kỳ vọng: 2.754)`);
  console.log(`- Ticket đang mở: ${dbOpenTickets} (Kỳ vọng: 746)`);
  console.log(`- Số lượt bảo trì/sửa chữa: ${dbTotalMaint} (Kỳ vọng: 1.500)`);
  console.log(`- Số bản ghi lịch sử xử lý: ${countHistories} (Kỳ vọng: 13.224)`);
  console.log(`- Số linh kiện trong kho: ${dbTotalParts} (Kỳ vọng: 120)`);
  console.log(`- Số giao dịch linh kiện: ${dbTotalTrans} (Kỳ vọng: 1.800)`);
  console.log("----------------------------------------------------------------");
  console.log("PHÂN PHỐI TRẠNG THÁI TICKET TRONG DB:");
  for (const s of statusGrouping) {
    console.log(`  * ${s.status}: ${s._count.id}`);
  }
  console.log("----------------------------------------------------------------");
  console.log(`[10/10] HOÀN TẤT IMPORT TOÀN BỘ DATASET! Thời gian thực thi: ${elapsedSeconds} giây.`);
  console.log("================================================================");
}

main()
  .catch((e) => {
    console.error("Lỗi trong quá trình import:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
