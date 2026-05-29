import { useEffect, useState } from "react";
import { supabase } from "./supabase.js";

function getOAuthRedirectTo() {
  const configured = import.meta.env.VITE_SUPABASE_AUTH_REDIRECT_TO;
  if (configured) return configured;

  // Keep redirect stable so it matches Supabase allow-list entries.
  return `${window.location.origin}${window.location.pathname}`;
}

export async function signInWithGoogle() {
  const redirectTo = getOAuthRedirectTo();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      skipBrowserRedirect: true,
      queryParams: { prompt: "select_account" },
    },
  });

  if (error) {
    throw new Error(error.message || "Could not start Google sign-in.");
  }

  if (!data?.url) {
    throw new Error(
      `Google sign-in did not return a redirect URL. Check Supabase Auth redirect allow-list for: ${redirectTo}`
    );
  }

  window.location.assign(data.url);
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw error;
  }
}

export function useCurrentUser() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    let isMounted = true;

    supabase.auth.getUser().then(({ data }) => {
      if (isMounted) {
        setUser(data?.user ?? null);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return user;
}
