const OSPService = require('./src/OSPService')
const fs = require('fs');
OSPService.onReady()
.then(async ()=>{
    const instance = new OSPService();
    await instance.goto('chrome://chrome-urls');
    await instance.startRecording();
    await instance.pipeToFile('hello.mp4')
},()=>{})
