const puppeteer = require("puppeteer");
const path = require("path");
const WebSocket = require("ws");
const extensionPath = path.join(__dirname, "chrome-extension");
const extensionId = "jjndjgheafjngoipoacpjgeicjeomjli";
const EVENTS = require("./events");
const EventEmitter = require("events");
const myEmitter = new EventEmitter();
const express = require("express");
const socketIo = require("socket.io");
const http = require("http");
const { Transform } = require("stream");
const { spawn, exec } = require("child_process");
const Xvfb = require("xvfb");
let isReady = false;
let io = null;
let browser = null;
let xvfb = null;
let audioSinkName = null;
let audioSinkId = null;
const streams = {};
function clean(){
  spawn('pactl', [
    'unload-module',
    audioSinkId
  ]);
}
process.on('exit',clean)
process.on('SIGINT',clean)
function handleMessage(message) {
  if (!message) return;
  const json = JSON.parse(message);
  switch (json.event) {
    case EVENTS.EXTENSION_CONNECTED:
      myEmitter.emit(EVENTS.EXTENSION_CONNECTED);
      break;
  }
}
async function onStartAudioSink() {
  return new Promise((resolve, reject) => {
    audioSinkName = `OSP_AUIDIO_SINK_${Date.now()}`;
    process.env.PULSE_SINK = audioSinkName;
    exec(
      `pactl load-module module-null-sink sink_name=${this.audioSinkName}`,
      (err, stdout) => {
        audioSinkId = stdout.toString().trim();
        resolve();
      }
    );
  });
}

function onHandleWebSocketServer() {
  return new Promise((resolve, reject) => {
    const app = express();
    const server = http.createServer(app);
    tmp = socketIo(server);
    tmp.on("connection", (socket) => {
      socket.on(EVENTS.EXTENSION_CONNECTED, (data) => {
        myEmitter.emit(EVENTS.EXTENSION_CONNECTED);
      });
      socket.on(EVENTS.RECORDER_DATA, (data) => {
        myEmitter.emit(EVENTS.RECORDER_DATA, data);
      });
      socket.on(EVENTS.STOP_RECORDING, (data) => {
        myEmitter.emit(EVENTS.STOP_RECORDING, data);
      });
      socket.on(EVENTS.PAUSE_RECORDING, (data) => {
        myEmitter.emit(EVENTS.PAUSE_RECORDING, data);
      });
      socket.on(EVENTS.RESUME_RECORDING, (data) => {
        myEmitter.emit(EVENTS.RESUME_RECORDING, data);
      });
    });
    server.listen(3000);
    resolve(tmp);
  });
}
function send(message) {
  if (!message) return;
  sockets.forEach((socket) => {
    socket.send(message);
  });
}
function onHandleBrowser() {
  return new Promise(async (resolve, reject) => {
    xvfb = new Xvfb({
      xvfb_args:['-screen', '0', '1920x1080x24']
    });
    xvfb.startSync()
    puppeteer
      .launch({
        headless: false,
        defaultViewport: null,
        args: [
          `--load-extension=${extensionPath}`,
          `--disable-extensions-except=${extensionPath}`,
          `--disable-popup-blocking`,
          `--allowlisted-extension-id=${extensionId}`,
          `--autoplay-policy=no-user-gesture-required`,
          "--hide-scrollbars",
          "--disable-infobars",
          "--enable-automation",
          "--hide-crash-restore-bubble",
          "--enable-usermedia-screen-capturing",
          "--allow-http-screen-capture",
          "--shm-size=1gb",
          "--disable-dev-shm-usage",
          "--no-zygote",
          "--no-sandbox",
          `--alsa-output-device=${audioSinkName}`,
          '--start-maximized',
          '--kiosk',
          "--start-fullscreen"
        ],
        ignoreDefaultArgs: ["--enable-automation"],
        protocolTimeout: 0,
        ignoreHTTPSErrors:true
      })
      .then((browser) => {
        myEmitter.once(EVENTS.EXTENSION_CONNECTED, () => {
          resolve(browser);
        });
      }, reject);
  });
}
class OSPService {
  static async initializeOSPService() {
    return new Promise(async (resolve, reject) => {
      if (isReady) return resolve();
      io = await onHandleWebSocketServer();
      await onStartAudioSink();
      console.log({
        audioSinkName,
        audioSinkId
      })
      browser = await onHandleBrowser();
      resolve();
    });
  }
  #page = null;
  #processes = [];
  #stream = null;
  constructor() {
    this.#page = null;
  }
  async navigateToURL(url) {
    return new Promise(async (resolve, reject) => {
      if (!browser) return reject();
      this.#page = await browser.newPage();
      await this.#page.setDefaultNavigationTimeout(0); // Set a longer timeout (e.g., 60 seconds)
      await this.#page.goto(url);
      await this.#page.setViewport({
        width:1920,
        height:1080
      });
      resolve();
    });
  }
  async #onGetPageId() {
    return new Promise(async (resolve, reject) => {
      if (!this.#page) return reject();
      const tatget = await this.#page.target();
      resolve(tatget._targetId);
    });
  }
  async startVideoRecording() {
    return new Promise(async (resolve, reject) => {
      if (!this.#page) return reject();
      const id = await this.#onGetPageId();
      io.emit(EVENTS.START_RECORDING, id);
      const stream = new Transform({
        transform: (chunk, _, callback) => {
          callback(null, chunk);
        },
      });
      myEmitter.on(EVENTS.RECORDER_DATA, (data) => {
        if (data.id === id) {
          stream.write(new Buffer.from(data.data));
        }
      });
      this.#stream = stream;
      resolve(stream);
    });
  }
  async stopVideoRecording() {
    return new Promise(async (resolve, reject) => {
      if (!this.#page ) return reject();
      if(!this.#stream) return resolve();
      const id = await this.#onGetPageId();
      io.emit(EVENTS.STOP_RECORDING, id);
      myEmitter.once(EVENTS.STOP_RECORDING, (data) => {
        if (data.id === id) {
          this.#stream.destroy();
          this.#stream = null;
          resolve();
        }
      });

    });
  }
  async pauseVideoRecording(){
    return new Promise(async (resolve,reject)=>{
      if(!this.#page || !this.#stream) return reject();
      const id = await this.#onGetPageId();
      io.emit(EVENTS.PAUSE_RECORDING, id);
      myEmitter.once(EVENTS.PAUSE_RECORDING, (data) => {
        if (data.id === id) {
          resolve();
        }
      });

    })
  }
  async resumeVideoRecording(){
    return new Promise(async (resolve,reject)=>{
      if(!this.#page || !this.#stream) return reject();
      const id = await this.#onGetPageId();
      io.emit(EVENTS.RESUME_RECORDING, id);
      myEmitter.once(EVENTS.RESUME_RECORDING, (data) => {
        if (data.id === id) {
          resolve();
        }
      });

    })
  }
  async streamToRTMPServer(url, key) {
    return new Promise((resolve, reject) => {
      if (!url || !this.#stream) return reject();
      const rmtpUrl = url && key ? `${url}/${key}` : url;
      const args = `-re -i pipe:0 -c:v libx264 -pix_fmt yuv420p -profile:v high -preset slow -tune film -crf 18 -b:a 384k -ac 2 -ar 44100 -c:a aac -f flv ${rmtpUrl}`
      const process = spawn("ffmpeg",args.split(" ").map(item=>item.trim()));
      // process.stderr.on("data", (data) => console.log(data.toString()));
      // process.stdout.on("data", (data) => console.log(data.toString()));
      this.#stream.pipe(process.stdin);
      this.#processes.push(process);
      resolve();
    });
  }
  async streamToFile(filePath) {
    return new Promise((resolve, reject) => {
      if (!filePath || !this.#stream) return reject();
      const ext = path.extname(filePath).replace('.','')
      const args = `-re -y -i pipe:0 -c copy -f ${ext} ${filePath}`
      const process = spawn("ffmpeg",args.split(" ").map(item=>item.trim()));
      // process.stderr.on("data", (data) => console.log(data.toString()));
      // process.stdout.on("data", (data) => console.log(data.toString()));
      this.#stream.pipe(process.stdin);
      this.#processes.push(process);
      resolve();
    });
  }
}
module.exports = OSPService;
