// Google OAuth Configuration
export const GOOGLE_CLIENT_ID = "897535773446-llk10fu61j7sdi02vbn60hd8t95d9eah.apps.googleusercontent.com";
export const GOOGLE_CLIENT_SECRET = "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";

// Redirect URIs for different environments
export const GOOGLE_REDIRECT_URI_LOCAL = "http://localhost:3000/login/callback";
export const GOOGLE_REDIRECT_URI_VERCEL = "https://pokerwizard.vercel.app/login/callback";
export const GOOGLE_REDIRECT_URI_RENDER = "https://pokerwizard.onrender.com/login/callback";

// Auto-detect environment and choose correct redirect URI
export const getRedirectUri = () => {
  const hostname = window.location.hostname;
  
  if (hostname.includes("localhost") || hostname === "127.0.0.1") {
    return GOOGLE_REDIRECT_URI_LOCAL;
  } else if (hostname.includes("vercel.app")) {
    return GOOGLE_REDIRECT_URI_VERCEL;
  } else if (hostname.includes("onrender.com")) {
    return GOOGLE_REDIRECT_URI_RENDER;
  }
  
  // Default to local
  return GOOGLE_REDIRECT_URI_LOCAL;
};

// Google OAuth login URL generator
export const getGoogleAuthUrl = () => {
  const redirectUri = getRedirectUri();
  const scope = encodeURIComponent("email profile");
  
  return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}`;
};
