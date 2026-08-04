// Notion's cloudflare edge rejects requests without a browser-like user agent
// with a 403 html error page (not a json api error). Both the api client and
// the preview image fetcher need it, so it lives here rather than in either.
//
// Verified by hand: the same POST to /api/v3/loadPageChunk returns 403 without
// this header and 200 with it, on a page that is publicly shared either way.
//
// This string is pinned and will age. If notion ever starts checking the
// version for plausibility, the symptom is exactly the same 403-with-html.
export const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'
