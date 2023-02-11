import { AdbClient, KeyStore, Options, Shell, WebUsbTransport } from '@vieratech/wadb';
import { observer } from "mobx-react-lite";
import { FC } from "react";
import { useStores } from "../../hooks/useStores";
import { Tab, TabTitle } from "./Navigation";

export const AdbButton: FC = observer(() => {

  ////////////////////////////////////////////////////////////////////////////
  // Global Variables

  const { song } = useStores()

  // let commandQueue: Array<Function> = [];
  let transport: WebUsbTransport | null = null;
  let adbClient: AdbClient | null = null;
  let shell: Shell | null = null;

  ////////////////////////////////////////////////////////////////////////////
  // Crypto

  class MyKeyStore implements KeyStore {
    private keys: CryptoKeyPair[] = [];
    async loadKeys(): Promise<CryptoKeyPair[]> {
      return this.keys;
    }

    async saveKey(key: CryptoKeyPair): Promise<void> {
      this.keys.push(key);
      console.log('Saving Key' + key);
    }
  }

  const options: Options = {
    debug: true,
    useChecksum: false,
    dump: false,
    keySize: 2048,
  };

  const keyStore = new MyKeyStore();

  ////////////////////////////////////////////////////////////////////////////
  // Connect

  const adbButtonClicked = function() {
    console.log("click ADB tab"),
    console.log("song:", song.allEvents)
  }

  async function connect() {
    try {
      transport = await WebUsbTransport.open(options);
      adbClient = new AdbClient(transport, options, keyStore);
      await adbClient.connect();
      shell = await adbClient.interactiveShell(adbCommandCallback);
    } catch (e) {
      console.error('Connection Failed: ', e);
      disconnect();
    }
  }

  async function disconnect() {
    if (transport != null) {
      try {
        await shell?.close();
        await transport?.close();
      } catch (e) {
        console.error('Error closing the connection', e);
      }
    }
  }

  function adbCommandCallback(text: string) {
    console.log('adbCommandCallback: ' + text);
  }

  return (
    <Tab onClick={ connect }>
    {/* <Help style={IconStyle} /> */}
    <TabTitle>ADB</TabTitle>
  </Tab>
  )
})