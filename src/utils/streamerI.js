const { browserI } = require("./browserI");
const initI = require("./initI");
const { spawn } = require('child_process');
const { mediaServerI } = require("./mediaServerI");
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
                   mediaServerI.emitter.once(mediaServerI.EVENTS.STREAM_PUBLISHED,_id=>{
                        if(_id === id) return resolve();
                   })
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
            if(!id) return
            const p = spawn('ffmpeg',[
                '-y',
                '-i',
                `rtsp://localhost:8554/${id}`,
                `-f`,
                `mp4`,
                `tes.mp4`
            ])
            p.stdout.on('data',data=>{
                console.log(data.toString())
            })
            p.stderr.on('data',data=>{
                console.log(data.toString())
            })
        }
        this.streamToRTMP = ()=>{
            
        }
        return this;
    }
    return service;
}
const streamI = StreamI();
module.exports = streamI;
