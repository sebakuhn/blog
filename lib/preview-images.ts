import ky from 'ky'
import lqip from 'lqip-modern'
import {
  type ExtendedRecordMap,
  type PreviewImage,
  type PreviewImageMap
} from 'notion-types'
import { getPageImageUrls, normalizeUrl } from 'notion-utils'
import pMap from 'p-map'
import pMemoize from 'p-memoize'

import { defaultPageCover, defaultPageIcon } from './config'
import { db } from './db'
import { mapImageUrl } from './map-image-url'
import { USER_AGENT } from './user-agent'

export async function getPreviewImageMap(
  recordMap: ExtendedRecordMap
): Promise<PreviewImageMap> {
  const urls: string[] = getPageImageUrls(recordMap, {
    mapImageUrl
  })
    .concat([defaultPageIcon, defaultPageCover].filter(Boolean))
    .filter(Boolean)

  const previewImagesMap = Object.fromEntries(
    await pMap(
      urls,
      async (url) => {
        const cacheKey = normalizeUrl(url)
        return [cacheKey, await getPreviewImage(url, { cacheKey })]
      },
      {
        concurrency: 8
      }
    )
  )

  return previewImagesMap
}

async function createPreviewImage(
  url: string,
  { cacheKey }: { cacheKey: string }
): Promise<PreviewImage | null> {
  try {
    try {
      const cachedPreviewImage = await db.get(cacheKey)
      if (cachedPreviewImage) {
        return cachedPreviewImage
      }
    } catch (err: any) {
      // ignore redis errors
      console.warn(`redis error get "${cacheKey}"`, err.message)
    }

    // same 403 as the api client without this — the build logged "failed to
    // create preview image" for every notion-hosted image and the cards lost
    // their blurred placeholders
    const body = await ky(url, {
      headers: { 'User-Agent': USER_AGENT }
    }).arrayBuffer()
    const result = await lqip(body)
    console.log('lqip', { ...result.metadata, url, cacheKey })

    const previewImage = {
      originalWidth: result.metadata.originalWidth,
      originalHeight: result.metadata.originalHeight,
      dataURIBase64: result.metadata.dataURIBase64
    }

    try {
      await db.set(cacheKey, previewImage)
    } catch (err: any) {
      // ignore redis errors
      console.warn(`redis error set "${cacheKey}"`, err.message)
    }

    return previewImage
  } catch (err: any) {
    console.warn('failed to create preview image', url, err.message)
    return null
  }
}

export const getPreviewImage = pMemoize(createPreviewImage)
