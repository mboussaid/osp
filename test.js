const OSPService = require('./src/OSPService')
const fs = require('fs');
OSPService.initializeOSPService()
.then(async ()=>{
    const instance1 = new OSPService();
    await instance1.navigateToURL('chrome://version/');
    const stream1 = await instance1.startVideoRecording();
    await instance1.streamToRTMPServer('rtmp://localhost/live/stream1')
    setTimeout(async ()=>{
        await instance1.stopVideoRecording();
    },5000)
},()=>{})
 