/*
  Warnings:

  - You are about to drop the column `createdAt` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Project` DROP COLUMN `createdAt`,
    ADD COLUMN `supervisorId` INTEGER NULL,
    MODIFY `description` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `User` DROP COLUMN `createdAt`,
    ADD COLUMN `role` ENUM('STUDENT', 'SUPERVISOR', 'ADMIN') NOT NULL DEFAULT 'STUDENT',
    MODIFY `cardNumber` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE INDEX `Project_supervisorId_idx` ON `Project`(`supervisorId`);

-- AddForeignKey
ALTER TABLE `Project` ADD CONSTRAINT `Project_supervisorId_fkey` FOREIGN KEY (`supervisorId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
