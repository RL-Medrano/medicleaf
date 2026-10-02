import * as WebBrowser from "expo-web-browser";
import { makeRedirectUri } from "expo-auth-session";
import * as QueryParams from "expo-auth-session/build/QueryParams";
import { supabase } from "@/utils/supabase";

WebBrowser.maybeCompleteAuthSession();

// The redirect MUST have a host/path — never the bare `medicleaf://`.
// Supabase re-serialises the redirect it sends back to the app, and an empty
// `medicleaf://` comes back as `medicleaf:?code=…`. That no longer starts with
// the value we hand to openAuthSessionAsync(), so the auth session resolves as
// "cancel" and the sign-in dies silently (the browser closes, no session is
// exchanged, no error is shown).
//
// `native` is used in development builds and production builds, where it can be
// trusted to be stable; `path` is the Expo Go / web fallback.
// Keep this in sync with `scheme` in app.json, and with the allow list under
// Supabase → Authentication → URL Configuration → Redirect URLs (`medicleaf://**`).
const redirectTo = makeRedirectUri({
  native: "medicleaf://auth/callback",
  path: "auth/callback",
});

async function createSessionFromUrl(url: string) {
  const { params, errorCode } = QueryParams.getQueryParams(url);

  // A rejected sign-in comes back as ?error=…&error_code=…&error_description=…
  // (sometimes repeated in the hash) instead of carrying a `code`.
  const failure = errorCode ?? params.error_code ?? params.error;
  if (failure) {
    throw new Error(params.error_description || `Google sign-in was rejected (${failure}).`);
  }

  // PKCE flow: the redirect only carries a short-lived "code",
  // never the actual access/refresh tokens. The code is useless
  // without the code_verifier that supabase-js already holds
  // locally from when signInWithOAuth() was first called.
  const { code } = params;

  if (!code) {
    // Not a cancellation — the browser came back empty-handed. Surfacing this
    // keeps a misconfigured redirect from looking like "nothing happened".
    throw new Error("Google redirected back to the app without an authorization code.");
  }

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) throw error;

  return data.session;
}

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  });

  if (error) throw error;
  if (!data?.url) throw new Error("No OAuth URL returned from Supabase.");

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

  if (result.type !== "success" || !result.url) {
    // The user closed the browser, or the redirect came back on a URL we don't
    // recognise. Log the type so a redirect mismatch is diagnosable.
    console.warn(`[googleAuth] Auth session ended without a redirect (type: ${result.type})`);
    return null;
  }

  return await createSessionFromUrl(result.url);
}
