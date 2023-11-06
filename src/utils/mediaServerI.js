const {spawn} = require('child_process')
const path = require('path')
function MediaServerI(){
    const _inner = {};
    _inner.isReady = false;
    _inner.instance = null;
    const service = {};
    service.onReady = ()=>{
        return new Promise((resolve,reject)=>{
            if(_inner.isReady) return resolve();
            const p = spawn(path.join(__dirname,'../mediamtx/mediamtx'),[
                path.join(__dirname,'../mediamtx/mediamtx.yml')
            ])
            p.stdout.on('data',data=>{
                console.log(data.toString())
            })
            p.stderr.on('data',data=>{
                console.log(data.toString())
            })
            _inner.instance = p;
            resolve();
        })
    }
    service.stop = ()=>{
        if(_inner.instance){
            _inner.instance.kill();
        }
    }
    return service;
}
const mediaServerI = MediaServerI();
module.exports.mediaServerI = mediaServerI;