import { observer } from "mobx-react-lite"
import { FC } from "react"
import { useStores } from "../../hooks/useStores"
import { Tab, TabTitle } from "./Navigation"
// import { AdbClient, KeyStore, Options, Shell, WebUsbTransport } from '@vieratech/wadb';

export const AdbButton: FC = observer(() => {
  const { song } = useStores()

  const adbButtonClicked = function() {
    console.log("click ADB tab"),
    console.log("song:", song.allEvents)
  }

  return (
    <Tab onClick={ adbButtonClicked }>
    {/* <Help style={IconStyle} /> */}
    <TabTitle>ADB</TabTitle>
  </Tab>
  )
})