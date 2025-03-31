/*
  Warnings:

  - Added the required column `name` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- First add the column as nullable
ALTER TABLE "users" ADD COLUMN "name" TEXT;

-- Update existing records
UPDATE "users" SET "name" = email WHERE "name" IS NULL;

-- Make the column required
ALTER TABLE "users" ALTER COLUMN "name" SET NOT NULL;
