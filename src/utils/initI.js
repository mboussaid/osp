const { audioSinkI } = require("./audioSinkI");
const { browserI } = require("./browserI");
const { cleanI } = require("./cleanI");
const { mediaServerI } = require("./mediaServerI");
const { xvfbI } = require("./xvfbI");
function InitI(){
    const _inner = {};
    _inner.options = {};
    _inner.isReady = false;
    const service = {};
    service.onReady = (options)=>{
        return new Promise(async (resolve,reject)=>{
            if(_inner.isReady) return resolve();
            const debug = options && options.debug ? true : false;
            if(typeof options === "object"){
                Object.assign(_inner.options,options)
            }
            try{
                // await mediaServerI.onReady();
                await xvfbI.onReady();
                await audioSinkI.onReady();
                await cleanI.onReady();
                await browserI.onReady(options);
                _inner.isReady = true;
                resolve();
            }catch(err){
                reject(err);
            }
        })
    }
    service.isReady = ()=> _inner.isReady;
    return service;
}
const initI = InitI();
module.exports = initI;