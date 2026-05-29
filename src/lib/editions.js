import { EDITIONS_TABLE, SUPABASE_DB_SCHEMA, supabase } from "./supabase.js";

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
