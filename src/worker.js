// API penilaian juri Lomba Project MKWK Nasional 2026.
//
// Semua request selain /api/* dilayani langsung sebagai static asset (lihat
// "run_worker_first": ["/api/*"] di wrangler.jsonc) — worker ini hanya
// menangani baca/tulis skor juri ke D1.

const CRITERIA = new Set(["a1", "a2", "a3", "b1", "b2"]);

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/scores" && request.method === "GET") {
      return handleGetScores(request, env);
    }
    if (url.pathname === "/api/scores" && request.method === "POST") {
      return handlePostScores(request, env);
    }
    if (url.pathname === "/api/scores" && request.method === "DELETE") {
      return handleDeleteScore(request, env);
    }

    // Fallback: untuk path /api/* lain yang tidak dikenal, dan sebagai
    // jaring pengaman jika run_worker_first menangkap path di luar /api/*.
    if (url.pathname.startsWith("/api/")) {
      return json({ error: "not_found" }, 404);
    }
    return env.ASSETS.fetch(request);
  },
};

async function handleGetScores(request, env) {
  if (!isAuthorized(request, env)) {
    return json({ error: "unauthorized" }, 401);
  }
  const { results } = await env.DB.prepare(
    "SELECT team_slug, juror_name, criterion, score, note, updated_at FROM scores ORDER BY team_slug, juror_name, criterion"
  ).all();
  return json({ scores: results });
}

async function handlePostScores(request, env) {
  if (!isAuthorized(request, env)) {
    return json({ error: "unauthorized" }, 401);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "invalid_json" }, 400);
  }

  const teamSlug = typeof body.team_slug === "string" ? body.team_slug.trim() : "";
  const jurorName = typeof body.juror_name === "string" ? body.juror_name.trim() : "";
  const entries = Array.isArray(body.entries) ? body.entries : null;

  if (!teamSlug || !jurorName || jurorName.length > 80 || !entries || entries.length === 0) {
    return json({ error: "invalid_payload" }, 400);
  }

  const statements = [];
  for (const entry of entries) {
    const criterion = entry && entry.criterion;
    const score = entry ? Number(entry.score) : NaN;
    const note = entry && typeof entry.note === "string" ? entry.note.slice(0, 500) : null;

    if (!CRITERIA.has(criterion) || !Number.isFinite(score) || score < 0 || score > 100) {
      return json({ error: "invalid_entry", criterion }, 400);
    }

    statements.push(
      env.DB.prepare(
        `INSERT INTO scores (team_slug, juror_name, criterion, score, note, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, datetime('now'))
         ON CONFLICT(team_slug, juror_name, criterion)
         DO UPDATE SET score = excluded.score, note = excluded.note, updated_at = datetime('now')`
      ).bind(teamSlug, jurorName, criterion, score, note)
    );
  }

  await env.DB.batch(statements);
  return json({ ok: true, saved: statements.length });
}

async function handleDeleteScore(request, env) {
  if (!isAuthorized(request, env)) {
    return json({ error: "unauthorized" }, 401);
  }
  const url = new URL(request.url);
  const teamSlug = url.searchParams.get("team_slug");
  const jurorName = url.searchParams.get("juror_name");
  if (!teamSlug || !jurorName) return json({ error: "invalid_payload" }, 400);

  await env.DB.prepare("DELETE FROM scores WHERE team_slug = ?1 AND juror_name = ?2")
    .bind(teamSlug, jurorName)
    .run();
  return json({ ok: true });
}

function isAuthorized(request, env) {
  const auth = request.headers.get("Authorization") || "";
  const expected = `Bearer ${env.JURI_TOKEN}`;
  return env.JURI_TOKEN && auth === expected;
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}
