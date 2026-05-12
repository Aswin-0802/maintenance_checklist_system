-- CreateTable
CREATE TABLE `User` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `role` ENUM('admin', 'staff', 'supervisor') NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Station` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Station_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Shift` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `stationId` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `startTime` VARCHAR(191) NOT NULL,
    `endTime` VARCHAR(191) NOT NULL,
    `timezone` VARCHAR(191) NOT NULL DEFAULT 'Asia/Kolkata',
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ShiftAssignment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `shiftId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,
    `assignmentRole` ENUM('staff', 'supervisor') NOT NULL,
    `assignmentDate` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ShiftAssignment_shiftId_userId_assignmentDate_assignmentRole_key`(`shiftId`, `userId`, `assignmentDate`, `assignmentRole`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ChecklistTemplate` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `stationId` INTEGER NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `version` INTEGER NOT NULL DEFAULT 1,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ChecklistTemplateItem` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `templateId` INTEGER NOT NULL,
    `label` VARCHAR(191) NOT NULL,
    `isMandatory` BOOLEAN NOT NULL DEFAULT false,
    `displayOrder` INTEGER NOT NULL,
    `inputType` ENUM('boolean', 'text', 'number') NOT NULL DEFAULT 'boolean',

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ChecklistSubmission` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `stationId` INTEGER NOT NULL,
    `shiftId` INTEGER NOT NULL,
    `templateId` INTEGER NOT NULL,
    `staffId` INTEGER NOT NULL,
    `submissionDate` DATETIME(3) NOT NULL,
    `status` ENUM('draft', 'submitted', 'approved', 'rejected') NOT NULL DEFAULT 'draft',
    `staffRemark` VARCHAR(191) NULL,
    `submittedAt` DATETIME(3) NULL,
    `supervisorId` INTEGER NULL,
    `supervisorComment` VARCHAR(191) NULL,
    `verifiedAt` DATETIME(3) NULL,
    `rejectionReason` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ChecklistSubmissionItem` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `submissionId` INTEGER NOT NULL,
    `templateItemId` INTEGER NOT NULL,
    `completed` BOOLEAN NOT NULL DEFAULT false,
    `valueText` VARCHAR(191) NULL,
    `remark` VARCHAR(191) NULL,

    UNIQUE INDEX `ChecklistSubmissionItem_submissionId_templateItemId_key`(`submissionId`, `templateItemId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Shift` ADD CONSTRAINT `Shift_stationId_fkey` FOREIGN KEY (`stationId`) REFERENCES `Station`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ShiftAssignment` ADD CONSTRAINT `ShiftAssignment_shiftId_fkey` FOREIGN KEY (`shiftId`) REFERENCES `Shift`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ShiftAssignment` ADD CONSTRAINT `ShiftAssignment_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChecklistTemplate` ADD CONSTRAINT `ChecklistTemplate_stationId_fkey` FOREIGN KEY (`stationId`) REFERENCES `Station`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChecklistTemplateItem` ADD CONSTRAINT `ChecklistTemplateItem_templateId_fkey` FOREIGN KEY (`templateId`) REFERENCES `ChecklistTemplate`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChecklistSubmission` ADD CONSTRAINT `ChecklistSubmission_stationId_fkey` FOREIGN KEY (`stationId`) REFERENCES `Station`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChecklistSubmission` ADD CONSTRAINT `ChecklistSubmission_shiftId_fkey` FOREIGN KEY (`shiftId`) REFERENCES `Shift`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChecklistSubmission` ADD CONSTRAINT `ChecklistSubmission_templateId_fkey` FOREIGN KEY (`templateId`) REFERENCES `ChecklistTemplate`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChecklistSubmission` ADD CONSTRAINT `ChecklistSubmission_staffId_fkey` FOREIGN KEY (`staffId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChecklistSubmission` ADD CONSTRAINT `ChecklistSubmission_supervisorId_fkey` FOREIGN KEY (`supervisorId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChecklistSubmissionItem` ADD CONSTRAINT `ChecklistSubmissionItem_submissionId_fkey` FOREIGN KEY (`submissionId`) REFERENCES `ChecklistSubmission`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChecklistSubmissionItem` ADD CONSTRAINT `ChecklistSubmissionItem_templateItemId_fkey` FOREIGN KEY (`templateItemId`) REFERENCES `ChecklistTemplateItem`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
