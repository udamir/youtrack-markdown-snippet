import { memo, type ReactNode, useEffect, useState } from "react"

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
  const { widgetApi, isRegistered, onConfigure, youtrack, currentUser } = useYoutrack<T>()
  const [config, setConfig] = useState<T | null>(null)

  useEffect(() => {
    async function loadConfig() {
      if (!widgetApi.current || !isRegistered) return
      const config = await widgetApi.current.readConfig<T>()
      setConfig(config || null)
    }
    loadConfig()
  }, [isRegistered, widgetApi])
  
  const [isConfiguring, setIsConfiguring] = useState(false)
  onConfigure(() => setIsConfiguring(true))

  return isRegistered && widgetApi.current ? (
    <div>
      <WidgetContextProvider value={{ widgetApi, youtrack, currentUser }}>
        {configurable && (isConfiguring || !config)
          ? configurationForm?.({
              initialConfig: config || {} as T,
              onSubmit: async (data) => {
                await widgetApi.current!.storeConfig(data)
                setConfig(data)
                setIsConfiguring(false)
              },
              onCancel: () => {
                setIsConfiguring(false)
                widgetApi.current!.exitConfigMode()
              },
            })
          : widgetContent({ config: config || {} as T })}
      </WidgetContextProvider>
    </div>
  ) : loader
})
