const { audioSinkI } = require("./audioSinkI");
const { xvfbI } = require("./xvfbI");

function CleanI(){
    const _inner = {};
    _inner.isReady = false;
    const service = {};
    service.onReady = ()=>{
        return new Promise((resolve,reject)=>{
            if(_inner.isReady) return resolve();
            process.once('SIGINT',service.clean)
            process.once('exit',service.clean)
            _inner.isReady = true;
            resolve();
        })
    }
    service.clean = ()=>{
        xvfbI.stop();
        audioSinkI.stop();
    }
    return service;
}
const cleanI = CleanI();
module.exports.cleanI = cleanI;