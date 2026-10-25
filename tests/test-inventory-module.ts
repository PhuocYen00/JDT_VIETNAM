import prisma from "../src/lib/prisma";

async function main() {
  console.log("==================================================");
  console.log("KIỂM THỬ TỰ ĐỘNG MODULE INVENTORY (LINH KIỆN & GIAO DỊCH KHO)");
  console.log("==================================================");

  // 1. Check counts
  const partsCount = await prisma.part.count();
  const transCount = await prisma.inventoryTransaction.count();
  console.log(`✔ Số linh kiện trong DB: ${partsCount} (Kỳ vọng: 120)`);
  console.log(`✔ Số giao dịch lịch sử trong DB: ${transCount} (Kỳ vọng: 1.800)`);
  if (partsCount < 120 || transCount < 1800) {
    throw new Error("Dataset count mismatch for inventory!");
  }

  // 2. Test low stock query
  const lowStockParts = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*) as count FROM "Part" WHERE "stockQuantity" <= "minimumStock"
  `;
  console.log(`✔ Số lượng mặt hàng tồn kho thấp: ${lowStockParts[0].count}`);

  // 3. Create test part with stock 10
  const testPart = await prisma.part.create({
    data: {
      code: `LKTEST_${Date.now()}`,
      name: "Cáp quang OM3 Test",
      unit: "Sợi",
      stockQuantity: 10,
      minimumStock: 5,
      unitPrice: 150000,
      storageLocation: "Kệ T1",
      status: "Đang sử dụng",
    },
  });
  console.log(`\n[Bước 1] Tạo linh kiện test: ${testPart.code} với tồn kho ban đầu = ${testPart.stockQuantity}`);

  // 4. Test atomic Export transaction (-3 units)
  console.log("[Bước 2] Thực hiện giao dịch Xuất kho 3 sợi bằng prisma.$transaction:");
  const exportResult = await prisma.$transaction(async (tx) => {
    const p = await tx.part.findUniqueOrThrow({ where: { id: testPart.id } });
    const qty = 3;
    if (p.stockQuantity < qty) throw new Error("INSUFFICIENT_STOCK");

    const updated = await tx.part.update({
      where: { id: p.id },
      data: { stockQuantity: p.stockQuantity - qty },
    });

    const tr = await tx.inventoryTransaction.create({
      data: {
        code: `GDTEST_EX_${Date.now()}`,
        happenedAt: new Date(),
        partId: p.id,
        type: "Xuất",
        quantity: qty,
        reference: "YCTEST",
        note: "Xuất linh kiện kiểm thử",
      },
    });

    return { updated, tr };
  });

  console.log(`✔ Xuất kho thành công! Tồn kho mới: ${exportResult.updated.stockQuantity} (Kỳ vọng: 7)`);
  if (exportResult.updated.stockQuantity !== 7) throw new Error("Stock calculation failed!");

  // 5. Test Export validation failure when quantity > stock (100 > 7)
  console.log("[Bước 3] Thử nghiệm Xuất kho 100 sợi (Vượt tồn kho 7):");
  let caughtError = false;
  try {
    await prisma.$transaction(async (tx) => {
      const p = await tx.part.findUniqueOrThrow({ where: { id: testPart.id } });
      const qty = 100;
      if (p.stockQuantity < qty) throw new Error("INSUFFICIENT_STOCK: Tồn kho không đủ!");

      await tx.part.update({
        where: { id: p.id },
        data: { stockQuantity: p.stockQuantity - qty },
      });
    });
  } catch (err: unknown) {
    caughtError = true;
    console.log(`✔ Đã chặn xuất kho vượt tồn và rollback thành công: ${(err as Error).message}`);
  }

  if (!caughtError) throw new Error("Over-export was unexpectedly allowed!");

  // Verify stock is still 7 after rollback
  const verifiedPart = await prisma.part.findUniqueOrThrow({ where: { id: testPart.id } });
  console.log(`✔ Kiểm tra tồn kho sau rollback: ${verifiedPart.stockQuantity} (Vẫn là 7, không bị ảnh hưởng)`);
  if (verifiedPart.stockQuantity !== 7) throw new Error("Rollback failed!");

  // 6. Test Import transaction (+5 units)
  console.log("[Bước 4] Thực hiện giao dịch Nhập kho 5 sợi:");
  const importResult = await prisma.$transaction(async (tx) => {
    const p = await tx.part.findUniqueOrThrow({ where: { id: testPart.id } });
    const qty = 5;
    const updated = await tx.part.update({
      where: { id: p.id },
      data: { stockQuantity: p.stockQuantity + qty },
    });
    const tr = await tx.inventoryTransaction.create({
      data: {
        code: `GDTEST_IM_${Date.now()}`,
        happenedAt: new Date(),
        partId: p.id,
        type: "Nhập",
        quantity: qty,
        reference: "PNTEST",
        note: "Nhập kho bổ sung",
      },
    });
    return { updated, tr };
  });

  console.log(`✔ Nhập kho thành công! Tồn kho mới: ${importResult.updated.stockQuantity} (Kỳ vọng: 12)`);
  if (importResult.updated.stockQuantity !== 12) throw new Error("Import calculation failed!");

  // 7. Clean up test records
  await prisma.inventoryTransaction.deleteMany({ where: { partId: testPart.id } });
  await prisma.part.delete({ where: { id: testPart.id } });
  console.log(`✔ Dọn dẹp dữ liệu kiểm thử linh kiện thành công.`);

  console.log("\n==================================================");
  console.log("KIỂM THỬ MODULE INVENTORY THÀNH CÔNG 100%!");
  console.log("==================================================");
}

main()
  .catch((e) => {
    console.error("Lỗi test Inventory:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
