const socket = io("http://127.0.0.1:3000");
const EVENTS = {
  START_RECORDING: 'START_RECORDING',
  STOP_RECORDING: 'STOP_RECORDING',
  PAUSE_RECORDING: 'PAUSE_RECORDING',
  RESUME_RECORDING: 'RESUME_RECORDING',
  EXTENSION_CONNECTED: 'EXTENSION_CONNECTED',
  EXTENSION_DISCONNECTED: 'EXTENSION_DISCONNECTED',
  RECORDER_DATA:'RECORDER_DATA'
}
const recorders = {};
socket.on('connect', () => {
  socket.emit(EVENTS.EXTENSION_CONNECTED);
});

socket.on('message', (event) => {
  handleMessage(event);
});

socket.on('error', (error) => {
  console.error("WebSocket Error:", error);
});

socket.on('close', (event) => {
  if (event.wasClean) {
    console.log("WebSocket closed cleanly, code=" + event.code + ", reason=" + event.reason);
  } else {
    console.error("WebSocket connection died");
  }
});
socket.on(EVENTS.START_RECORDING,id=>{
  handleStartRecording(id)
})
socket.on(EVENTS.STOP_RECORDING,id=>{
  handleStopRecording(id)
})
socket.on(EVENTS.PAUSE_RECORDING,id=>{
  handlePauseRecording(id)
})
socket.on(EVENTS.RESUME_RECORDING,id=>{
  handleResumeRecording(id)
})
function handleResumeRecording(id){
  if(!id) return
  const recorder = recorders[id];
  if(!recorder) return
  try{
    recorder.resume();
  }catch(err){}
  socket.emit(EVENTS.RESUME_RECORDING,{
    id:id
  })
}
function handlePauseRecording(id){
  if(!id) return
  const recorder = recorders[id];
  if(!recorder) return
  try{
    recorder.pause();
  }catch(err){}
  socket.emit(EVENTS.PAUSE_RECORDING,{
    id:id
  })
}
function handleStopRecording(id){
  if(!id) return
  const recorder = recorders[id];
  if(!recorder) return
  recorder.stop();
  delete recorders[id];
  socket.emit(EVENTS.STOP_RECORDING,{
    id:id
  })
}
function handleStartRecording(id){
  if(!id) return
  chrome.tabCapture.capture({
    audio:true,
    video: true,
    audioConstraints:{
      mandatory: {
        chromeMediaSource: "tab",
        chromeMediaSourceId: id,
      }
    },
    videoConstraints: {
      mandatory: {
        chromeMediaSource: 'tab',
        chromeMediaSourceId: id,
        minWidth: 1920,
        maxWidth: 1920,
        minHeight: 1080,
        maxHeight: 1080,
        minFrameRate: 30,
      }
    }},stream=>{
      // tmp work
      // const context = new AudioContext();
      // var audio = context.createMediaStreamSource(stream);
      // audio.connect(context.destination);
      ///
      const recorder = new MediaRecorder(stream,{
        ignoreMutedMedia:true,
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond:20000000,
        audioBitsPerSecond:10000000
      });
      recorder.ondataavailable = (e)=>{
        if(e.data.size === 0) return
        socket.emit(EVENTS.RECORDER_DATA,{
          id:id,
          data:e.data
        })
      }
      recorder.start(0);
      recorder.onstop = ()=>{
        stream.getTracks().forEach(t=>t.stop())
      }
      recorders[id] = recorder;
    })
}