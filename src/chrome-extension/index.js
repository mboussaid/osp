const instances = {};
// const socket = io("ws://127.0.0.1:4040", {
//   extraHeaders: {
//     id: 1,
//   },
// });
var ws = new WebSocket("ws://" + "localhost:5050" + "/magicmirror");
ws.onmessage = function (message) {
  var parsedMessage = JSON.parse(message.data);
  //console.info('Received message: ' + message.data);

  switch (parsedMessage.id) {
    case "startResponse":
      startResponse(parsedMessage);
      break;
    case "error":
      if (state == I_AM_STARTING) {
        setState(I_CAN_START);
      }
      onError("Error message from server: " + parsedMessage.message);
      break;
    case "iceCandidate":
      webRtcPeer.addIceCandidate(parsedMessage.candidate);
      break;
    case "ffmpeg":
      console.log("From ffmpeg:", parsedMessage.message);
      break;
    case "rtmp":
      console.log("Recv rtmp request:", parsedMessage.message);
      // playrtmp('rtmp://' + location.hostname + parsedMessage.message);
      break;
    default:
      // if (state == I_AM_STARTING) {
      // 	setState(I_CAN_START);
      // }
      onError("Unrecognized message", parsedMessage);
  }
};

var webRtcPeer;
//
function sendMessage(message) {
  var jsonMessage = JSON.stringify(message);
  console.log("Senging message: " + jsonMessage);
  ws.send(jsonMessage);
}
function onIceCandidate(candidate) {
  console.log("Local candidate" + JSON.stringify(candidate));

  var message = {
    id: "onIceCandidate",
    candidate: candidate,
  };
  sendMessage(message);
}
function onOffer(error, offerSdp) {
  if (error) return onError(error);

  console.info("Invoking SDP offer callback function " + location.host);
  var message = {
    id: "start",
    sdpOffer: offerSdp,
  };
  sendMessage(message);
}

function onError(error) {
  console.error(error);
}

function startResponse(message) {
  // setState(I_CAN_STOP);
  console.log("SDP answer received from server. Processing ...");
  webRtcPeer.processAnswer(message.sdpAnswer);
}

//
function onStartStreaming(id) {
  return new Promise((resolve, reject) => {
    if (!id) return reject();
    if (instances[id]) return resolve();
    chrome.tabCapture.capture(
      {
        audio: true,
        video: true,
        audioConstraints: {
          mandatory: {
            chromeMediaSource: "tab",
            chromeMediaSourceId: id,
          },
        },
        videoConstraints: {
          mandatory: {
            chromeMediaSource: "tab",
            chromeMediaSourceId: id,
            minWidth: 1920,
            maxWidth: 1920,
            minHeight: 1080,
            maxHeight: 1080,
            minFrameRate: 30,
          },
        },
      },
      (stream) => {
        if (stream) {
          // Get the video and audio tracks from the provided stream
          const videoTrack = stream.getVideoTracks()[0];
          const audioTrack = stream.getAudioTracks()[0];

          // Set constraints for video and audio tracks
          const videoConstraints = {
            width: { ideal: 1920 }, // Set ideal width for video
            height: { ideal: 1080 }, // Set ideal height for video
            frameRate: { ideal: 30, min: 15 }, // Set ideal and minimum frame rate for video
          };

          const audioConstraints = {
            echoCancellation: true, // Enable echo cancellation if available
            noiseSuppression: true, // Enable noise suppression if available
          };

          // Apply constraints to video and audio tracks
          const videoStream = new MediaStream([videoTrack.clone()]);
          videoTrack.applyConstraints(videoConstraints);

          const audioStream = new MediaStream([audioTrack.clone()]);
          audioTrack.applyConstraints(audioConstraints);

          // Create the WebRtcPeerSendrecv with modified streams
          webRtcPeer = kurentoUtils.WebRtcPeer.WebRtcPeerSendrecv(
            {
              onicecandidate: onIceCandidate,
              videoStream: videoStream,
              audioStream: audioStream,
            },
            function (error) {
              if (error) return onError(error);
              this.generateOffer(onOffer);
            }
          );

          resolve();
        } else {
          reject();
        }
      }
    );
  });
}
function onStopStreaming(id) {
  return new Promise((resolve, reject) => {
    if (!id) return reject();
    resolve();
  });
}
