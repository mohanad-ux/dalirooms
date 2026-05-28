import type { Config, Context } from "@netlify/functions";
import { db } from "../../db/index.js";
import { siteSettings, translations } from "../../db/schema.js";
import { eq, and } from "drizzle-orm";

function unauthorized() {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}

function verifyAuth(req: Request): boolean {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Basic ")) return false;

  const decoded = atob(authHeader.slice(6));
  const [username, password] = decoded.split(":");

  const adminUser = Netlify.env.get("ADMIN_USERNAME") || "admin";
  const adminPass = Netlify.env.get("ADMIN_PASSWORD") || "dalirooms2026";

  return username === adminUser && password === adminPass;
}

export default async (req: Request, context: Context) => {
  const url = new URL(req.url);
  const path = url.pathname.replace("/api/admin", "");

  if (req.method === "POST" && path === "/login") {
    if (!verifyAuth(req)) return unauthorized();
    return Response.json({ success: true });
  }

  if (!verifyAuth(req)) return unauthorized();

  if (req.method === "GET" && path === "/settings") {
    const settings = await db.select().from(siteSettings);
    const result: Record<string, string> = {};
    for (const s of settings) {
      result[s.settingKey] = s.settingValue;
    }
    return Response.json(result);
  }

  if (req.method === "PUT" && path === "/settings") {
    const body = await req.json() as Record<string, string>;
    for (const [key, value] of Object.entries(body)) {
      const existing = await db.select().from(siteSettings).where(eq(siteSettings.settingKey, key));
      if (existing.length > 0) {
        await db.update(siteSettings).set({ settingValue: value, updatedAt: new Date() }).where(eq(siteSettings.settingKey, key));
      } else {
        await db.insert(siteSettings).values({ settingKey: key, settingValue: value });
      }
    }
    return Response.json({ success: true });
  }

  if (req.method === "GET" && path === "/translations") {
    const lang = url.searchParams.get("lang");
    let rows;
    if (lang) {
      rows = await db.select().from(translations).where(eq(translations.lang, lang));
    } else {
      rows = await db.select().from(translations);
    }
    const result: Record<string, Record<string, string>> = {};
    for (const row of rows) {
      if (!result[row.lang]) result[row.lang] = {};
      result[row.lang][row.translationKey] = row.translationValue;
    }
    return Response.json(result);
  }

  if (req.method === "PUT" && path === "/translations") {
    const body = await req.json() as Record<string, Record<string, string>>;
    for (const [lang, entries] of Object.entries(body)) {
      for (const [key, value] of Object.entries(entries)) {
        const existing = await db.select().from(translations).where(
          and(eq(translations.lang, lang), eq(translations.translationKey, key))
        );
        if (existing.length > 0) {
          await db.update(translations)
            .set({ translationValue: value, updatedAt: new Date() })
            .where(and(eq(translations.lang, lang), eq(translations.translationKey, key)));
        } else {
          await db.insert(translations).values({ lang, translationKey: key, translationValue: value });
        }
      }
    }
    return Response.json({ success: true });
  }

  return Response.json({ error: "Not found" }, { status: 404 });
};

export const config: Config = {
  path: "/api/admin/*",
};
