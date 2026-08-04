import { NotionAPI } from 'notion-client'

import { USER_AGENT } from './user-agent'

// notion-client sends no user agent, so every `getPage` during the build got a
// 403 and `next build` aborted — see `lib/user-agent.ts` for the diagnosis.
//
// Set on the constructor rather than per call: `fetch()` in notion-client merges
// `{...this._ofetchOptions?.headers, ...ofetchOptions?.headers}`, so this
// survives the per-call `ofetchOptions` in `lib/get-site-map.ts` and also covers
// getCollectionData / getSignedFileUrls / search.
const RETRIES = 8

export const notion = new NotionAPI({
  apiBaseUrl: process.env.NOTION_API_BASE_URL,
  ofetchOptions: {
    headers: {
      'User-Agent': USER_AGENT
    },
    // `next build` prerenders pages in parallel, which trips notion's rate limit
    // and aborted the export with a 429. ofetch already lists 429 in its default
    // `retryStatusCodes`, but defaults `retry` to 0 for POST because it is not
    // idempotent — these reads are safe to repeat.
    //
    // Exponential backoff, capped at 30s: a linear 1-5s ramp was not enough.
    // ofetch recurses with `retry: retries - 1`, so `RETRIES - options.retry`
    // counts attempts upwards. Worst case ~2min, well inside the 300s
    // `staticPageGenerationTimeout`. `experimental.cpus` in next.config.js keeps
    // the request rate down in the first place; this handles what still slips.
    retry: RETRIES,
    retryDelay: ({ options }) =>
      Math.min(30_000, 1000 * 2 ** (RETRIES - (options.retry as number)))
  }
})
