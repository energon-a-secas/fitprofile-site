import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Simple hash function (for password protection)
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}

export const getByShareId = query({
  args: { shareId: v.string() },
  handler: async (ctx, { shareId }) => {
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_shareId", (q) => q.eq("shareId", shareId))
      .first();

    if (!profile) {
      return null;
    }

    // Return profile with hasPassword flag (don't expose the hash)
    return {
      ...profile,
      hasPassword: !!profile.passwordHash,
      passwordHash: undefined, // Don't send hash to client
    };
  },
});

export const save = mutation({
  args: {
    shareId: v.optional(v.string()),
    userId: v.optional(v.id("users")),
    name: v.string(),
    pronouns: v.optional(v.string()),
    photoUrl: v.optional(v.string()),
    data: v.any(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    if (args.shareId) {
      // Update existing profile
      const existing = await ctx.db
        .query("profiles")
        .withIndex("by_shareId", (q) => q.eq("shareId", args.shareId))
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, {
          name: args.name,
          pronouns: args.pronouns,
          photoUrl: args.photoUrl,
          data: args.data,
          updatedAt: now,
        });
        return { shareId: args.shareId };
      }
    }

    // Create new profile - shareId will be generated client-side
    // (because nanoid isn't available server-side without special setup)
    throw new Error("shareId is required for new profiles");
  },
});

export const create = mutation({
  args: {
    shareId: v.string(),
    userId: v.optional(v.id("users")),
    name: v.string(),
    pronouns: v.optional(v.string()),
    photoUrl: v.optional(v.string()),
    data: v.any(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const profileId = await ctx.db.insert("profiles", {
      shareId: args.shareId,
      userId: args.userId,
      name: args.name,
      pronouns: args.pronouns,
      photoUrl: args.photoUrl,
      data: args.data,
      createdAt: now,
      updatedAt: now,
    });

    return { profileId, shareId: args.shareId };
  },
});

export const list = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const profiles = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    return profiles.map(p => ({
      _id: p._id,
      shareId: p.shareId,
      name: p.name,
      updatedAt: p.updatedAt,
    }));
  },
});

export const updatePassword = mutation({
  args: {
    shareId: v.string(),
    password: v.optional(v.string()),
  },
  handler: async (ctx, { shareId, password }) => {
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_shareId", (q) => q.eq("shareId", shareId))
      .first();

    if (!profile) {
      throw new Error("Profile not found");
    }

    const passwordHash = password ? simpleHash(password) : undefined;
    await ctx.db.patch(profile._id, { passwordHash });

    return { success: true };
  },
});

export const verifyPassword = mutation({
  args: {
    shareId: v.string(),
    password: v.string(),
  },
  handler: async (ctx, { shareId, password }) => {
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_shareId", (q) => q.eq("shareId", shareId))
      .first();

    if (!profile || !profile.passwordHash) {
      return { valid: false };
    }

    const hash = simpleHash(password);
    return { valid: hash === profile.passwordHash };
  },
});
