const { exec } = require('child_process')
function AudioSinkI(){
    const _inner = {};
    _inner.audioSinkName = null;
    _inner.audioSinkId = null;
    _inner.isReady = false;
    const service = {};
    service.onReady = ()=>{
        return new Promise((resolve,reject)=>{ 
            if(_inner.isReady) return resolve();
            _inner.audioSinkName = `VIRTUAL_AUDIO_SINK_${Date.now()}`;
            process.env.PULSE_SINK = _inner.audioSinkName;
            exec(`pactl load-module module-null-sink sink_name=${this.audioSinkName}`,(err, stdout) => {
                if(err) return reject();
                _inner.audioSinkId = stdout.toString().trim();
                _inner.isReady = true;
                resolve();
            });
        })
    }
    service.isReady = ()=> _inner.isReady;
    service.stop = ()=>{
        exec(`pact unload-module ${_inner.audioSinkId}`,(err,stdout)=>{
            _inner.isReady = false;
        })
    }
    service.getAudioSinkName = ()=> _inner.audioSinkName;
    return service;
}
const audioSinkI = AudioSinkI();
module.exports.audioSinkI = audioSinkI;