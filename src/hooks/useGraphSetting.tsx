import { useReducer } from 'react'

import { DEFAULT_BLOCK_SHAPE, DEFAULT_SIZE, DEFAULT_THEME } from '~/constants'
import type { GraphSettings } from '~/types'

type State = GraphSettings

type Action
  = | {
    type: 'size'
    payload: State['size']
  }
  | {
    type: 'yearRange'
    payload: State['yearRange']
  }
  | {
    type: 'daysLabel'
    payload: State['daysLabel']
  }
  | {
    type: 'showSafariHeader'
    payload: State['showSafariHeader']
  }
  | {
    type: 'showAttribution'
    payload: State['showAttribution']
  }
  | {
    type: 'yearOrder'
    payload: State['yearOrder']
  }
  | {
    type: 'showCard'
    payload: State['showCard']
  }
  | {
    type: 'showHeader'
    payload: State['showHeader']
  }
  | {
    type: 'blockShape'
    payload: State['blockShape']
  }
  | {
    type: 'theme'
    payload: State['theme']
  }
  
  | {
    type: 'unit'
    payload: State['unit']
  }
  | {
    type: 'logoUrl'
    payload: State['logoUrl']
  }
  | {
    type: 'avatarUrl'
    payload: State['avatarUrl']
  }
  | {
    type: 'titleOverride'
    payload: State['titleOverride']
  }
  | {
    type: 'subtitleOverride'
    payload: State['subtitleOverride']
  }
  | {
    type: 'reset'
    payload?: never
  }
  | {
    /** Replace all existing settings. */
    type: 'replace'
    payload?: State
  }

const initialState: State = {
  size: DEFAULT_SIZE,
  theme: DEFAULT_THEME,
  blockShape: DEFAULT_BLOCK_SHAPE,
  daysLabel: false,
  yearOrder: 'asc',
  showAttribution: true,
  showSafariHeader: false,
  showCard: true,
  showHeader: true,
  unit: 'contributions',
  logoUrl: undefined,
  avatarUrl: undefined,
  titleOverride: undefined,
  subtitleOverride: undefined,
}

export function useGraphSetting() {
  return useReducer((state: State, { type, payload }: Action): State => {
    switch (type) {
      case 'size':
        return { ...state, size: payload }

      case 'yearRange':
        return { ...state, yearRange: payload }

      case 'daysLabel':
        return { ...state, daysLabel: payload }

      case 'showSafariHeader':
        return { ...state, showSafariHeader: payload }

      case 'showAttribution':
        return { ...state, showAttribution: payload }

      case 'yearOrder':
        return { ...state, yearOrder: payload }

      case 'showCard':
        return { ...state, showCard: payload }

      case 'showHeader':
        return { ...state, showHeader: payload }


      case 'blockShape':
        return { ...state, blockShape: payload }

      case 'theme':
        return { ...state, theme: payload }

      case 'unit':
        return { ...state, unit: payload }

      case 'logoUrl':
        return { ...state, logoUrl: payload }

      case 'avatarUrl':
        return { ...state, avatarUrl: payload }

      case 'titleOverride':
        return { ...state, titleOverride: payload }

      case 'subtitleOverride':
        return { ...state, subtitleOverride: payload }

      case 'reset':
        return initialState

      case 'replace':
        if (payload) {
          return payload
        }

        return state

      default:
        throw new Error('Not a valid action type.')
    }
  }, initialState)
}
