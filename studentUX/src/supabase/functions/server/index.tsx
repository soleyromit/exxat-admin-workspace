import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-c506463a/health", (c) => {
  return c.json({ 
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

// KV Store routes
app.get("/make-server-c506463a/kv/:key", async (c) => {
  try {
    const key = c.req.param('key');
    const value = await kv.get(key);
    if (value === null) {
      return c.json({ error: "Key not found" }, 404);
    }
    return c.json({ key, value });
  } catch (error) {
    console.log('KV get error:', error);
    return c.json({ error: String(error) }, 500);
  }
});

app.post("/make-server-c506463a/kv/:key", async (c) => {
  try {
    const key = c.req.param('key');
    const body = await c.req.json();
    await kv.set(key, body.value);
    return c.json({ success: true, key });
  } catch (error) {
    console.log('KV set error:', error);
    return c.json({ error: String(error) }, 500);
  }
});

app.delete("/make-server-c506463a/kv/:key", async (c) => {
  try {
    const key = c.req.param('key');
    await kv.del(key);
    return c.json({ success: true, key });
  } catch (error) {
    console.log('KV delete error:', error);
    return c.json({ error: String(error) }, 500);
  }
});

app.get("/make-server-c506463a/kv-prefix/:prefix", async (c) => {
  try {
    const prefix = c.req.param('prefix');
    const results = await kv.getByPrefix(prefix);
    return c.json({ prefix, results });
  } catch (error) {
    console.log('KV getByPrefix error:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// ── Adobe Fonts / Typekit Integration ────────────────────────────────────────
//
// RESEARCH FINDINGS:
//   The provided ADOBE_FONTS_API_TOKEN is NOT a Typekit management API token
//   (those require an enterprise/admin account). It gets 401 on /kits endpoints.
//
//   Correct approach: Use the Typekit Kit/Project system.
//   1. User creates a "Web Project" at fonts.adobe.com with IvyPresto Display
//   2. That generates a short kit ID (e.g. "abc1def")
//   3. We load CSS from: https://use.typekit.net/{kitId}.css
//   4. CSS token stack: --font-display-email-stack (ivypresto-display + ivypresto-headline + Georgia)
//
//   OR: Use the token as a Typekit JS embed token with the async loader.

const TYPEKIT_API = 'https://typekit.com/api/v1/json';

// In-memory cache
let cachedKitIdInMemory: string | null = null;

// Default kit ID — user's existing Adobe Fonts web project that includes IvyPresto Display.
// Loading the CSS from use.typekit.net is read-only and will NOT affect the existing website.
const DEFAULT_KIT_ID = 'kmo8bbz';

// Safe KV helpers — never throw
async function safeKvGet(key: string): Promise<string | null> {
  try {
    return await kv.get(key);
  } catch (err) {
    console.log(`KV get("${key}") failed (non-fatal): ${err}`);
    return null;
  }
}

async function safeKvSet(key: string, value: string): Promise<void> {
  try {
    await kv.set(key, value);
  } catch (err) {
    console.log(`KV set("${key}") failed (non-fatal): ${err}`);
  }
}

// GET /fonts/setup — Returns a kit ID for loading IvyPresto Display.
// Strategy:
//   1. Check in-memory cache
//   2. Check KV cache
//   3. Try Typekit API with the token (in case it's a valid management token)
//   4. If API fails, try using the token itself as a Typekit kit ID
//   5. If all else fail, return fallback instructions
app.get("/make-server-c506463a/fonts/setup", async (c) => {
  try {
    // 1. In-memory cache (fastest)
    if (cachedKitIdInMemory) {
      console.log(`Adobe Fonts: returning cached kit ${cachedKitIdInMemory}`);
      return c.json({ kitId: cachedKitIdInMemory, cached: true });
    }

    // 2. KV cache
    const kvKit = await safeKvGet('adobe-fonts-kit-id');
    if (kvKit) {
      cachedKitIdInMemory = kvKit;
      console.log(`Adobe Fonts: returning KV-cached kit ${kvKit}`);
      return c.json({ kitId: kvKit, cached: true });
    }

    // 3. Try Typekit API — list existing kits to find one with IvyPresto Display
    const token = Deno.env.get('ADOBE_FONTS_API_TOKEN') || '';
    console.log(`Adobe Fonts: token present (length=${token.length}), trying Typekit API…`);

    if (token.length >= 20) {
      try {
        const kitsRes = await fetch(`${TYPEKIT_API}/kits`, {
          headers: { 'X-Typekit-Token': token },
        });

        if (kitsRes.ok) {
          const kitsData = await kitsRes.json();
          const kits = kitsData?.kits || [];
          console.log(`Adobe Fonts: found ${kits.length} existing kit(s) via API`);

          // Search for a kit containing IvyPresto Display
          for (const kitRef of kits) {
            if (!kitRef?.id) continue;
            try {
              const detailRes = await fetch(`${TYPEKIT_API}/kits/${kitRef.id}`, {
                headers: { 'X-Typekit-Token': token },
              });
              if (detailRes.ok) {
                const detail = await detailRes.json();
                const families = detail?.kit?.families || [];
                const hasIvy = families.some((f: any) =>
                  f.slug === 'ivypresto-display' || f.id === 'trgj'
                );
                if (hasIvy) {
                  cachedKitIdInMemory = kitRef.id;
                  await safeKvSet('adobe-fonts-kit-id', kitRef.id);
                  console.log(`Adobe Fonts: found existing kit ${kitRef.id} with IvyPresto Display`);
                  return c.json({ kitId: kitRef.id, source: 'api-existing' });
                }
              }
            } catch (e) {
              console.log(`Adobe Fonts: couldn't inspect kit ${kitRef.id}: ${e}`);
            }
          }

          // No existing kit found → try to create one
          console.log('Adobe Fonts: no existing kit with IvyPresto, creating…');
          const createBody = new URLSearchParams();
          createBody.append('name', 'ExxatOne');
          createBody.append('domains[]', '*');
          createBody.append('families[0][id]', 'trgj');
          createBody.append('families[0][variations]', 'n4,i4,n7,i7');

          const createRes = await fetch(`${TYPEKIT_API}/kits`, {
            method: 'POST',
            headers: {
              'X-Typekit-Token': token,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: createBody.toString(),
          });

          if (createRes.ok) {
            const createData = await createRes.json();
            const newKitId = createData?.kit?.id;
            if (newKitId) {
              // Publish it
              await fetch(`${TYPEKIT_API}/kits/${newKitId}/publish`, {
                method: 'POST',
                headers: { 'X-Typekit-Token': token },
              });
              cachedKitIdInMemory = newKitId;
              await safeKvSet('adobe-fonts-kit-id', newKitId);
              console.log(`Adobe Fonts: created and published kit ${newKitId}`);
              return c.json({
                kitId: newKitId,
                source: 'api-created',
                cssUrl: `https://use.typekit.net/${newKitId}.css`,
              });
            }
          } else {
            const errText = await createRes.text();
            console.log(`Adobe Fonts: kit creation failed ${createRes.status}: ${errText}`);
          }
        } else {
          console.log(`Adobe Fonts: /kits returned ${kitsRes.status} — token not valid for API management`);
        }
      } catch (e) {
        console.log(`Adobe Fonts: API attempt failed: ${e}`);
      }
    }

    // 4. API didn't work — fall back to the default kit ID (user's existing web project).
    //    Loading CSS from use.typekit.net is read-only — it will NOT affect the existing website.
    console.log(`Adobe Fonts: API not available, using default kit ${DEFAULT_KIT_ID}`);
    
    // Verify the default kit CSS is accessible
    const cssUrl = `https://use.typekit.net/${DEFAULT_KIT_ID}.css`;
    try {
      const verifyRes = await fetch(cssUrl, { method: 'HEAD' });
      if (verifyRes.ok) {
        cachedKitIdInMemory = DEFAULT_KIT_ID;
        await safeKvSet('adobe-fonts-kit-id', DEFAULT_KIT_ID);
        console.log(`Adobe Fonts: default kit ${DEFAULT_KIT_ID} verified and cached`);
        return c.json({
          kitId: DEFAULT_KIT_ID,
          source: 'default',
          cssUrl,
          fontFamily: '"ivypresto-display", "ivypresto-headline", Georgia, serif',
        });
      } else {
        console.log(`Adobe Fonts: default kit CSS returned ${verifyRes.status}`);
      }
    } catch (e) {
      console.log(`Adobe Fonts: could not verify default kit: ${e}`);
    }

    // 5. Nothing worked — return fallback instructions
    console.log('Adobe Fonts: could not auto-configure. Returning manual setup instructions.');
    return c.json({
      error: 'auto-setup-failed',
      message: 'Could not load Adobe Fonts kit.',
      fallbackFont: 'Georgia, serif',
    }, 422);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.log(`Adobe Fonts setup error: ${msg}`);
    return c.json({ error: `Adobe Fonts setup failed: ${msg}` }, 500);
  }
});

// POST /fonts/set-kit — Manually set the Typekit kit/project ID
app.post("/make-server-c506463a/fonts/set-kit", async (c) => {
  try {
    const body = await c.req.json();
    const kitId = body?.kitId?.trim();

    if (!kitId || typeof kitId !== 'string' || kitId.length < 3 || kitId.length > 20) {
      return c.json({ error: 'Provide a valid kitId (3-20 character Typekit project ID)' }, 400);
    }

    // Verify the kit CSS is accessible
    console.log(`Adobe Fonts: verifying kit ${kitId}…`);
    const cssUrl = `https://use.typekit.net/${kitId}.css`;
    const verifyRes = await fetch(cssUrl, { method: 'HEAD' });

    if (!verifyRes.ok) {
      console.log(`Adobe Fonts: kit ${kitId} CSS returned ${verifyRes.status}`);
      return c.json({
        error: `Kit "${kitId}" could not be verified — ${cssUrl} returned ${verifyRes.status}`,
        hint: 'Make sure the web project is published at fonts.adobe.com',
      }, 400);
    }

    // Cache it
    cachedKitIdInMemory = kitId;
    await safeKvSet('adobe-fonts-kit-id', kitId);
    console.log(`Adobe Fonts: kit ${kitId} set and verified ✓`);

    return c.json({
      kitId,
      cssUrl,
      fontFamily: '"ivypresto-display", "ivypresto-headline", Georgia, serif',
      message: 'Kit ID saved. The font will load on next page refresh.',
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.log(`Adobe Fonts set-kit error: ${msg}`);
    return c.json({ error: msg }, 500);
  }
});

// GET /fonts/kit — Read cached kit ID
app.get("/make-server-c506463a/fonts/kit", async (c) => {
  if (cachedKitIdInMemory) {
    return c.json({ kitId: cachedKitIdInMemory });
  }
  const kvKit = await safeKvGet('adobe-fonts-kit-id');
  if (kvKit) {
    cachedKitIdInMemory = kvKit;
    return c.json({ kitId: kvKit });
  }
  return c.json({ error: 'No kit configured. POST to /fonts/set-kit or call /fonts/setup.' }, 404);
});

// GET /fonts/diagnose — Debug endpoint
app.get("/make-server-c506463a/fonts/diagnose", async (c) => {
  const token = Deno.env.get('ADOBE_FONTS_API_TOKEN');

  const probe = async (url: string, headers: Record<string, string> = {}) => {
    try {
      const res = await fetch(url, { headers });
      return { url, status: res.status, ok: res.ok };
    } catch (err) {
      return { url, status: 0, ok: false, error: String(err) };
    }
  };

  const typekitHeaders = token ? { 'X-Typekit-Token': token } : {};
  const [kits, family] = await Promise.all([
    probe(`${TYPEKIT_API}/kits`, typekitHeaders),
    probe(`${TYPEKIT_API}/families/ivypresto-display`),
  ]);

  return c.json({
    token: { present: !!token, length: token?.length || 0, prefix: token ? token.substring(0, 8) + '…' : '' },
    cache: { inMemory: cachedKitIdInMemory, kv: await safeKvGet('adobe-fonts-kit-id') },
    apiAccess: {
      kitsEndpoint: kits,
      familyEndpoint: family,
      canManageKits: kits.ok,
    },
    summary: kits.ok
      ? 'Token has API access — /fonts/setup will auto-create kits'
      : 'Token lacks API access — use /fonts/set-kit to manually provide a kit ID',
  });
});

// Catch-all
app.all("*", (c) => {
  return c.json({ error: "Not found" }, 404);
});

Deno.serve(app.fetch);
console.log('Server started');