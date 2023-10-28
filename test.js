const OSPService = require('./src/OSPService')
const fs = require('fs');
OSPService.onReady()
.then(async ()=>{
    const instance = new OSPService();
    await instance.goto('https://www.youtube.com/watch?v=kl69a9JEXM0');
    const stream = await instance.startRecording();
    // const writeStream = fs.createWriteStream('file.mp4')
    // stream.pipe(writeStream)
    await instance.pipeToFile('hello.mp4')
},()=>{})
