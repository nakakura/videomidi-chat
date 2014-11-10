// Compatibility shim
navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

// PeerJS object
var peer = new Peer({
    key: '68565e9a-6156-11e4-96c3-37bf663d804d',
    debug: 3,
    config: {
        'iceServers': [
            {url:'stun:stun01.sipphone.com'},
            {url:'stun:stun.ekiga.net'},
            {url:'stun:stun.fwdnet.net'},
            {url:'stun:stun.ideasip.com'},
            {url:'stun:stun.iptel.org'},
            {url:'stun:stun.rixtelecom.se'},
            {url:'stun:stun.schlund.de'},
            {url:'stun:stun.l.google.com:19302'},
            {url:'stun:stun1.l.google.com:19302'},
            {url:'stun:stun2.l.google.com:19302'},
            {url:'stun:stun3.l.google.com:19302'},
            {url:'stun:stun4.l.google.com:19302'},
            {url:'stun:stunserver.org'},
            {url:'stun:stun.softjoys.com'},
            {url:'stun:stun.voiparound.com'},
            {url:'stun:stun.voipbuster.com'},
            {url:'stun:stun.voipstunt.com'},
            {url:'stun:stun.voxgratia.org'},
            {url:'stun:stun.xten.com'},
            {
                url: 'turn:numb.viagenie.ca',
                credential: 'muazkh',
                username: 'webrtc@live.com'
            },
            {
                url: 'turn:192.158.29.39:3478?transport=udp',
                credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
                username: '28224511:1379330808'
            },
            {
                url: 'turn:192.158.29.39:3478?transport=tcp',
                credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
                username: '28224511:1379330808'
            }
            ]
    }
});
        
var peerList=[];

peer.on('open', function(){
    document.getElementById("my-id").innerHTML=peer.id;
    updatePeerInfo();
});
document.getElementById("update-peerinfo").addEventListener("click", function(){
    updatePeerInfo();
});
function updatePeerInfo() {
    peer.listAllPeers(function(list){
        peerList=[];
        for(var cnt = 0;cnt < list.length;cnt++){
            if(list[cnt]!=peer.id) peerList.push(list[cnt]);
        }
        dispPeers(peerList);
    });
    function dispPeers(list) {
        var op=document.getElementById("theirid-sel").options;
        for(var cnt = 0;cnt < list.length;cnt++){
            op[cnt]=new Option(list[cnt], list[cnt]);
        }
    }
}


// Receiving a call
peer.on('call', function(call){
    // Answer the call automatically (instead of prompting user) for demo purposes
    call.answer(window.localStream);
    step3(call);
});

// Receiving a data connection
peer.on('connection', function(conn){
    // Answer the dataconnection automatically (instead of prompting user) for demo purposes
    console.log("[Data Channel:connected]");
    step4(conn);
});

peer.on('error', function(err){
    alert(err.message);
    // Return to step 2 if error occurs
    step2();
});

document.getElementById("step2").style.setProperty("display", "none");
document.getElementById("step3").style.setProperty("display", "none");

// Click handlers setup
var calltoId;
window.onload=function() {
    document.getElementById("make-call").addEventListener("click", function(event){
        // Initiate a call
        calltoId=peerList[document.getElementById("theirid-sel").selectedIndex];
        var call = peer.call(calltoId, window.localStream);
        step3(call);

        // Initiate a data connection
        var conn = peer.connect(calltoId);
        step4(conn);
    });
    
    document.getElementById("end-call").addEventListener("click", function(){
        window.existingCall.close();
        step2();
    });
    
    // Retry if getUserMedia fails
    document.getElementById("step1-retry").addEventListener("click", function(){
        document.getElementById("error").style.setProperty("display", "none");
        step1();
    });
    
    // Get things started
    step1();
};
var videoSelect=document.querySelector("select#videoInput");
var videoSource=0, localStream;
function step1 () {
    if (typeof MediaStreamTrack === 'undefined'){
	      alert('This browser does not support MediaStreamTrack.\n\nTry Chrome Canary.');
    } else {
        while (videoSelect.firstChild) {
            videoSelect.removeChild(videoSelect.firstChild);
        }
        MediaStreamTrack.getSources(gotSources);
    }
    
    function gotSources(sourceInfos) {
        for(var i=0; i<sourceInfos.length; i++) {
            if(sourceInfos[i].kind=="video") {
                if(this.videoSource==0) {
                    // set Default videoSource
                    this.videoSource=sourceInfos[i].id;
                }
                var option = document.createElement("option");
                option.value = sourceInfos[i].id;
                option.text = sourceInfos[i].label || 'camera ' + (videoSelect.length + 1);
                videoSelect.appendChild(option);
            }
        }
        console.log(sourceInfos);
    }
    // change video source
    videoSelect.addEventListener("change", function(event){
        videoSource=event.target.value;
        document.getElementById('my-video').removeAttribute("src");
        localStream.stop();
        streamOn("reconnect", "my");
        console.log("[Change] ", event.target.value);
    });

    streamOn(null, "my");
    // Get audio/video stream
    function streamOn(type, who) {
        var constraints={
            video: {optional: [{sourceId: videoSource}]},
            audio: true
        };
        navigator.getUserMedia(constraints, function(stream){
            // Set your video displays
            document.getElementById('my-video').setAttribute("src", URL.createObjectURL(stream));
            
            localStream = stream;
            document.getElementById("step1-retry").style.setProperty("display", "none");
            step2();

            setAudio(stream, who);
            if(type=="reconnect") {
                if(typeof window.existingCall!="undefined") {
                    window.existingCall.close();
                    var call = peer.call(calltoId, window.localStream);
                    step3(call);
                }
            }


        }, function(){ document.getElementById("error").style.setProperty("display", "block"); });
    }
}
var timerId=false;
var audioContext=new webkitAudioContext();
function setAudio(stream, who) {
    if(timerId!=false) clearInterval(timerId);
    var source = audioContext.createMediaStreamSource(stream);
    var gain= audioContext.createGain();
    gain.gain.value=0.1;
    source.connect(gain);
    gain.connect(audioContext.destination);
    
    document.getElementById(who+"-volume").addEventListener("change", function(event){
        gain.gain.value=event.target.value;
    });
    
    var analyser= audioContext.createAnalyser();
    analyser.smoothingTimeConstant = 0.3;
    analyser.fftSize=1024;
    source.connect(analyser);
    timerId=setInterval(spectrumAnalyse, 100);
    
    function spectrumAnalyse() {
        var max=0;
        var timeDomainData = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteTimeDomainData(timeDomainData);
        max=Math.max.apply({}, timeDomainData);
        var value=Math.round(100*(max-128)/127);
        document.getElementById(who+"-analyser").style.setProperty("opacity", value/100);
    }
}


function step2 () {
    //document.getElementById("step1").style.setProperty("display", "none");
    document.getElementById("step3").style.setProperty("display", "none");
    document.getElementById("step2").style.setProperty("display", "block");
}

function step3 (call) {
    // Hang up on an existing call if present
    if (window.existingCall) {
        window.existingCall.close();
    }
    
    // Wait for stream on the call, then set peer video display
    call.on('stream', function(stream){
        document.getElementById('their-video').setAttribute("src", URL.createObjectURL(stream));
        //setAudio(stream, "their");
        document.getElementById('p-my-video').style.setProperty("opacity", "0.6");
        document.getElementById('my-video').style.setProperty("opacity", "0.6");
    });
        
    // UI stuff
    window.existingCall = call;
    document.getElementById("their-id").innerHTML=call.peer;
    calltoId=call.peer;
    
    call.on('close', step2);
    document.getElementById("step3").style.setProperty("display", "block");
    document.getElementById("step2").style.setProperty("display", "none");
    console.log(document.getElementById('their-video').height);

}

var connSend=function(data){
    console.log("[connSend is NOT set] "+ data);
};
var connRecieve=function(data){
    console.log("[connRecieve is NOT set] "+ data);
    if(recieve.length>20) recieve.shift();
    recieve.push(data);
    document.getElementById("recievedMidi").innerHTML=recieve.reverse().join("<br>");
    recieve.reverse();
};
function step4 (conn) {
    conn.on('open', function() {
        connSend=function(data){
            conn.send(data); // w/o MIDI connection
        };
        conn.on('data', function(data) {
            connRecieve(data);
        });

    });
}

// MIDI
requestMIDI();
var midi, inputs, outputs, midiInIdx, midiOutIdx;
var chshim=1, pgchange=1;
var recieve=[];
var sendMidiMessage=function(){};
var recieveMidiMessage=function(){};
document.getElementById("chshim").addEventListener("change", function(event){
    chshim=event.target.value;
    var elm = document.getElementById("pgchange");
    var evt = document.createEvent("MouseEvents");
    evt.initEvent("change", true, true, window, 1, 0, 0, 0, 0, false, false, false, false, 0, null);
    elm.dispatchEvent(evt);
});
document.getElementById("pgchange").addEventListener("change", function(event){
    pgchange=event.target.value;
    var msg=JSON.stringify({"midi": "0xC"+(document.getElementById("chshim").value-1).toString(16)+","+ "0x"+(parseInt(pgchange)-1).toString(16) });
    console.log(msg);
    connSend(msg);
});

function requestMIDI() {
    navigator.requestMIDIAccess( { sysex: true } ).then( scb, ecb );
    function scb(access) {
        var midi=access;
        if (typeof midi.inputs === "function") {
            inputs=midi.inputs();
            outputs=midi.outputs();
        } else {
            var inputIterator = midi.inputs.values();
            inputs = [];
            for (var o = inputIterator.next(); !o.done; o = inputIterator.next()) {
                inputs.push(o.value);
            }
            var outputIterator = midi.outputs.values();
            outputs = [];
            for (var o = outputIterator.next(); !o.done; o = outputIterator.next()) {
                outputs.push(o.value);
            }
        }
        
        // MIDI IN
        var mi=document.getElementById("midiinputs-list");
        for(var i=0; i<outputs.length; i++) {
            mi.options[i]=new Option(inputs[i]["name"], i);
        }
        document.getElementById("midiin-con").addEventListener("click", function(event){
            if(typeof midiInIdx=="number") inputs[midiInIdx].onmidimessage=function(){};
            midiInIdx=document.getElementById("midiinputs-list").selectedIndex;
            sendMIDIMessage=function(event){
                var out=[];
                for(var i=0; i<event.data.length; i++) {
                    out[i]=("0x"+event.data[i].toString(16));
                    if(i==0) {
                        var chshim=(document.getElementById("chshim").value-1).toString(16);
                        out[i]="0x"+event.data[i].toString(16).substr(0,1)+chshim;
                    }
                }
                connSend(JSON.stringify({"midi":out.join(",")}));
                document.getElementById("light-midiin").style.setProperty("opacity", "1");
                setTimeout(function(){
                    document.getElementById("light-midiin").style.setProperty("opacity", "0.1");
                }, 300);
            };
            inputs[midiInIdx].onmidimessage=sendMIDIMessage;
            document.getElementById("light-midiin").className+=" device-connected";
        });

        // MIDI OUT
        var mo=document.getElementById("midioutputs-list");
        for(var i=0; i<outputs.length; i++) {
            mo.options[i]=new Option(outputs[i]["name"], i);
        }
        document.getElementById("midiout-con").addEventListener("click", function(event){
            midiOutIdx=document.getElementById("midioutputs-list").selectedIndex;
            connRecieve=function(data){
                var recievedObj=JSON.parse(data);
                if(typeof recievedObj.midi!="undefined") {
                    outputs[midiOutIdx].send(recievedObj.midi.split(","));
                    if(recieve.length>20) {
                        recieve.shift();
                    }
                    recieve.push(recievedObj.midi);
                    document.getElementById("recievedMidi").innerHTML=recieve.reverse().join("<BR>").replace(/,/g, " ");
                    recieve.reverse();
                    document.getElementById("light-midiout").style.setProperty("opacity", "1");
                    setTimeout(function(){
                        document.getElementById("light-midiout").style.setProperty("opacity", "0.1");
                    }, 300);
                }
            };
            document.getElementById("light-midiout").className+=" device-connected";
        });
        

    }
    function ecb(msg) {
        console.log("[ERROR] requestMIDIAccess");
    }
}
