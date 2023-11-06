const { audioSinkI } = require("./audioSinkI");
const path = require('path')
const extensionPath = path.join(__dirname, "../chrome-extension");
const extensionId = "jjndjgheafjngoipoacpjgeicjeomjli";
const {launch} = require("puppeteer");
function BrowserI(options){
    const _inner = {};
    _inner.isReady = false;
    _inner.instance = null;
    const service = {};
    service.getArgs = (debug)=>{
        const args =  [
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
            "--no-sandbox"
    ]
        if(!debug){
            args.concat([
                `--alsa-output-device=${audioSinkI.getAudioSinkName()}`,
                '--start-maximized',
                '--kiosk',
                "--start-fullscreen"
            ])
        }
        return args;
    }
    service.isReady = ()=> _inner.isReady;
    service.onReady = ()=>{
        return new Promise(async (resolve,reject)=>{
            const debug = options && options.debug ? true : false;
            if(_inner.isReady) return resolve();
            try{
                _inner.instance = await launch({
                    headless:false,
                    defaultViewport:null,
                    args:service.getArgs(debug)
                })
                _inner.extensionPage = (await _inner.instance.pages())[0];
                await _inner.extensionPage.goto('chrome-extension://jjndjgheafjngoipoacpjgeicjeomjli/index.html')
                _inner.isReady = true;
                resolve();
            }catch(err){
                reject(err);
            }
        })
    }
    _inner.extensionPage = null;
    service.getExtensionPage = ()=> _inner.extensionPage;
    service.getBrowser = ()=> _inner.instance
    return service;
}
const browserI = BrowserI();
module.exports.browserI = browserI;