const OSPService = require('./src/OSPService')
const fs = require('fs');
OSPService.initializeOSPService()
.then(async ()=>{
    const instance1 = new OSPService();
    await instance1.navigateToURL('https://www.youtube.com/watch?v=CeAindL1bsE');
    const stream1 = await instance1.startVideoRecording();
    await instance1.streamToFile('file.mp4')
    setTimeout(async ()=>{
        await instance1.stopVideoRecording();
        process.exit(0)
    },60*1000*2)
},()=>{})
 