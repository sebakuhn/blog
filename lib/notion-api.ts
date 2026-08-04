import { NotionAPI } from 'notion-client'

// Notion's cloudflare edge rejects requests without a browser-like user agent
// with a 403 html error page (not a json api error). notion-client sends none,
// so every `getPage` during the build failed and `next build` aborted.
// Verified by hand: the same POST to /api/v3/loadPageChunk returns 403 without
// this header and 200 with it, on a page that is publicly shared either way.
//
// Set on the constructor rather than per call: `fetch()` in notion-client merges
// `{...this._ofetchOptions?.headers, ...ofetchOptions?.headers}`, so this
// survives the per-call `ofetchOptions` in `lib/get-site-map.ts` and also covers
// getCollectionData / getSignedFileUrls / search.
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'

export const notion = new NotionAPI({
  apiBaseUrl: process.env.NOTION_API_BASE_URL,
  ofetchOptions: {
    headers: {
      'User-Agent': USER_AGENT
    },
    // `next build` prerenders every page in parallel (12 workers here), which
    // trips notion's rate limit and aborted the export with a 429. ofetch already
    // lists 429 in its default `retryStatusCodes`, but defaults `retry` to 0 for
    // POST because it is not idempotent — these reads are safe to repeat.
    retry: 5,
    retryDelay: ({ options }) => 1000 * (6 - (options.retry as number))
  }
})
