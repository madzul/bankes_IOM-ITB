-- AlterTable
CREATE SEQUENCE student_id_seq;
ALTER TABLE "Student" ALTER COLUMN "id" SET DEFAULT nextval('student_id_seq'),
ADD CONSTRAINT "Student_pkey" PRIMARY KEY ("id");
ALTER SEQUENCE student_id_seq OWNED BY "Student"."id";

-- DropIndex
DROP INDEX "Student_id_key";
