const OSPService = require('./src/OSPService')
const fs = require('fs');
OSPService.onReady()
.then(async ()=>{
    const instance = new OSPService();
    await instance.goto('https://youtube.com/');
    const stream = await instance.startRecording();
    console.log(">>>>>>>>")
    // await instance.pipeToRtmp('rtmp://a.rtmp.youtube.com/live2','8uyg-6b3u-ev9z-mrw1-dxj5')
    const writeStream = fs.createWriteStream('./file.mp4')
    stream.pipe(writeStream)
    // await instance.stopRecording();
},()=>{})
