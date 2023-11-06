// //
// const restartPause = 2000;
// const setAudioBitrate = (section, bitrate, voice) => {
//   let opusPayloadFormat = '';
//   let lines = section.split('\r\n');

//   for (let i = 0; i < lines.length; i++) {
//       if (lines[i].startsWith('a=rtpmap:') && lines[i].toLowerCase().includes('opus/')) {
//           opusPayloadFormat = lines[i].slice('a=rtpmap:'.length).split(' ')[0];
//           break;
//       }
//   }

//   if (opusPayloadFormat === '') {
//       return section;
//   }

//   for (let i = 0; i < lines.length; i++) {
//       if (lines[i].startsWith('a=fmtp:' + opusPayloadFormat + ' ')) {
//           if (voice) {
//               lines[i] = 'a=fmtp:' + opusPayloadFormat + ' minptime=10;useinbandfec=1;maxaveragebitrate='
//                   + (parseInt(bitrate) * 1024).toString();
//           } else {
//               lines[i] = 'a=fmtp:' + opusPayloadFormat + ' maxplaybackrate=48000;stereo=1;sprop-stereo=1;maxaveragebitrate'
//                   + (parseInt(bitrate) * 1024).toString();
//           }
//       }
//   }

//   return lines.join('\r\n');
// };
// const generateSdpFragment = (offerData, candidates) => {
//   const candidatesByMedia = {};
//   for (const candidate of candidates) {
//       const mid = candidate.sdpMLineIndex;
//       if (candidatesByMedia[mid] === undefined) {
//           candidatesByMedia[mid] = [];
//       }
//       candidatesByMedia[mid].push(candidate);
//   }

//   let frag = 'a=ice-ufrag:' + offerData.iceUfrag + '\r\n'
//       + 'a=ice-pwd:' + offerData.icePwd + '\r\n';

//   let mid = 0;

//   for (const media of offerData.medias) {
//       if (candidatesByMedia[mid] !== undefined) {
//           frag += 'm=' + media + '\r\n'
//               + 'a=mid:' + mid + '\r\n';

//           for (const candidate of candidatesByMedia[mid]) {
//               frag += 'a=' + candidate.candidate + '\r\n';
//           }
//       }
//       mid++;
//   }

//   return frag;
// };
// const setCodec = (section, codec) => {
//   const lines = section.split('\r\n');
//   const lines2 = [];
//   const payloadFormats = [];

//   for (const line of lines) {
//       if (!line.startsWith('a=rtpmap:')) {
//           lines2.push(line);
//       } else {
//           if (line.toLowerCase().includes(codec)) {
//               payloadFormats.push(line.slice('a=rtpmap:'.length).split(' ')[0]);
//               lines2.push(line);
//           }
//       }
//   }

//   const lines3 = [];

//   for (const line of lines2) {
//       if (line.startsWith('a=fmtp:')) {
//           if (payloadFormats.includes(line.slice('a=fmtp:'.length).split(' ')[0])) {
//               lines3.push(line);
//           }
//       } else if (line.startsWith('a=rtcp-fb:')) {
//           if (payloadFormats.includes(line.slice('a=rtcp-fb:'.length).split(' ')[0])) {
//               lines3.push(line);
//           }
//       } else {
//           lines3.push(line);
//       }
//   }

//   return lines3.join('\r\n');
// };
// const setVideoBitrate = (section, bitrate) => {
//   let lines = section.split('\r\n');

//   for (let i = 0; i < lines.length; i++) {
//       if (lines[i].startsWith('c=')) {
//           lines = [...lines.slice(0, i+1), 'b=TIAS:' + (parseInt(bitrate) * 1024).toString(), ...lines.slice(i+1)];
//           break
//       }
//   }

//   return lines.join('\r\n');
// };
// class Transmitter {
//   constructor(id,stream) {
//     this.id = id;
//     this.stream = stream;
//     this.pc = null;
//     this.restartTimeout = null;
//     this.sessionUrl = "";
//     this.queuedCandidates = [];
//     this.start();
//   }

//   start() {
//     console.log("requesting ICE servers");

//     fetch(`http://localhost:8889/${this.id}/whip`, {
//       method: "OPTIONS",
//     })
//       .then((res) => this.onIceServers(res))
//       .catch((err) => {
//         console.log("error: " + err);
//         this.scheduleRestart();
//       });
//   }

//   onIceServers(res) {
//     this.pc = new RTCPeerConnection({
//       iceServers: linkToIceServers(res.headers.get("Link")),
//     });

//     this.pc.onicecandidate = (evt) => this.onLocalCandidate(evt);
//     this.pc.oniceconnectionstatechange = () => this.onConnectionState();

//     this.stream.getTracks().forEach((track) => {
//       this.pc.addTrack(track, this.stream);
//     });

//     this.pc.createOffer().then((offer) => this.onLocalOffer(offer));
//   }

//   onLocalOffer(offer) {
//     this.offerData = parseOffer(offer.sdp);
//     this.pc.setLocalDescription(offer);

//     console.log("sending offer");

//     fetch(`http://localhost:8889/${this.id}/whip`, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/sdp",
//       },
//       body: offer.sdp,
//     })
//       .then((res) => {
//         if (res.status !== 201) {
//           throw new Error("bad status code");
//         }
//         this.sessionUrl =  'http://localhost:8889'+res.headers.get("location")
//         return res.text();
//       })
//       .then((sdp) =>
//         this.onRemoteAnswer(
//           new RTCSessionDescription({
//             type: "answer",
//             sdp,
//           })
//         )
//       )
//       .catch((err) => {
//         console.log("error: " + err);
//         this.scheduleRestart();
//       });
//   }

//   onConnectionState() {
//     if (this.restartTimeout !== null) {
//       return;
//     }

//     console.log("peer connection state:", this.pc.iceConnectionState);

//     switch (this.pc.iceConnectionState) {
//       case "disconnected":
//         this.scheduleRestart();
//     }
//   }

//   onRemoteAnswer(answer) {
//     if (this.restartTimeout !== null) {
//       return;
//     }

//     editAnswer(answer, "vp9/90000", "opus/48000", 90000, 48000, true);

//     this.pc.setRemoteDescription(answer);

//     if (this.queuedCandidates.length !== 0) {
//       this.sendLocalCandidates(this.queuedCandidates);
//       this.queuedCandidates = [];
//     }
//   }

//   onLocalCandidate(evt) {
//     if (this.restartTimeout !== null) {
//       return;
//     }

//     if (evt.candidate !== null) {
//       if (this.sessionUrl === "") {
//         this.queuedCandidates.push(evt.candidate);
//       } else {
//         this.sendLocalCandidates([evt.candidate]);
//       }
//     }
//   }

//   sendLocalCandidates(candidates) {
//     fetch(this.sessionUrl, {
//       method: "PATCH",
//       headers: {
//         "Content-Type": "application/trickle-ice-sdpfrag",
//         "If-Match": "*",
//       },
//       body: generateSdpFragment(this.offerData, candidates),
//     })
//       .then((res) => {
//         if (res.status !== 204) {
//           throw new Error("bad status code");
//         }
//       })
//       .catch((err) => {
//         console.log("error: " + err);
//         this.scheduleRestart();
//       });
//   }

//   scheduleRestart() {
//     if (this.restartTimeout !== null) {
//       return;
//     }

//     if (this.pc !== null) {
//       this.pc.close();
//       this.pc = null;
//     }

//     this.restartTimeout = window.setTimeout(() => {
//       this.restartTimeout = null;
//       this.start();
//     }, restartPause);

//     if (this.sessionUrl) {
//       fetch(this.sessionUrl, {
//         method: "DELETE",
//       })
//         .then((res) => {
//           if (res.status !== 200) {
//             throw new Error("bad status code");
//           }
//         })
//         .catch((err) => {
//           console.log("delete session error: " + err);
//         });
//     }
//     this.sessionUrl = "";

//     this.queuedCandidates = [];
//   }
// }
// const editAnswer = (
//   answer,
//   videoCodec,
//   audioCodec,
//   videoBitrate,
//   audioBitrate,
//   audioVoice
// ) => {
//   const sections = answer.sdp.split("m=");

//   for (let i = 0; i < sections.length; i++) {
//     const section = sections[i];
//     if (section.startsWith("video")) {
//       sections[i] = setVideoBitrate(
//         setCodec(section, videoCodec),
//         videoBitrate
//       );
//     } else if (section.startsWith("audio")) {
//       sections[i] = setAudioBitrate(
//         setCodec(section, audioCodec),
//         audioBitrate,
//         audioVoice
//       );
//     }
//   }

//   answer.sdp = sections.join("m=");
// };

// const linkToIceServers = (links) =>
//   links !== null
//     ? links.split(", ").map((link) => {
//         const m = link.match(
//           /^<(.+?)>; rel="ice-server"(; username="(.*?)"; credential="(.*?)"; credential-type="password")?/i
//         );
//         const ret = {
//           urls: [m[1]],
//         };

//         if (m[3] !== undefined) {
//           ret.username = unquoteCredential(m[3]);
//           ret.credential = unquoteCredential(m[4]);
//           ret.credentialType = "password";
//         }

//         return ret;
//       })
//     : [];
// const parseOffer = (offer) => {
//   const ret = {
//     iceUfrag: "",
//     icePwd: "",
//     medias: [],
//   };

//   for (const line of offer.split("\r\n")) {
//     if (line.startsWith("m=")) {
//       ret.medias.push(line.slice("m=".length));
//     } else if (ret.iceUfrag === "" && line.startsWith("a=ice-ufrag:")) {
//       ret.iceUfrag = line.slice("a=ice-ufrag:".length);
//     } else if (ret.icePwd === "" && line.startsWith("a=ice-pwd:")) {
//       ret.icePwd = line.slice("a=ice-pwd:".length);
//     }
//   }

//   return ret;
// };

// //
// const socket = io("http://127.0.0.1:3000");
// const EVENTS = {
//   START_RECORDING: "START_RECORDING",
//   STOP_RECORDING: "STOP_RECORDING",
//   PAUSE_RECORDING: "PAUSE_RECORDING",
//   RESUME_RECORDING: "RESUME_RECORDING",
//   EXTENSION_CONNECTED: "EXTENSION_CONNECTED",
//   EXTENSION_DISCONNECTED: "EXTENSION_DISCONNECTED",
//   RECORDER_DATA: "RECORDER_DATA",
// };
// const recorders = {};
// socket.on("connect", () => {
//   socket.emit(EVENTS.EXTENSION_CONNECTED);
// });

// socket.on("message", (event) => {
//   handleMessage(event);
// });

// socket.on("error", (error) => {
//   console.error("WebSocket Error:", error);
// });

// socket.on("close", (event) => {
//   if (event.wasClean) {
//     console.log(
//       "WebSocket closed cleanly, code=" +
//         event.code +
//         ", reason=" +
//         event.reason
//     );
//   } else {
//     console.error("WebSocket connection died");
//   }
// });
// socket.on(EVENTS.START_RECORDING, (id) => {
//   handleStartRecording(id);
// });
// socket.on(EVENTS.STOP_RECORDING, (id) => {
//   handleStopRecording(id);
// });
// socket.on(EVENTS.PAUSE_RECORDING, (id) => {
//   handlePauseRecording(id);
// });
// socket.on(EVENTS.RESUME_RECORDING, (id) => {
//   handleResumeRecording(id);
// });
// function handleResumeRecording(id) {
//   if (!id) return;
//   const recorder = recorders[id];
//   if (!recorder) return;
//   try {
//     recorder.resume();
//   } catch (err) {}
//   socket.emit(EVENTS.RESUME_RECORDING, {
//     id: id,
//   });
// }
// function handlePauseRecording(id) {
//   if (!id) return;
//   const recorder = recorders[id];
//   if (!recorder) return;
//   try {
//     recorder.pause();
//   } catch (err) {}
//   socket.emit(EVENTS.PAUSE_RECORDING, {
//     id: id,
//   });
// }
// function handleStopRecording(id) {
//   if (!id) return;
//   const recorder = recorders[id];
//   if (!recorder) return;
//   recorder.stop();
//   delete recorders[id];
//   socket.emit(EVENTS.STOP_RECORDING, {
//     id: id,
//   });
// }
// function handleStartRecording(id) {
//   if (!id) return;
//   chrome.tabCapture.capture(
//     {
//       audio: true,
//       video: true,
//       audioConstraints: {
//         mandatory: {
//           chromeMediaSource: "tab",
//           chromeMediaSourceId: id,
//         },
//       },
//       videoConstraints: {
//         mandatory: {
//           chromeMediaSource: "tab",
//           chromeMediaSourceId: id,
//           minWidth: 1920,
//           maxWidth: 1920,
//           minHeight: 1080,
//           maxHeight: 1080,
//           minFrameRate: 30,
//         },
//       },
//     },
//     (stream) => {
//       // tmp work
//       // const context = new AudioContext();
//       // var audio = context.createMediaStreamSource(stream);
//       // audio.connect(context.destination);
//       new Transmitter(id,stream)
//       // const recorder = new MediaRecorder(stream, {
//       //   ignoreMutedMedia: true,
//       //   mimeType: "video/webm;codecs=vp9",
//       //   videoBitsPerSecond: 20000000,
//       //   audioBitsPerSecond: 10000000,
//       // });
//       // recorder.ondataavailable = (e) => {
//       //   if (e.data.size === 0) return;
//       //   socket.emit(EVENTS.RECORDER_DATA, {
//       //     id: id,
//       //     data: e.data,
//       //   });
//       // };
//       // recorder.start(0);
//       // recorder.onstop = () => {
//       //   stream.getTracks().forEach((t) => t.stop());
//       // };
//       // recorders[id] = recorder;
//     }
//   );
// }