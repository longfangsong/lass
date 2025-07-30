interface OAuthProvider {
  name: string;
  client_id: string;
  client_secret: string;
  scope: string;
  user_info_uri: string;
  auth_url: string;
  token_url: string;
}

function getGitHubProvider(env: Env): OAuthProvider {
  return {
    name: "github",
    client_id: env.AUTH_GITHUB_ID!,
    client_secret: env.AUTH_GITHUB_SECRET!,
    scope: "user:email",
    user_info_uri: "https://api.github.com/user",
    auth_url: "https://github.com/login/oauth/authorize",
    token_url: "https://github.com/login/oauth/access_token",
  };
}

function getGoogleProvider(env: Env): OAuthProvider {
  return {
    name: "google",
    client_id: env.AUTH_GOOGLE_ID!,
    client_secret: env.AUTH_GOOGLE_SECRET!,
    scope: "email profile",
    user_info_uri: "https://www.googleapis.com/oauth2/v2/userinfo",
    auth_url: "https://accounts.google.com/o/oauth2/v2/auth",
    token_url: "https://oauth2.googleapis.com/token",
  };
}

export function getProvider(
  env: Env,
  providerName: string,
): OAuthProvider | null {
  switch (providerName) {
    case "github":
      return getGitHubProvider(env);
    case "google":
      return getGoogleProvider(env);
    default:
      return null;
  }
}
