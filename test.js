const {onReady,createStreamer} = require("./src/index");
const config = {
    debug:false
};
onReady(config).then(async ()=>{
    console.log("READY")
    const streamer = createStreamer();
    await streamer.onNavigate('https://www.youtube.com/watch?v=YYpF_hwjjCY')
    try{
        await streamer.onStartStreaming();
        // streamer.streamToFile();
    }catch(err){
        console.log(err)
    }
},(err)=>{
    console.log("ERROR",err)
})