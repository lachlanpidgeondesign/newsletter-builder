import { useState } from "react";
import { LogIn } from "lucide-react";
import { signInWithGoogle } from "../lib/auth.js";

export default function SignInGate({ user, children }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignIn = async () => {
    setError("");
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (e) {
      setError(e?.message || "Could not start Google sign-in. Check Supabase Auth redirect URLs.");
      setLoading(false);
    }
  };

  if (user) {
    return children;
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleSignIn}
        disabled={loading}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-800 hover:bg-stone-700 disabled:opacity-60 disabled:cursor-not-allowed rounded text-xs"
      >
        <LogIn className="w-3.5 h-3.5" />
        {loading ? "Signing in..." : "Sign in with Google"}
      </button>
      {error && <p className="text-[11px] text-red-300">{error}</p>}
    </div>
  );
}
