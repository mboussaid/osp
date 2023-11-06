const instances = {};
function onStartStreaming(id){
  return new Promise((resolve,reject)=>{
    if(!id) return reject();
    if(instances[id]) return resolve();
      chrome.tabCapture.capture(
    {
      audio: true,
      video: true,
      audioConstraints: {
        mandatory: {
          chromeMediaSource: "tab",
          chromeMediaSourceId: id,
        },
      },
      videoConstraints: {
        mandatory: {
          chromeMediaSource: "tab",
          chromeMediaSourceId: id,
          minWidth: 1920,
          maxWidth: 1920,
          minHeight: 1080,
          maxHeight: 1080,
          minFrameRate: 30,
        },
      },
    },
    (stream) => {
      if(stream){
        const instance = new Transmitter(id,stream);
        instances[id] = instance;
        resolve();
      }else{
        reject();
      }
    }
  );
  })
}
function onStopStreaming(id){
  return new Promise((resolve,reject)=>{
    if(!id) return reject();
    resolve();
  })
}