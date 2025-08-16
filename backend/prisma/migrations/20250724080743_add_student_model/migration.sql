/*
  Warnings:

  - You are about to alter the column `prefix` on the `courses` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(10)`.
  - You are about to drop the column `courseId` on the `students` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[prefix]` on the table `courses` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `courses` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "students" DROP CONSTRAINT "students_courseId_fkey";

-- AlterTable
ALTER TABLE "courses" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "prefix" SET DATA TYPE VARCHAR(10);

-- AlterTable
ALTER TABLE "students" DROP COLUMN "courseId";

-- CreateTable
CREATE TABLE "student_courses" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "examResult" BOOLEAN NOT NULL DEFAULT false,
    "certificateNumber" TEXT,
    "certificateUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_courses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "student_courses_certificateNumber_idx" ON "student_courses"("certificateNumber");

-- CreateIndex
CREATE UNIQUE INDEX "student_courses_studentId_courseId_key" ON "student_courses"("studentId", "courseId");

-- CreateIndex
CREATE UNIQUE INDEX "courses_prefix_key" ON "courses"("prefix");

-- AddForeignKey
ALTER TABLE "student_courses" ADD CONSTRAINT "student_courses_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_courses" ADD CONSTRAINT "student_courses_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
