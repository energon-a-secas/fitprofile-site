import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Simple hash function (non-cryptographic, for demo purposes)
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}

export const register = mutation({
  args: { username: v.string(), password: v.string() },
  handler: async (ctx, { username, password }) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", username))
      .first();

    if (existing) {
      throw new Error("Username already exists");
    }

    const passwordHash = simpleHash(password);
    const userId = await ctx.db.insert("users", {
      username,
      passwordHash,
    });

    return { userId, username };
  },
});

export const login = mutation({
  args: { username: v.string(), password: v.string() },
  handler: async (ctx, { username, password }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", username))
      .first();

    if (!user) {
      throw new Error("Invalid username or password");
    }

    const passwordHash = simpleHash(password);
    if (user.passwordHash !== passwordHash) {
      throw new Error("Invalid username or password");
    }

    return { userId: user._id, username: user.username };
  },
});
