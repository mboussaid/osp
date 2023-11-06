const {onReady,createStreamer} = require("./src/index");
const config = {
    debug:true
};
onReady(config).then(async ()=>{
    console.log("READY")
    const streamer = createStreamer();
    await streamer.onNavigate('chrome://version')
},(err)=>{
    console.log("ERROR",err)
})