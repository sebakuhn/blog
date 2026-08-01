import {
  type ExtendedRecordMap,
  type SearchParams,
  type SearchResults
} from 'notion-types'
import { getBlockValue, mergeRecordMaps } from 'notion-utils'
import pMap from 'p-map'
import pMemoize from 'p-memoize'

import {
  isPreviewImageSupportEnabled,
  navigationLinks,
  navigationStyle
} from './config'
import { getTweetsMap } from './get-tweets'
import { notion } from './notion-api'
import { getPreviewImageMap } from './preview-images'

const getNavigationLinkPages = pMemoize(
  async (): Promise<ExtendedRecordMap[]> => {
    const navigationLinkPageIds = (navigationLinks || [])
      .map((link) => link?.pageId)
      .filter(Boolean)

    if (navigationStyle !== 'default' && navigationLinkPageIds.length) {
      return pMap(
        navigationLinkPageIds,
        async (navigationLinkPageId) =>
          notion.getPage(navigationLinkPageId, {
            chunkLimit: 1,
            fetchMissingBlocks: false,
            fetchCollections: false,
            signFileUrls: false
          }),
        {
          concurrency: 4
        }
      )
    }

    return []
  }
)

function getCollectionSortValue(
  recordMap: ExtendedRecordMap,
  blockId: string,
  propertyKey: string,
  propertyType: string | undefined
): number | string {
  const block = getBlockValue(recordMap.block[blockId]) as any

  // notion exposes these as top-level block fields rather than as properties,
  // both as built-in sort keys and as user-added schema columns
  if (propertyKey === 'created_time' || propertyType === 'created_time') {
    return block?.created_time ?? 0
  }
  if (
    propertyKey === 'last_edited_time' ||
    propertyType === 'last_edited_time'
  ) {
    return block?.last_edited_time ?? 0
  }

  const propertyValue = block?.properties?.[propertyKey]

  if (propertyType === 'date') {
    const startDate = propertyValue?.[0]?.[1]?.[0]?.[1]?.start_date
    return startDate ? new Date(startDate).getTime() : 0
  }

  const text = propertyValue?.[0]?.[0]

  // keep the return type consistent per property so we never compare a
  // number against a string
  if (propertyType === 'number') {
    const value = Number.parseFloat(text)
    return Number.isNaN(value) ? 0 : value
  }

  return text ?? ''
}

// react-notion-x's `getPage` returns collection query results in whatever
// (often stale) order Notion's API last cached them in, ignoring the sort
// configured on the collection view. Re-sort them here so pages appear in
// the same order as they do in Notion itself.
function sortCollectionQueryResults(recordMap: ExtendedRecordMap): void {
  for (const [collectionId, views] of Object.entries(
    recordMap.collection_query || {}
  )) {
    const schema = (getBlockValue(recordMap.collection[collectionId]) as any)
      ?.schema

    for (const [viewId, results] of Object.entries(views as any)) {
      const view = getBlockValue(recordMap.collection_view[viewId]) as any
      const sorts = view?.query2?.sort

      if (!sorts?.length || !schema) continue

      // ungrouped views use `blockIds` / `collection_group_results`, grouped
      // and board views keep their ids under `results:<type>:<label>` keys
      const containers = [
        (results as any)?.collection_group_results,
        results as any,
        ...Object.entries((results as any) || {})
          .filter(([key]) => key.startsWith('results:'))
          .map(([, value]) => value)
      ]

      for (const container of containers) {
        const blockIds = (container as any)?.blockIds
        if (!blockIds) continue

        blockIds.sort((a: string, b: string) => {
          for (const { property, direction } of sorts) {
            const propertyType = schema[property]?.type
            const valueA = getCollectionSortValue(
              recordMap,
              a,
              property,
              propertyType
            )
            const valueB = getCollectionSortValue(
              recordMap,
              b,
              property,
              propertyType
            )

            const order =
              typeof valueA === 'string' && typeof valueB === 'string'
                ? valueA.localeCompare(valueB, 'de')
                : valueA < valueB
                  ? -1
                  : valueA > valueB
                    ? 1
                    : 0

            if (order !== 0) {
              return direction === 'descending' ? -order : order
            }
          }

          return 0
        })
      }
    }
  }
}

export async function getPage(pageId: string): Promise<ExtendedRecordMap> {
  let recordMap = await notion.getPage(pageId)

  if (navigationStyle !== 'default') {
    // ensure that any pages linked to in the custom navigation header have
    // their block info fully resolved in the page record map so we know
    // the page title, slug, etc.
    const navigationLinkRecordMaps = await getNavigationLinkPages()

    if (navigationLinkRecordMaps?.length) {
      recordMap = navigationLinkRecordMaps.reduce(
        (map, navigationLinkRecordMap) =>
          mergeRecordMaps(map, navigationLinkRecordMap),
        recordMap
      )
    }
  }

  // must run after the merge above, which replaces `collection_query` wholesale
  sortCollectionQueryResults(recordMap)

  if (isPreviewImageSupportEnabled) {
    const previewImageMap = await getPreviewImageMap(recordMap)
    ;(recordMap as any).preview_images = previewImageMap
  }

  await getTweetsMap(recordMap)

  return recordMap
}

export async function search(params: SearchParams): Promise<SearchResults> {
  return notion.search(params)
}
