const {onReady,createStreamer} = require("./src/index");
const config = {
    debug:true
};
onReady(config).then(async ()=>{
    console.log("READY")
    const streamer = createStreamer();
    await streamer.onNavigate('chrome://about')
    try{
        await streamer.onStartStreaming();
        // streamer.streamToFile();
    }catch(err){
        console.log(err)
    }
},(err)=>{
    console.log("ERROR",err)
})