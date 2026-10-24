CREATE TABLE "chsb_decks" (
	"id" serial PRIMARY KEY,
	"title" text NOT NULL,
	"subject" text DEFAULT 'Umumiy' NOT NULL,
	"grade" text DEFAULT '' NOT NULL,
	"quarter" text DEFAULT '' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"file_name" text DEFAULT '' NOT NULL,
	"size" integer DEFAULT 0 NOT NULL,
	"parts" integer DEFAULT 0 NOT NULL,
	"ready" boolean DEFAULT false NOT NULL,
	"views" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "course_progress" (
	"id" serial PRIMARY KEY,
	"user_id" text NOT NULL,
	"course" text NOT NULL,
	"completed" jsonb DEFAULT '[]' NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lessons" (
	"id" serial PRIMARY KEY,
	"course" text NOT NULL,
	"title" text NOT NULL,
	"video" text DEFAULT '' NOT NULL,
	"content" text DEFAULT '' NOT NULL,
	"quiz" jsonb DEFAULT '[]' NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" serial PRIMARY KEY,
	"sender_id" text NOT NULL,
	"receiver_id" text NOT NULL,
	"text" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "olympiad_questions" (
	"id" serial PRIMARY KEY,
	"olympiad_id" integer NOT NULL,
	"text" text NOT NULL,
	"options" jsonb DEFAULT '[]' NOT NULL,
	"answer" text NOT NULL,
	"points" integer DEFAULT 10 NOT NULL,
	"position" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "olympiad_submissions" (
	"id" serial PRIMARY KEY,
	"olympiad_id" integer NOT NULL,
	"user_id" text NOT NULL,
	"user_name" text DEFAULT '' NOT NULL,
	"answers" jsonb DEFAULT '{}' NOT NULL,
	"score" integer DEFAULT 0 NOT NULL,
	"max_score" integer DEFAULT 0 NOT NULL,
	"correct_count" integer DEFAULT 0 NOT NULL,
	"percent" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "olympiads" (
	"id" serial PRIMARY KEY,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"duration_minutes" integer DEFAULT 60 NOT NULL,
	"published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "problem_attempts" (
	"id" serial PRIMARY KEY,
	"problem_id" integer NOT NULL,
	"user_id" text NOT NULL,
	"answer" text NOT NULL,
	"correct" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "problems" (
	"id" serial PRIMARY KEY,
	"name" text NOT NULL,
	"statement" text NOT NULL,
	"input_format" text DEFAULT '' NOT NULL,
	"output_format" text DEFAULT '' NOT NULL,
	"example" text DEFAULT '' NOT NULL,
	"answer" text DEFAULT '' NOT NULL,
	"difficulty" text DEFAULT 'Oson' NOT NULL,
	"category" text DEFAULT 'Umumiy' NOT NULL,
	"points" integer DEFAULT 10 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" text PRIMARY KEY,
	"name" text DEFAULT '' NOT NULL,
	"email" text DEFAULT '' NOT NULL,
	"phone" text DEFAULT '' NOT NULL,
	"role" text DEFAULT 'user' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_seen_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "course_progress_user_course_uq" ON "course_progress" ("user_id","course");--> statement-breakpoint
CREATE INDEX "lessons_course_idx" ON "lessons" ("course");--> statement-breakpoint
CREATE INDEX "messages_pair_idx" ON "messages" ("sender_id","receiver_id");--> statement-breakpoint
CREATE INDEX "olympiad_questions_olympiad_idx" ON "olympiad_questions" ("olympiad_id");--> statement-breakpoint
CREATE UNIQUE INDEX "olympiad_submissions_user_uq" ON "olympiad_submissions" ("olympiad_id","user_id");--> statement-breakpoint
CREATE INDEX "problem_attempts_user_idx" ON "problem_attempts" ("user_id","problem_id");--> statement-breakpoint
ALTER TABLE "olympiad_questions" ADD CONSTRAINT "olympiad_questions_olympiad_id_olympiads_id_fkey" FOREIGN KEY ("olympiad_id") REFERENCES "olympiads"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "olympiad_submissions" ADD CONSTRAINT "olympiad_submissions_olympiad_id_olympiads_id_fkey" FOREIGN KEY ("olympiad_id") REFERENCES "olympiads"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "problem_attempts" ADD CONSTRAINT "problem_attempts_problem_id_problems_id_fkey" FOREIGN KEY ("problem_id") REFERENCES "problems"("id") ON DELETE CASCADE;