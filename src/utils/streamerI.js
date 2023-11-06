const { browserI } = require("./browserI");
const initI = require("./initI");

function StreamI(){
    const _inner = {};
    const service = {};
    service.createStreamer = function(){
        let id = null;
        let page = null;
        const browser = browserI.getBrowser();
        const extenstionPage = browserI.getExtensionPage();
        let isStarted = false;
        this.onNavigate = (url)=>{
            return new Promise(async (resolve,reject)=>{
                if(!initI.isReady() || typeof url !== "string") return reject();
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
            return new Promise(async (resolve,reject)=>{
                if(!initI.isReady() || !id || !extenstionPage) return reject();   
                try{
                   const result = await extenstionPage.evaluate((id) => onStartStreaming(id), id);
                   resolve()
                }catch(err){
                    reject(err)
                }
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
        this.streamToFile = ()=>{

        }
        this.streamToRTMP = ()=>{
            
        }
        return this;
    }
    return service;
}
const streamI = StreamI();
module.exports = streamI;