import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    username: v.string(),
    passwordHash: v.string(),
  }).index("by_username", ["username"]),

  profiles: defineTable({
    shareId: v.string(),
    passwordHash: v.optional(v.string()),
    userId: v.optional(v.id("users")),
    name: v.string(),
    pronouns: v.optional(v.string()),
    photoUrl: v.optional(v.string()),
    data: v.any(), // Flexible JSON for measurements, categories, hair, sets
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_shareId", ["shareId"])
    .index("by_userId", ["userId"]),
});
