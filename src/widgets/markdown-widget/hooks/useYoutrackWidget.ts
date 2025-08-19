import { useState, useEffect, useRef } from "react"
import type { EmbeddableWidgetAPI } from "../../../../@types/globals"
import { YoutrackService } from "../services/YoutrackService"

export const useYoutrackWidget = <T>(configurable = false) => {
  const widgetApi = useRef<EmbeddableWidgetAPI | null>(null)
  const youtrack = useRef<YoutrackService | null>(null)
  const currentUser = useRef<{ id: string, login: string } | null>(null)
  const [isRegistered, setIsRegistered] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [isConfiguring, setIsConfiguring] = useState(false)
  const [config, setConfig] = useState<T | null>(null)

  useEffect(() => {
    async function register() {
      try {
        const hostInstance = (await YTApp.register({
          onConfigure: configurable ? () => setIsConfiguring(true) : undefined,
          onRefresh: () => setRefreshTrigger(prev => prev + 1),
        })) as EmbeddableWidgetAPI

        if (!("readCache" in hostInstance)) {
          throw new Error("Wrong type of API returned: probably widget used in wrong extension point")
        }
        
        widgetApi.current = hostInstance
        youtrack.current = new YoutrackService(hostInstance)
        currentUser.current = await youtrack.current.getCurrentUser()
        
        if (configurable) {
          const config = await widgetApi.current.readConfig<T>()
          setConfig(config || null)
          if (!config) {
            setIsConfiguring(true)
            widgetApi.current.enterConfigMode()
          }
        }

        setIsRegistered(true)
      } catch (err) {
        console.error(`Error registering widget: ${err instanceof Error ? err.message : String(err)}`)
      }
    }

    register()
  }, [configurable])
  
  const exitConfigMode = () => {
    setIsConfiguring(false)
    if (widgetApi.current) {
      widgetApi.current.exitConfigMode()
    }
  }

  const saveConfig = async (config: T) => {
    if (widgetApi.current) {
      await widgetApi.current.storeConfig(config)
      setConfig(config)
      setRefreshTrigger(0)
      setIsConfiguring(false)
    }
  }

  return {
    currentUser,
    youtrack,
    widgetApi,
    isRegistered,
    refreshTrigger,
    isConfiguring,
    config,
    exitConfigMode,
    saveConfig,
  }
}
