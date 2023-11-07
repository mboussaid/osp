const {spawn} = require('child_process')
const path = require('path');
const EventEmitter = require('events');
function MediaServerI(){
    const _inner = {};
    _inner.isReady = false;
    _inner.instance = null;
    const service = {};
    service.EVENTS = {
        STREAM_PUBLISHED:'STREAM_PUBLISHED'
    }
    service.emitter = new EventEmitter();
    _inner.watcher = null
    service.runWatcher = ()=>{
        if(_inner.watcher) return
        _inner.watcher = setInterval(()=>{
            fetch
        },1000)
    }
    service.onReady = ()=>{
        return new Promise((resolve,reject)=>{
            if(_inner.isReady) return resolve();
            const p = spawn(path.join(__dirname,'../mediamtx/mediamtx'),[
                path.join(__dirname,'../mediamtx/mediamtx.yml')
            ])
            p.stdout.on('data',data=>{
                data = data.toString();
                // check published
                const match1 = data.match(/publishing to path '([^']+)'/);

                if (match1 && match1[1]) {
                  const pathValue = match1[1];
                  service.emitter.emit(service.EVENTS.STREAM_PUBLISHED,pathValue)
                }
                console.log(data)
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