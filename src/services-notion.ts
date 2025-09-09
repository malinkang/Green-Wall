import type { ContributionCalendar, ContributionDay, ContributionYear, GraphData } from '~/types'
import { ContributionLevel } from '~/enums'

const NOTION_API_BASE = 'https://api.notion.com/v1'
const NOTION_VERSION = '2022-06-28'

interface NotionDatabase {
  title?: { plain_text?: string }[]
  icon?: { type: 'emoji' | 'file' | 'external', emoji?: string, external?: { url: string }, file?: { url: string } }
  last_edited_time?: string
}

interface NotionUserRef { object?: 'user'; id?: string; type?: string; name?: string; avatar_url?: string }

interface NotionPage {
  id: string
  url?: string
  created_by?: NotionUserRef
  last_edited_by?: NotionUserRef
  properties: Record<string, any>
}

interface NotionUserMeResponse {
  name?: string
  avatar_url?: string
  // keep index signature for forward compatibility
  [key: string]: any
}

function levelForCount(count: number, max: number): ContributionLevel {
  if (count <= 0) return ContributionLevel.NONE
  if (max <= 1) return ContributionLevel.FOURTH_QUARTILE
  const q = max / 4
  if (count <= q) return ContributionLevel.FIRST_QUARTILE
  if (count <= 2 * q) return ContributionLevel.SECOND_QUARTILE
  if (count <= 3 * q) return ContributionLevel.THIRD_QUARTILE
  return ContributionLevel.FOURTH_QUARTILE
}

function formatDate(d: Date): string {
  const y = d.getFullYear()
  const m = `${d.getMonth() + 1}`.padStart(2, '0')
  const day = `${d.getDate()}`.padStart(2, '0')
  return `${y}-${m}-${day}`
}

function buildCalendarFromCounts(year: number, counts: Record<string, number>, links?: Record<string, string>): ContributionCalendar {
  const start = new Date(year, 0, 1)
  const end = new Date(year, 11, 31)
  const days: ContributionDay[] = []

  // Determine max for level calculation
  let max = 0
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const key = formatDate(d)
    const c = counts[key] ?? 0
    if (c > max) max = c
  }

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const key = formatDate(d)
    const c = counts[key] ?? 0
    days.push({
      date: key,
      count: c,
      weekday: d.getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6,
      level: levelForCount(c, max),
      url: links?.[key],
    })
  }

  // Split into weeks (Sunday-start)
  const weeks: { days: ContributionDay[] }[] = []
  let currentWeek: ContributionDay[] = []

  // Pad the first week with leading days from previous month if needed
  const firstWeekday = new Date(year, 0, 1).getDay()
  if (firstWeekday > 0) {
    currentWeek = Array.from({ length: firstWeekday }).map(() => ({
      date: '',
      count: 0,
      level: ContributionLevel.Null,
    })) as ContributionDay[]
  }

  for (const day of days) {
    currentWeek.push(day)
    if (currentWeek.length === 7) {
      weeks.push({ days: currentWeek })
      currentWeek = []
    }
  }

  if (currentWeek.length > 0) {
    weeks.push({ days: currentWeek })
  }

  const total = days.reduce((s, d) => s + d.count, 0)
  return { year, weeks, total }
}

export async function fetchNotionDatabaseMeta(databaseId: string, token: string) {
  const res = await fetch(`${NOTION_API_BASE}/databases/${databaseId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Notion-Version': NOTION_VERSION,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  })
  if (!res.ok) {
    throw new Error(`Notion database meta fetch failed: ${res.status}`)
  }
  const json = (await res.json()) as NotionDatabase
  const title = json.title?.map(t => t.plain_text).join('') || databaseId
  let avatarUrl = ''
  if (json.icon?.type === 'external') avatarUrl = json.icon.external?.url || ''
  if (json.icon?.type === 'file') avatarUrl = json.icon.file?.url || ''
  if (json.icon?.type === 'emoji') {
    // Generate an SVG data URL for emoji for consistency
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64'><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-size='48'>${json.icon.emoji}</text></svg>`
    avatarUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
  }
  const lastEditedTime = json.last_edited_time || undefined
  return { title, avatarUrl, lastEditedTime }
}

async function fetchNotionUserMe(token: string): Promise<{ name?: string; avatarUrl?: string } | null> {
  try {
    const res = await fetch(`${NOTION_API_BASE}/users/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Notion-Version': NOTION_VERSION,
      },
      cache: 'no-store',
    })
    if (!res.ok) return null
    const json = (await res.json()) as NotionUserMeResponse
    return { name: json.name, avatarUrl: json.avatar_url }
  } catch {
    return null
  }
}

async function queryNotionDatabase(
  databaseId: string,
  token: string,
  params: { dateProp: string, startISO: string, endISO: string },
) {
  const body = {
    filter: {
      and: [
        { property: params.dateProp, date: { on_or_after: params.startISO } },
        { property: params.dateProp, date: { before: params.endISO } },
      ],
    },
    page_size: 100,
  }

  let hasMore = true
  let start_cursor: string | undefined
  const pages: NotionPage[] = []

  while (hasMore) {
    const res = await fetch(`${NOTION_API_BASE}/databases/${databaseId}/query`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Notion-Version': NOTION_VERSION,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...body, start_cursor }),
      cache: 'no-store',
    })
    if (!res.ok) {
      throw new Error(`Notion database query failed: ${res.status}`)
    }
    const json = await res.json() as any
    const results = (json.results as any[]).map((p) => ({
      id: p.id,
      url: p.url,
      properties: p.properties,
      created_by: p.created_by,
      last_edited_by: p.last_edited_by,
    })) as NotionPage[]
    pages.push(...results)
    hasMore = json.has_more
    start_cursor = json.next_cursor || undefined
  }

  return pages
}

function extractDateAndCount(
  page: NotionPage,
  dateProp: string,
  countProp?: string,
): { date: string | null, count: number } {
  const prop = page.properties?.[dateProp]
  let date: string | null = null
  if (prop?.type === 'date' && prop.date?.start) {
    date = prop.date.start.substring(0, 10) // YYYY-MM-DD
  }
  // Fall back: try to find a date-like property
  if (!date && prop?.date?.start) {
    date = prop.date.start.substring(0, 10)
  }

  // When a count property is provided, default to 0 (empty)
  let count = countProp ? 0 : 1
  if (countProp) {
    const cprop = page.properties?.[countProp]
    if (cprop) {
      if (cprop.type === 'number' && typeof cprop.number === 'number') count = cprop.number
      if (cprop.type === 'rollup' && typeof cprop.rollup?.number === 'number') count = cprop.rollup.number
      if (cprop.type === 'formula' && typeof cprop.formula?.number === 'number') count = cprop.formula.number
    }
  }
  return { date, count: Number.isFinite(count) ? count : 1 }
}

export async function fetchNotionGraphData(options: {
  databaseId: string
  dateProp: string
  countProp?: string
  years: ContributionYear[]
  statistics?: boolean
  tokenOverride?: string
}): Promise<GraphData> {
  const { databaseId, dateProp, countProp, years, tokenOverride } = options
  const token = tokenOverride || process.env.NOTION_API_KEY
  if (!token) throw new Error('Require NOTION API KEY or Notion OAuth token.')

  const meta = await fetchNotionDatabaseMeta(databaseId, token)
  const userMe = await fetchNotionUserMe(token)

  const contributionCalendars: ContributionCalendar[] = []

  let personAvatar: string | undefined
  for (const year of years) {
    const startISO = new Date(year, 0, 1).toISOString()
    const endISO = new Date(year + 1, 0, 1).toISOString()
    const pages = await queryNotionDatabase(databaseId, token, { dateProp, startISO, endISO })
    const counts: Record<string, number> = {}
    const links: Record<string, string> = {}
    for (const p of pages) {
      const { date, count } = extractDateAndCount(p, dateProp, countProp)
      if (date) {
        counts[date] = (counts[date] ?? 0) + count
        // store first page url per date for click-through
        if (!links[date]) {
          const pageUrl = p.url || `https://www.notion.so/${p.id.replace(/-/g, '')}`
          links[date] = pageUrl
        }
      }
      // capture a human user avatar if available
      if (!personAvatar) {
        const u = (p.created_by && p.created_by.type !== 'bot' && p.created_by.avatar_url)
          ? p.created_by
          : (p.last_edited_by && p.last_edited_by.type !== 'bot' && p.last_edited_by.avatar_url)
            ? p.last_edited_by
            : undefined
        if (u?.avatar_url) personAvatar = u.avatar_url
      }
    }
    contributionCalendars.push(buildCalendarFromCounts(year, counts, links))
  }

  const displayName = userMe?.name || meta.title
  const login = displayName
  const avatarUrl = userMe?.avatarUrl || personAvatar || meta.avatarUrl || '/favicon.svg'

  return {
    login,
    name: displayName,
    avatarUrl,
    bio: 'Notion Database Heatmap',
    followers: { totalCount: 0 },
    following: { totalCount: 0 },
    contributionYears: years,
    contributionCalendars,
    source: 'notion',
    profileUrl: `https://www.notion.so/${databaseId.replace(/-/g, '')}`,
    dbTitle: meta.title,
  }
}
