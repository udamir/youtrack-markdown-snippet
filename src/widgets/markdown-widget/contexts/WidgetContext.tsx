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
  const { children, value: { widgetApi, youtrack, currentUser } } = params

  if (!widgetApi.current || !youtrack.current) {
    throw new Error("WidgetContextProvider: widgetApi and youtrack refs must be initialized")
  }

  const context = {
    widgetApi: widgetApi.current,
    youtrack: youtrack.current,
    currentUser: currentUser.current ?? undefined,
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
