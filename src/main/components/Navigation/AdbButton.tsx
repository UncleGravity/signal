import { AdbClient, KeyStore, Options, Shell, WebUsbTransport } from '@vieratech/wadb';
import { makeObservable, observable } from 'mobx';
import { observer } from "mobx-react-lite";
import { FC } from "react";
import { useStores } from "../../hooks/useStores";
import { Tab, TabTitle } from "./Navigation";

////////////////////////////////////////////////////////////////////////////
// ADB Crypto, needed to init AdbClient
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

////////////////////////////////////////////////////////////////////////////
// ADB Class
export default class AdbObject {
  commandQueue: Array<Function> = [];
  transport: WebUsbTransport | null = null;
  adbClient: AdbClient | null = null;
  shell: Shell | null = null;
  keyStore: KeyStore
  isConnected: boolean = false;

  constructor() {

    makeObservable<AdbObject>(this, {
      shell: observable,
      isConnected: observable
    })
  
    // ADB Crypto
    this.keyStore = new MyKeyStore();
  }

  ////////////////////////////////////////////////////////////////////////////
  // Connect

  checkConnection() {
    if (this.transport == null) {
      return false;
    } else {
      if(this.transport.isAdb()) {
        return true;
      } else {
        return false;
      }
    }
  }

  async connect() {
    if(this.checkConnection()) {
      // already connected to adb
      console.log("already connected to adb")
      return;
    }
    
    try {

      // ADB Crypto
      const options: Options = {
        debug: false,
        useChecksum: false,
        dump: false,
        keySize: 2048,
      };

      this.transport = await WebUsbTransport.open(options);
      this.adbClient = new AdbClient(this.transport, options, this.keyStore);
      await this.adbClient.connect();
      this.shell = await this.adbClient.interactiveShell(this.adbCommandCallback);

    } catch (e) {
      console.error('Connection Failed: ', e);
      this.disconnect();
    }
  }

  async disconnect() {
    if (this.transport != null) {
      try {
        await this.shell?.close();
        await this.transport?.close();
      } catch (e) {
        console.error('Error closing the connection', e);
      }
    }
  }

  adbCommandCallback(text: string) {
    console.log('adbCommandCallback: ' + text);
  }

  async sendCommand(cmd: string, newline = true) {
    if (!this.checkConnection()) {
      // not connected to adb, cannot send
      console.log("Not connected to ADB. Cannot send.")
      this.disconnect()
      return false;
    }
    let nl = "";
    if (newline) { nl = "\n" }
  
    this.shell!.write(cmd + nl)
      .then()
      .catch((e) => {
        console.error('Error writing to shell.', e);
        if (String(e).includes("transferOut") || String(e).includes("transferIn")) {
          console.log("Disconnected, resetting variables and UI")
          this.disconnect();
        }
      });
    return true;
  }

}

import { faCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export const AdbButton: FC = observer(() => {

  ////////////////////////////////////////////////////////////////////////////
  // Global Variables

  let { song, adbObject } = useStores()

  function connectToAdb() {
    // adbObject.connect()
    console.log(adbObject.isConnected)
  }

  function sendAdbCommand() {
    adbObject.sendCommand("echo 'hello world'")
  }

  return (
    <Tab onClick={ connectToAdb }>
      {/* <Help style={IconStyle} /> */}
      {/* Green icon rendered next to the title, centered vertically and horizontally */}
      <FontAwesomeIcon icon={faCircle} style={{ color: adbObject.isConnected ? '#8BC34A' : '#FF6961' }} />
      <TabTitle>Connect</TabTitle>
    </Tab>
    )
})