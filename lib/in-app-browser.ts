'use client'

// Common in-app / embedded WebView browsers (Messenger, Instagram, TikTok,
// etc). Google's OAuth policy rejects sign-in requests from these outright
// ("disallowed_useragent") — no code change on our end can work around
// that, so the only real fix is telling the user to open the link in their
// actual browser app instead.
const IN_APP_UA_PATTERNS = [
  /FBAN|FBAV|FB_IAB|FBIOS/i, // Facebook / Messenger
  /Instagram/i,
  /Line\//i,
  /MicroMessenger/i, // WeChat
  /TikTok|musical_ly/i,
  /LinkedInApp/i,
  /Snapchat/i,
  /Twitter/i,
  /; ?wv\)/i, // generic Android embedded WebView marker
]

export function isInAppBrowser(): boolean {
  if (typeof navigator === 'undefined') return false
  return IN_APP_UA_PATTERNS.some((p) => p.test(navigator.userAgent))
}
