import * as WebBrowser from "expo-web-browser";
import { makeRedirectUri } from "expo-auth-session";
import * as QueryParams from "expo-auth-session/build/QueryParams";
import { supabase } from "@/utils/supabase";

WebBrowser.maybeCompleteAuthSession();

const redirectTo = makeRedirectUri();

async function createSessionFromUrl(url: string) {
  const { params, errorCode } = QueryParams.getQueryParams(url);

  if (errorCode) {
    throw new Error(errorCode);
  }

  // PKCE flow: the redirect only carries a short-lived "code",
  // never the actual access/refresh tokens. The code is useless
  // without the code_verifier that supabase-js already holds
  // locally from when signInWithOAuth() was first called.
  const { code } = params;

  if (!code) {
    return null;
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

  if (result.type === "success" && result.url) {
    return await createSessionFromUrl(result.url);
  }

  return null; // user cancelled
}