import { faCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { AdbClient, KeyStore, Options, Shell, WebUsbTransport } from '@vieratech/wadb';
import { action, makeObservable, observable } from 'mobx';
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
  transport: WebUsbTransport | null = null;
  adbClient: AdbClient | null = null;
  shell: Shell | null = null;
  keyStore: KeyStore
  isConnected: boolean = false;
  private commandQueue: Array<string> = [];
  private processing = false;

  constructor() {

    makeObservable<AdbObject>(this, {
      shell: observable,
      isConnected: observable,
      connect: action,
      disconnect: action
    })
  
    // ADB Crypto
    this.keyStore = new MyKeyStore();
    this.adbCommandCallback = this.adbCommandCallback.bind(this);
  }

  ////////////////////////////////////////////////////////////////////////////
  // Connection

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

  async connect(callback: (internalVar: string) => void) {
    if(this.checkConnection()) {
      // already connected to adb
      console.log("already connected to adb")
      return;
    }
    
    try {
      
      // Setup external callback
      // this._onDisconnectCallbac = callback;

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
      this.adbCommandCallback = this.adbCommandCallback.bind(this);
      this.adbClient.onDisconnectCallback = callback
      this.isConnected = true
      this.processing = false;
      this.commandQueue = [];
      this.addToCommandQueue("su")

    } catch (e) {
      console.error('Connection Failed: ', e);
      // this.disconnect();
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

    this.isConnected = false
    this.commandQueue  = [];
    this.transport = null;
    this.adbClient = null;
    this.shell = null;

  }

  ////////////////////////////////////////////////////////////////////////////
  // Commands

  async sleep(seconds: number) {
    return new Promise((resolve) =>setTimeout(resolve, seconds * 1000));
  }

  // send note and on/off as command to adb
  // convert midi note to frequency
  // use sendevent /dev/input/event1 18 1 $freq
  sendNote(note: number, on: boolean) {
    if (!this.checkConnection()) {
      // not connected to adb, cannot send
      console.log("Not connected to ADB. Cannot send.")
      return;
    }
    // console.log("Sending note: " + note + " on: " + on + "")
    //convert note to frequency
    let freq = on ? 440 * Math.pow(2, (note - 69) / 12) : 0
    let cmdString = "sendevent /dev/input/event1 18 1 " + freq
    this.addToCommandQueue(cmdString)
  }

  public addToCommandQueue(cmd: string) {
    this.commandQueue.push(cmd);
    this.processQueue();
  }

  private processQueue() {
    if (!this.processing && this.commandQueue.length > 0) {
      this.processing = true;
      const cmd = this.commandQueue.shift();
      this.sendCommand(cmd!);
    }
  }

  private async adbCommandCallback(result: string) {

    // console.log('adbCommandCallback:',result);
    if(!result.includes("bengal")) {
      // await this.sleep(0.01);
      this.processing = false;
      this.processQueue()
    }
  }

  async sendCommand(cmd: string, newline = true) {
    // console.log("Sending command: " + cmd)
    if (!this.checkConnection()) {
      // not connected to adb, cannot send
      console.log("Not connected to ADB. Cannot send.")
      // this.disconnect()
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

export const AdbButton: FC = observer(() => {

  ////////////////////////////////////////////////////////////////////////////
  // Global Variables

  let { song, adbObject } = useStores()

  function connectToAdb() {
    if(!adbObject.isConnected) {
      adbObject.connect(onAdbDisconnect)
    } else {
      adbObject.disconnect()
    }
  }

  function onAdbDisconnect(error: string) {
    console.log("onAdbDisconnect: " + error)
    adbObject.disconnect()
  }

  function sendAdbCommand() {
    adbObject.sendCommand("echo 'hello world'")
  }

  return (
    <Tab onClick={ connectToAdb }>
      {/* <Help style={IconStyle} /> */}
      {/* Green icon rendered next to the title, centered vertically and horizontally */}
      <FontAwesomeIcon icon={faCircle} style={{ color: adbObject.isConnected ? '#8BC34A' : '#FF6961' }} />
      <TabTitle>{ adbObject.isConnected ? 'Disconnect' : 'Connect' }</TabTitle>
    </Tab>
    )
})