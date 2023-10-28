const OSPService = require('./src/OSPService')
const fs = require('fs');
OSPService.initializeOSPService()
.then(async ()=>{
    const instance1 = new OSPService();
    await instance1.navigateToURL('https://www.youtube.com/watch?v=kl69a9JEXM0');
    const stream1 = await instance1.startVideoRecording();
    await instance1.streamToRTMPServer('rtmp://localhost/live/stream1')

},()=>{})
 