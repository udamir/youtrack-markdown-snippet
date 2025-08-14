import { createContext, type RefObject, useContext, type ReactNode } from "react"

import type { EmbeddableWidgetAPI } from "../../../../@types/globals"
import type { YoutrackService } from "../services/YoutrackService"

export type WidgetContextType = {
  widgetApi: EmbeddableWidgetAPI
  youtrack: YoutrackService
  currentUser?: { id: string; login: string }
  entityId?: string
}

export type WidgetContextProviderParams = {
  value: {
    widgetApi: RefObject<EmbeddableWidgetAPI>
    youtrack: RefObject<YoutrackService>
    currentUser: RefObject<{ id: string; login: string }>
  }
  children: ReactNode
}

const WidgetContext = createContext<WidgetContextType | undefined>(undefined)

export const WidgetContextProvider = (params: WidgetContextProviderParams) => {
  const { children, value } = params

  const context = {
    widgetApi: value.widgetApi.current!,
    youtrack: value.youtrack.current!,
    currentUser: value.currentUser.current ?? undefined,
    entityId: YTApp.entity?.id,
  }

  return <WidgetContext.Provider value={context}>{children}</WidgetContext.Provider>
}

export function useWidgetContext(): WidgetContextType {
  const context = useContext<WidgetContextType | undefined>(WidgetContext)
  if (!context) {
    throw new Error("useWidgetContext must be used within a WidgetContextProvider")
  }
  return context
}
