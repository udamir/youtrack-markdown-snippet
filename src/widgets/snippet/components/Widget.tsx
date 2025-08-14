import { memo, type ReactNode, useCallback, useEffect, useState } from "react"

import { WidgetContextProvider } from "../contexts/WidgetContext"
import { useYoutrack } from "../hooks/useYoutrack"

export type WidgetConfigurationFormParams<T> = {
  initialConfig: T
  onSubmit: (config: T) => void
  onCancel: () => void
}

export type WidgetContentParams<T> = {
  config: T
  setTitle?: (title: string) => void
  refreshTrigger?: number
}

export type WidgetConfigFormComponentType<T> = (params: WidgetConfigurationFormParams<T>) => ReactNode
export type WidgetContentComponentType<T> = (params: WidgetContentParams<T>) => ReactNode

export type WidgetParams<T extends Record<string, any>> = {
  configurationForm?: WidgetConfigFormComponentType<T>
  widgetContent: WidgetContentComponentType<T>
  loader?: ReactNode
  configurable?: boolean
}

export const Widget = memo(<T extends Record<string, any>>({
  configurationForm,
  widgetContent,
  loader,
  configurable = true,
}: WidgetParams<T>) => {
  const { widgetApi, isRegistered, youtrack, currentUser, refreshTrigger, isConfiguring, exitConfigMode, saveConfig } = useYoutrack()
  const [config, setConfig] = useState<T | null>(null)

  useEffect(() => {
    const loadConfig = async () => {
      if (!widgetApi.current || !isRegistered) return
      const config = await widgetApi.current.readConfig<T>()
      setConfig(config || null)
    }
    loadConfig()
  }, [isRegistered, widgetApi])

  return isRegistered && widgetApi.current ? (
    <div>
      <WidgetContextProvider value={{ widgetApi, youtrack, currentUser }}>
        {configurable && isConfiguring
          ? configurationForm?.({
              initialConfig: config || {} as T,
              onSubmit: async (data) => {
                await saveConfig(data)
                setConfig(data)
              },
              onCancel: () => {
                exitConfigMode()
              },
            })
          : config 
            ? widgetContent({ config, refreshTrigger })
            : <div>No configuration found. Please configure the widget.</div>}
      </WidgetContextProvider>
    </div>
  ) : loader
})
