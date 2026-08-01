import { type ExtendedRecordMap } from 'notion-types'
import {
  getBlockTitle,
  getBlockValue,
  getPageProperty,
  normalizeTitle,
  parsePageId,
  uuidToId
} from 'notion-utils'

import { inversePageUrlOverrides } from './config'

const umlauts: Array<[RegExp, string]> = [
  [/ä/g, 'ae'],
  [/ö/g, 'oe'],
  [/ü/g, 'ue'],
  [/Ä/g, 'Ae'],
  [/Ö/g, 'Oe'],
  [/Ü/g, 'Ue'],
  [/ß/g, 'ss']
]

// `normalizeTitle` from notion-utils drops every character outside of
// [0-9A-Za-z] and the CJK ranges instead of transliterating it, which mangles
// german titles: "Über mich" -> "ber-mich", "Fünf" -> "fnf". Map the umlauts to
// their conventional ASCII spelling first, then strip diacritics from any
// remaining latin characters (é -> e) so they survive as letters too.
//
// The NFKD pass is deliberately restricted to the latin supplement/extended
// blocks. Applying it to the whole string would also decompose hangul syllables
// into jamo (which normalizeTitle then discards entirely, leaving an empty
// slug) and split the dakuten off japanese kana ("ページ" -> "ヘーシ").
function transliterate(title: string): string {
  let result = title

  for (const [pattern, replacement] of umlauts) {
    result = result.replace(pattern, replacement)
  }

  return result.replaceAll(/[À-ɏ]/g, (char) =>
    char.normalize('NFKD').replaceAll(/[̀-ͯ]/g, '')
  )
}

function slugify(title: string): string {
  // `normalizeTitle` only collapses non-overlapping "--" pairs, so "a - b"
  // still leaves a double hyphen behind
  return normalizeTitle(transliterate(title))
    .replaceAll(/-{2,}/g, '-')
    .replace(/^-/, '')
    .replace(/-$/, '')
}

export function getCanonicalPageId(
  pageId: string,
  recordMap: ExtendedRecordMap,
  { uuid = true }: { uuid?: boolean } = {}
): string | undefined {
  const cleanPageId = parsePageId(pageId, { uuid: false })
  if (!cleanPageId) {
    return
  }

  const override = inversePageUrlOverrides[cleanPageId]
  if (override) {
    return override
  }

  // mirrors `getCanonicalPageId` from notion-utils, but slugifies the title via
  // `slugify` above rather than calling `normalizeTitle` directly
  const block = getBlockValue(recordMap.block[pageId])

  if (block) {
    const slug =
      getPageProperty<string>('slug', block, recordMap) ||
      getPageProperty<string>('Slug', block, recordMap) ||
      slugify(getBlockTitle(block, recordMap) || '')

    if (slug) {
      return uuid ? `${slug}-${uuidToId(pageId)}` : slug
    }
  }

  return uuidToId(pageId)
}
