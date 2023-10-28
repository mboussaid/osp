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
        mimeType: 'video/webm;codecs=vp8,vp9,opus',
        videoBitsPerSecond:10000000,
        audioBitsPerSecond:10000000
      });
      recorder.ondataavailable = (e)=>{
        if(e.data.size === 0) return
        socket.emit(EVENTS.RECORDER_DATA,{
          id:id,
          data:e.data
        })
      }
      recorder.start(20);
      recorders[id] = recorder;
    })
}