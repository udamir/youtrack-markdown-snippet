import { memo, type ReactNode, useEffect, useState } from "react"

import { WidgetContextProvider } from "../contexts/WidgetContext"
import { useYoutrack } from "../hooks/useYoutrack"

export type WidgetConfigurationFormParams<T> = {
  initialConfig: T | null
  onSubmit: (config: T) => void
  onCancel: () => void
}

export type WidgetContentParams<T> = {
  config: T | null
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

export const Widget = memo(
  <T extends Record<string, any>>({
    configurationForm,
    widgetContent,
    loader,
    configurable = true,
  }: WidgetParams<T>) => {
    const {
      widgetApi,
      isRegistered,
      youtrack,
      currentUser,
      config,
      refreshTrigger,
      isConfiguring,
      exitConfigMode,
      saveConfig,
    } = useYoutrack<T>(configurable)

    return isRegistered && widgetApi.current ? (
      <>
        <WidgetContextProvider value={{ widgetApi, youtrack, currentUser }}>
          {isConfiguring
            ? configurationForm?.({
                initialConfig: config,
                onSubmit: saveConfig,
                onCancel: exitConfigMode,
              })
            : widgetContent({ config, refreshTrigger })}
        </WidgetContextProvider>
      </>
    ) : (
      loader
    )
  },
)
