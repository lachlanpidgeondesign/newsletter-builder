import { EDITIONS_TABLE, SUPABASE_DB_SCHEMA, supabase } from "./supabase.js";

export const EDITION_VERSIONS_TABLE = "edition_versions";

function throwIfSupabaseError(error) {
  if (!error) return;

  const isMissingTableError =
    error.code === "PGRST205" ||
    /schema cache/i.test(error.message || "") ||
    /Could not find the table/i.test(error.message || "");

  if (isMissingTableError) {
    throw new Error(
      `Could not find table '${SUPABASE_DB_SCHEMA}.${EDITIONS_TABLE}'. Check table name/schema or set VITE_SUPABASE_DB_SCHEMA and VITE_SUPABASE_EDITIONS_TABLE in your env.`
    );
  }

  throw error;
}

function mapEditionRow(row) {
  if (!row) return null;

  return {
    id: row.id,
    subject: row.subject,
    releaseDate: row.release_date,
    status: row.status,
    blocks: Array.isArray(row.blocks) ? row.blocks : [],
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function getCurrentUserEmail() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) throw error;
  if (!user?.email) {
    throw new Error("You must be signed in to manage editions.");
  }

  return user.email;
}

export async function listEditions() {
  const { data, error } = await supabase
    .from(EDITIONS_TABLE)
    .select("id, subject, release_date, status, blocks, created_by, created_at, updated_at")
    .order("release_date", { ascending: false })
    .order("created_at", { ascending: false });

  throwIfSupabaseError(error);
  return (data || []).map(mapEditionRow);
}

export async function getEdition(id) {
  const { data, error } = await supabase
    .from(EDITIONS_TABLE)
    .select("id, subject, release_date, status, blocks, created_by, created_at, updated_at")
    .eq("id", id)
    .single();

  throwIfSupabaseError(error);
  return mapEditionRow(data);
}

export async function saveNewEdition({ subject, releaseDate, status, blocks }) {
  const email = await getCurrentUserEmail();

  const payload = {
    subject,
    release_date: releaseDate,
    status,
    blocks,
    created_by: email,
  };

  const { data, error } = await supabase
    .from(EDITIONS_TABLE)
    .insert(payload)
    .select("id, subject, release_date, status, blocks, created_by, created_at, updated_at")
    .single();

  throwIfSupabaseError(error);
  return mapEditionRow(data);
}

export async function updateEdition(id, { subject, releaseDate, status, blocks }) {
  // Snapshot-on-update strategy: we run two client queries instead of a
  // Postgres RPC. We INSERT the current edition row into edition_versions
  // first; if that fails we abort and never touch the edition. If the
  // snapshot succeeds but the subsequent UPDATE fails, we surface the
  // error to the caller and accept the orphan history entry (it just
  // duplicates the still-current state — harmless, not lossy).
  const snapshotEmail = await getCurrentUserEmail();

  const { data: current, error: fetchError } = await supabase
    .from(EDITIONS_TABLE)
    .select("id, subject, release_date, status, blocks")
    .eq("id", id)
    .single();

  throwIfSupabaseError(fetchError);
  if (!current) throw new Error("Edition not found.");

  const { error: snapshotError } = await supabase
    .from(EDITION_VERSIONS_TABLE)
    .insert({
      edition_id: current.id,
      subject: current.subject,
      release_date: current.release_date,
      status: current.status,
      blocks: current.blocks,
      saved_by: snapshotEmail,
    });

  throwIfSupabaseError(snapshotError);

  const payload = {
    subject,
    release_date: releaseDate,
    status,
    blocks,
  };

  const { data, error } = await supabase
    .from(EDITIONS_TABLE)
    .update(payload)
    .eq("id", id)
    .select("id, subject, release_date, status, blocks, created_by, created_at, updated_at")
    .single();

  throwIfSupabaseError(error);
  return mapEditionRow(data);
}

export async function deleteEdition(id) {
  const { error } = await supabase.from(EDITIONS_TABLE).delete().eq("id", id);

  throwIfSupabaseError(error);
}

function mapVersionRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    editionId: row.edition_id,
    subject: row.subject,
    releaseDate: row.release_date,
    status: row.status,
    blocks: Array.isArray(row.blocks) ? row.blocks : [],
    savedBy: row.saved_by,
    savedAt: row.saved_at,
  };
}

export async function listVersions(editionId) {
  const { data, error } = await supabase
    .from(EDITION_VERSIONS_TABLE)
    .select("id, edition_id, subject, release_date, status, blocks, saved_by, saved_at")
    .eq("edition_id", editionId)
    .order("saved_at", { ascending: false });

  throwIfSupabaseError(error);
  return (data || []).map(mapVersionRow);
}

export async function getVersion(versionId) {
  const { data, error } = await supabase
    .from(EDITION_VERSIONS_TABLE)
    .select("id, edition_id, subject, release_date, status, blocks, saved_by, saved_at")
    .eq("id", versionId)
    .single();

  throwIfSupabaseError(error);
  return mapVersionRow(data);
}

export async function restoreVersion(versionId) {
  // Restore is built on updateEdition so the current state is snapshotted
  // into history first — restores are themselves reversible.
  const version = await getVersion(versionId);
  if (!version) throw new Error("Version not found.");

  return updateEdition(version.editionId, {
    subject: version.subject,
    releaseDate: version.releaseDate,
    status: version.status,
    blocks: version.blocks,
  });
}
