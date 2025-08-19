import {ControlsHeightContext, ControlsHeight} from '@jetbrains/ring-ui-built/components/global/controls-height';
import LoaderInline from "@jetbrains/ring-ui-built/components/loader-inline/loader-inline"

import { WidgetConfigForm } from "./ConfigForm"
import { WidgetContent } from "./Content"
import { Widget } from "./Widget"

import "@jetbrains/ring-ui-built/components/style.css"
import "./App.css"

export const App = () => (
  <ControlsHeightContext.Provider value={ControlsHeight.S}>
    <Widget
      configurationForm={(props) => <WidgetConfigForm {...props} />}
      widgetContent={(props) => <WidgetContent {...props} />}
      loader={<LoaderInline />}
    />
  </ControlsHeightContext.Provider>
)
