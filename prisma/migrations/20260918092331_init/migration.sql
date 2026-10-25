-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'IT_SUPPORT', 'USER');

-- CreateTable
CREATE TABLE "Department" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "employeeCode" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Đang làm việc',
    "role" "Role" NOT NULL DEFAULT 'USER',
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeviceCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeviceCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Device" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "serial" TEXT,
    "departmentId" TEXT NOT NULL,
    "assignedUserId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Đang sử dụng',
    "purchaseDate" TIMESTAMP(3),
    "warrantyEndDate" TIMESTAMP(3),
    "location" TEXT,
    "condition" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Device_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TicketCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ticket" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL,
    "requesterId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "deviceId" TEXT,
    "categoryId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "assigneeId" TEXT,
    "resolutionHours" DOUBLE PRECISION,
    "completedAt" TIMESTAMP(3),
    "resolution" TEXT,
    "rating" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketHistory" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "happenedAt" TIMESTAMP(3) NOT NULL,
    "action" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TicketHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Maintenance" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "performedAt" TIMESTAMP(3) NOT NULL,
    "maintenanceType" TEXT NOT NULL,
    "performerId" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "cost" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "nextCheckAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Maintenance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Part" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "stockQuantity" INTEGER NOT NULL DEFAULT 0,
    "minimumStock" INTEGER NOT NULL DEFAULT 0,
    "unitPrice" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "storageLocation" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Đang sử dụng',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Part_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryTransaction" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "happenedAt" TIMESTAMP(3) NOT NULL,
    "partId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "reference" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Department_code_key" ON "Department"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Department_name_key" ON "Department"("name");

-- CreateIndex
CREATE INDEX "Department_code_idx" ON "Department"("code");

-- CreateIndex
CREATE UNIQUE INDEX "User_employeeCode_key" ON "User"("employeeCode");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_employeeCode_idx" ON "User"("employeeCode");

-- CreateIndex
CREATE INDEX "User_departmentId_idx" ON "User"("departmentId");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE UNIQUE INDEX "DeviceCategory_name_key" ON "DeviceCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Device_code_key" ON "Device"("code");

-- CreateIndex
CREATE INDEX "Device_code_idx" ON "Device"("code");

-- CreateIndex
CREATE INDEX "Device_departmentId_idx" ON "Device"("departmentId");

-- CreateIndex
CREATE INDEX "Device_categoryId_idx" ON "Device"("categoryId");

-- CreateIndex
CREATE INDEX "Device_assignedUserId_idx" ON "Device"("assignedUserId");

-- CreateIndex
CREATE INDEX "Device_status_idx" ON "Device"("status");

-- CreateIndex
CREATE UNIQUE INDEX "TicketCategory_name_key" ON "TicketCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Ticket_code_key" ON "Ticket"("code");

-- CreateIndex
CREATE INDEX "Ticket_code_idx" ON "Ticket"("code");

-- CreateIndex
CREATE INDEX "Ticket_departmentId_idx" ON "Ticket"("departmentId");

-- CreateIndex
CREATE INDEX "Ticket_categoryId_idx" ON "Ticket"("categoryId");

-- CreateIndex
CREATE INDEX "Ticket_requesterId_idx" ON "Ticket"("requesterId");

-- CreateIndex
CREATE INDEX "Ticket_assigneeId_idx" ON "Ticket"("assigneeId");

-- CreateIndex
CREATE INDEX "Ticket_deviceId_idx" ON "Ticket"("deviceId");

-- CreateIndex
CREATE INDEX "Ticket_status_idx" ON "Ticket"("status");

-- CreateIndex
CREATE INDEX "Ticket_priority_idx" ON "Ticket"("priority");

-- CreateIndex
CREATE INDEX "Ticket_receivedAt_idx" ON "Ticket"("receivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "TicketHistory_code_key" ON "TicketHistory"("code");

-- CreateIndex
CREATE INDEX "TicketHistory_ticketId_idx" ON "TicketHistory"("ticketId");

-- CreateIndex
CREATE INDEX "TicketHistory_actorId_idx" ON "TicketHistory"("actorId");

-- CreateIndex
CREATE INDEX "TicketHistory_happenedAt_idx" ON "TicketHistory"("happenedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Maintenance_code_key" ON "Maintenance"("code");

-- CreateIndex
CREATE INDEX "Maintenance_code_idx" ON "Maintenance"("code");

-- CreateIndex
CREATE INDEX "Maintenance_deviceId_idx" ON "Maintenance"("deviceId");

-- CreateIndex
CREATE INDEX "Maintenance_performerId_idx" ON "Maintenance"("performerId");

-- CreateIndex
CREATE INDEX "Maintenance_performedAt_idx" ON "Maintenance"("performedAt");

-- CreateIndex
CREATE INDEX "Maintenance_maintenanceType_idx" ON "Maintenance"("maintenanceType");

-- CreateIndex
CREATE UNIQUE INDEX "Part_code_key" ON "Part"("code");

-- CreateIndex
CREATE INDEX "Part_code_idx" ON "Part"("code");

-- CreateIndex
CREATE INDEX "Part_status_idx" ON "Part"("status");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryTransaction_code_key" ON "InventoryTransaction"("code");

-- CreateIndex
CREATE INDEX "InventoryTransaction_code_idx" ON "InventoryTransaction"("code");

-- CreateIndex
CREATE INDEX "InventoryTransaction_partId_idx" ON "InventoryTransaction"("partId");

-- CreateIndex
CREATE INDEX "InventoryTransaction_happenedAt_idx" ON "InventoryTransaction"("happenedAt");

-- CreateIndex
CREATE INDEX "InventoryTransaction_type_idx" ON "InventoryTransaction"("type");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Device" ADD CONSTRAINT "Device_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "DeviceCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Device" ADD CONSTRAINT "Device_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Device" ADD CONSTRAINT "Device_assignedUserId_fkey" FOREIGN KEY ("assignedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "TicketCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketHistory" ADD CONSTRAINT "TicketHistory_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketHistory" ADD CONSTRAINT "TicketHistory_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Maintenance" ADD CONSTRAINT "Maintenance_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Maintenance" ADD CONSTRAINT "Maintenance_performerId_fkey" FOREIGN KEY ("performerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryTransaction" ADD CONSTRAINT "InventoryTransaction_partId_fkey" FOREIGN KEY ("partId") REFERENCES "Part"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
