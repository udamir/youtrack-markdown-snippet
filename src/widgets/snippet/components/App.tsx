import { ThemeProvider, useTheme } from "@jetbrains/ring-ui-built/components/global/theme"
import LoaderInline from "@jetbrains/ring-ui-built/components/loader-inline/loader-inline"
import {ControlsHeightContext, ControlsHeight} from '@jetbrains/ring-ui-built/components/global/controls-height';

import { Widget } from "./Widget"
import { WidgetConfigForm } from "./ConfigForm"
import { WidgetContent } from "./Content"

import "@jetbrains/ring-ui-built/components/style.css"
import "./App.css"

export const App = () => (
  <ControlsHeightContext.Provider value={ControlsHeight.S}>
    <ThemeProvider className="App" theme={useTheme()}>
      <Widget
        configurationForm={(props) => <WidgetConfigForm {...props} />}
        widgetContent={(props) => <WidgetContent {...props} />}
        loader={<LoaderInline />}
      />
    </ThemeProvider>
  </ControlsHeightContext.Provider>
)
