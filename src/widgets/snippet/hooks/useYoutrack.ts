import { useState, useEffect, useRef } from "react"
import type { EmbeddableWidgetAPI } from "../../../../@types/globals"
import { YoutrackService } from "../services/YoutrackService"

export const useYoutrack = <T extends Record<string, any>>() => {
  const widgetApi = useRef<EmbeddableWidgetAPI | null>(null)
  const youtrack = useRef<YoutrackService | null>(null)
  const currentUser = useRef<{ id: string, login: string } | null>(null)
  const [isRegistered, setIsRegistered] = useState(false)

  const handlers = {
    onConfigure: () => {},
    onRefresh: () => {},
  }

  useEffect(() => {
    async function register() {
      try {
        const hostInstance = (await YTApp.register({
          onConfigure: () => handlers.onConfigure(),
          onRefresh: () => handlers.onRefresh(),
        })) as EmbeddableWidgetAPI

        if (!("readCache" in hostInstance)) {
          throw new Error("Wrong type of API returned: probably widget used in wrong extension point")
        }
        
        widgetApi.current = hostInstance
        youtrack.current = new YoutrackService(hostInstance)
        currentUser.current = await youtrack.current.getCurrentUser()
        
        setIsRegistered(true)
      } catch (err) {
        console.error(`Error registering widget: ${err instanceof Error ? err.message : String(err)}`)
      }
    }

    register()
  }, [])
  
  return {
    currentUser,
    youtrack,
    widgetApi,
    isRegistered,
    onConfigure: (handler: () => void) => {
      handlers.onConfigure = handler
    },
    onRefresh: (handler: () => void) => {
      handlers.onRefresh = handler
    },
  }
}
