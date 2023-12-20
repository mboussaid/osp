const http = require("http");
const express = require("express");
const socketIO = require("socket.io");
const app = express();
const path = require("path");
const { browserI } = require("./src/utils/browserI");
app.use('/overlay-app',express.static(path.join(__dirname,'./overlay-app')))
const {onReady,createStreamer} = require("./src/index");
const config = {
    debug:false
};
const streamers = {};
onReady(config).then(() => {
    const server = http.createServer(app);
    const io = socketIO(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });
    const overlays = {};
    io.on("connection",(socket) => {
      const id = socket.handshake.headers.id;
      if(!id) return
      if (!streamers[id]) {
        const streamer = new createStreamer();
        streamers[id] = streamer;
        streamer.onNavigate(`http://localhost:4040/overlay-app/?id=${id}`)
        .then(()=>{},()=>{})
        .finally(()=>{
          streamer.onStartStreaming().then(()=>{},()=>{})
        })
      }
      socket.join(id);
      if(!Array.isArray(overlays[id])){
        overlays[id] = [];
      }
      socket.emit("overlays:list",overlays[id]);
      socket.on("overlays:update", (obj) => {
        const ref = overlays[id].find((o) => o.id === obj.id);
        if (ref) {
          for (let key in obj) {
            ref[key] = obj[key];
          }
        }
        socket.to(id).emit("overlays:update", obj);
      });
      socket.on("overlays:add", (obj) => {
        overlays[id].push(obj);
        socket.to(id).emit("overlays:add", obj);
      });
      socket.on("disconnected", () => {
        if (!io.sockets.adapter.rooms.get(id).size) {
          delete overlays[id];
        }
      });
    });

    const PORT = process.env.PORT || 4040;
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  },
  () => {}
);
