const Xvfb = require("xvfb");
function XvfbI(){
    const _inner = {};
    _inner.instance = null;
    _inner.isReady = false;
    const service = {};
    service.onReady = ()=>{
        return new Promise(async (resolve,reject)=>{
            if(_inner.isReady) return resolve();
            try{
                _inner.instance = new Xvfb({
                     xvfb_args:['-screen', '0', '1920x1080x24']
                    });
                _inner.instance.startSync()
                _inner.isReady = true;
                resolve();
            }catch(err){
                reject();
            }
        })
    }
    service.stop = ()=>{
        if(_inner.instance && _inner.instance.stopSync){
            try{
                _inner.instance.stopSync();
            }catch(err){}
        }
    }
    service.isReady = ()=> _inner.isReady;
    return service;
}
const xvfbI = XvfbI();
module.exports.xvfbI = xvfbI;