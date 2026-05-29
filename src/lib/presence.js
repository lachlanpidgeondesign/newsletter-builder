import { supabase } from "./supabase.js";
import { useCurrentUser } from "./auth.js";
import { useEffect, useRef, useState } from "react";

const PRESENCE_TABLE = "edition_presence";

async function getCurrentUserEmail() {
  // Use the same logic as editions.js
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error) throw error;
  if (!user?.email) throw new Error("You must be signed in.");
  return user.email;
}

export async function heartbeat(editionId) {
  if (!editionId) return;
  const email = await getCurrentUserEmail();
  await supabase.from(PRESENCE_TABLE).upsert({
    edition_id: editionId,
    user_email: email,
    last_seen_at: new Date().toISOString(),
  });
}

export async function clearPresence(editionId) {
  if (!editionId) return;
  const email = await getCurrentUserEmail();
  await supabase.from(PRESENCE_TABLE)
    .delete()
    .eq("edition_id", editionId)
    .eq("user_email", email);
}

export async function getActiveEditors(editionId) {
  if (!editionId) return [];
  const email = await getCurrentUserEmail();
  const since = new Date(Date.now() - 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from(PRESENCE_TABLE)
    .select("user_email, last_seen_at")
    .eq("edition_id", editionId)
    .gt("last_seen_at", since);
  if (error) throw error;
  return (data || []).filter((row) => row.user_email !== email);
}

export function useActiveEditors(editionId) {
  const [editors, setEditors] = useState([]);
  const intervalRef = useRef();
  const user = useCurrentUser();

  useEffect(() => {
    let cancelled = false;
    async function poll() {
      try {
        const list = await getActiveEditors(editionId);
        if (!cancelled) setEditors(list);
      } catch {
        if (!cancelled) setEditors([]);
      }
    }
    if (editionId && user) {
      poll();
      intervalRef.current = setInterval(poll, 15000);
    } else {
      setEditors([]);
    }
    return () => {
      cancelled = true;
      clearInterval(intervalRef.current);
    };
  }, [editionId, user]);
  return editors;
}
