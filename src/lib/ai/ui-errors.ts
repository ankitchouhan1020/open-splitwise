const AI_ERROR_MESSAGES: Record<string, string> = {
  ai_disabled: "Turn on AI in Settings to use smart filters.",
  not_connected: "Connect Splitwise in Settings to use smart filters.",
  rate_limited: "Too many requests. Wait a moment and try again.",
  ai_misconfigured: "Check your API key in Settings → AI.",
  ai_provider_error: "Couldn't reach your AI provider. Check Settings → AI.",
  ai_parse_error: "Couldn't understand the response. Try rephrasing.",
  database_not_configured: "Database not configured. Set up in Settings.",
  invalid_json: "Something went wrong. Try again.",
  request_failed: "Something went wrong. Try again.",
};

export function friendlyAiError(
  code: string | undefined,
  fallback = "Couldn't apply that filter. Try rephrasing.",
): string {
  return (code && AI_ERROR_MESSAGES[code]) || fallback;
}
