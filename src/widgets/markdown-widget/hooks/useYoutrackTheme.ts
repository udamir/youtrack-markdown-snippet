import { useState, useEffect } from "react"
import Theme from "@jetbrains/ring-ui-built/components/global/theme"

export const useYoutrackTheme = () => {
  const [theme, setTheme] = useState<typeof Theme.LIGHT | typeof Theme.DARK>(Theme.LIGHT)

  useEffect(() => {
    const getTheme = () => (document.querySelector(".ring-ui-theme-dark") !== null ? Theme.DARK : Theme.LIGHT)

    const updateTheme = () => setTheme(getTheme())

    // Initial detection
    updateTheme()

    const bodyObserver = new MutationObserver(updateTheme)
    if (document.body) {
      bodyObserver.observe(document.body, { attributes: true, attributeFilter: ["class"] })
    }

    return () => {
      bodyObserver.disconnect()
    }
  }, [])

  return theme
}
