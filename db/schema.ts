import { pgTable, serial, text, timestamp, integer, boolean, jsonb, uniqueIndex, index } from "drizzle-orm/pg-core";

// Netlify Identity user id -> public profile used in rating, chat and admin lists
export const profiles = pgTable("profiles", {
  id: text().primaryKey(),
  name: text().notNull().default(""),
  email: text().notNull().default(""),
  phone: text().notNull().default(""),
  role: text().notNull().default("user"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastSeenAt: timestamp("last_seen_at").defaultNow().notNull(),
});

export const olympiads = pgTable("olympiads", {
  id: serial().primaryKey(),
  name: text().notNull(),
  description: text().notNull().default(""),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
  durationMinutes: integer("duration_minutes").notNull().default(60),
  published: boolean().notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const olympiadQuestions = pgTable("olympiad_questions", {
  id: serial().primaryKey(),
  olympiadId: integer("olympiad_id").notNull().references(() => olympiads.id, { onDelete: "cascade" }),
  text: text().notNull(),
  // Empty array = open answer; otherwise multiple choice and `answer` holds the correct option text
  options: jsonb().$type<string[]>().notNull().default([]),
  answer: text().notNull(),
  points: integer().notNull().default(10),
  position: integer().notNull().default(0),
}, t => [index("olympiad_questions_olympiad_idx").on(t.olympiadId)]);

export const olympiadSubmissions = pgTable("olympiad_submissions", {
  id: serial().primaryKey(),
  olympiadId: integer("olympiad_id").notNull().references(() => olympiads.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),
  userName: text("user_name").notNull().default(""),
  answers: jsonb().$type<Record<string, string>>().notNull().default({}),
  score: integer().notNull().default(0),
  maxScore: integer("max_score").notNull().default(0),
  correctCount: integer("correct_count").notNull().default(0),
  percent: integer().notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, t => [uniqueIndex("olympiad_submissions_user_uq").on(t.olympiadId, t.userId)]);

export const problems = pgTable("problems", {
  id: serial().primaryKey(),
  name: text().notNull(),
  statement: text().notNull(),
  inputFormat: text("input_format").notNull().default(""),
  outputFormat: text("output_format").notNull().default(""),
  example: text().notNull().default(""),
  answer: text().notNull().default(""),
  difficulty: text().notNull().default("Oson"),
  category: text().notNull().default("Umumiy"),
  points: integer().notNull().default(10),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const problemAttempts = pgTable("problem_attempts", {
  id: serial().primaryKey(),
  problemId: integer("problem_id").notNull().references(() => problems.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),
  answer: text().notNull(),
  correct: boolean().notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, t => [index("problem_attempts_user_idx").on(t.userId, t.problemId)]);

// Extra lessons added from the admin panel on top of the built-in course content
export const lessons = pgTable("lessons", {
  id: serial().primaryKey(),
  course: text().notNull(),
  title: text().notNull(),
  video: text().notNull().default(""),
  content: text().notNull().default(""),
  quiz: jsonb().$type<{ q: string; options: string[]; correct: number; explain?: string }[]>().notNull().default([]),
  position: integer().notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, t => [index("lessons_course_idx").on(t.course)]);

export const courseProgress = pgTable("course_progress", {
  id: serial().primaryKey(),
  userId: text("user_id").notNull(),
  course: text().notNull(),
  completed: jsonb().$type<string[]>().notNull().default([]),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, t => [uniqueIndex("course_progress_user_course_uq").on(t.userId, t.course)]);

export const messages = pgTable("messages", {
  id: serial().primaryKey(),
  senderId: text("sender_id").notNull(),
  receiverId: text("receiver_id").notNull(),
  text: text().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, t => [index("messages_pair_idx").on(t.senderId, t.receiverId)]);

// ChSB slide decks; the PDF bytes live in Netlify Blobs as `<id>/<part>` chunks
export const chsbDecks = pgTable("chsb_decks", {
  id: serial().primaryKey(),
  title: text().notNull(),
  subject: text().notNull().default("Umumiy"),
  grade: text().notNull().default(""),
  quarter: text().notNull().default(""),
  description: text().notNull().default(""),
  fileName: text("file_name").notNull().default(""),
  size: integer().notNull().default(0),
  parts: integer().notNull().default(0),
  ready: boolean().notNull().default(false),
  views: integer().notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
