const { browserI } = require("./browserI");
const initI = require("./initI");

function StreamI(){
    const _inner = {};
    const service = {};
    service.createStreamer = function(){
        let id = null;
        let page = null;
        const browser = browserI.getBrowser();
        let STATES = {
            UNREADY:0,
            READY:1,
            STREAMING_STARTED:2,
            STREAMING_STOPPED:3,
            STREAMING_PAUSED:4,
            STREAMING_RESUMED:5
        }
        let state = STATES.UNREADY;
        this.onNavigate = (url)=>{
            return new Promise(async (resolve,reject)=>{
                if(!initI.isReady() || typeof url !== "string") return reject();
                console.log(browserI.getExtensionPage())
                if(!page){
                    try{
                        page = await browser.newPage();
                    }catch(err){
                        return reject(err);
                    } 
                }
                try{
                    await page.setDefaultNavigationTimeout(0); // Set a longer timeout (e.g., 60 seconds)
                    await page.goto(url);
                    await page.setViewport({
                        width:1920,
                        height:1080
                    });
                    id = (await page.target())._targetId
                    resolve();
                }catch(err){
                    reject(err)
                }
            })
        }
        this.onStartStreaming = ()=>{
            return new Promise((resolve,reject)=>{
                if(!initI.isReady() || !id) return reject();   
            })
        }
        this.onStopStreaming = ()=>{
            return new Promise((resolve,reject)=>{
                if(!initI.isReady() || !id) return reject(); 
            })
        }
        this.onPauseStreaming = ()=>{
            return new Promise((resolve,reject)=>{
                if(!initI.isReady() || !id) return reject();  
            })
        }
        this.onResumeStreaming = ()=>{
            return new Promise((resolve,reject)=>{
                if(!initI.isReady() || !id) return reject();   
            })
        }
        this.onClose = ()=>{
            return new Promise((resolve,reject)=>{
                if(!initI.isReady()) return reject(); 
            })
        }
        return this;
    }
    return service;
}
const streamI = StreamI();
module.exports = streamI;
