import { pgTable, serial, text, real, jsonb, timestamp } from "drizzle-orm/pg-core";

export const predictionLog = pgTable("prediction_log", {
  id: serial("id").primaryKey(),
  inputFeatures: jsonb("input_features").notNull(),
  prediction: text("prediction").notNull(),
  probabilities: jsonb("probabilities"),
  modelUsed: text("model_used").notNull().default("HistGradientBoosting"),
  samplingMethod: text("sampling_method").notNull().default("SMOTE"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
