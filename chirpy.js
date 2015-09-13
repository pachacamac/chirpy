var Chirpy = (function(options){
  var audioStream, audioContext, gainNode, analyser, fft;
  var f=1;
  var freqs = [697*f,770*f,852*f,941*f, 1209*f,1336*f,1477*f,1633*f], oscillators = [];

  var _init = function(stream){
    audioContext = new AudioContext() || new webkitAudioContext() || new mozAudioContext();
    audioStream = audioContext.createMediaStreamSource(stream);
    analyser = audioContext.createAnalyser();
    audioStream.connect(analyser);
    gainNode = audioContext.createGain ? audioContext.createGain() : audioContext.createGainNode();
    gainNode.gain.value = 0.15; //volume
    gainNode.connect(audioContext.destination);
    //create one oscillator per frequency that we're going to use
    for(var i=0; i<freqs.length; i++){
      var osci = audioContext.createOscillator();
      osci.type = "sine";
      osci.start ? osci.start(0) : osci.noteOn(0);
      osci.frequency.value = freqs[i];
      oscillators.push(osci);
    }
    console.log("init done");
  };

  var setHalfByte = function(hb){
    var fxi = Math.floor(hb/4)+4, fyi = hb%4;
    for(var i=0; i<oscillators.length; i++) oscillators[i].disconnect();
    if(hb<0||hb>15)return;
    oscillators[fxi].connect(gainNode);
    oscillators[fyi].connect(gainNode);
  };

  var setByte = function(b){
    // for(var i=0; i<oscillators.length; i++) oscillators[i].disconnect();
    // oscillators[b].connect(gainNode);
  };

  var listen = function(cb){
    // window.requestAnimationFrame(function(){listen(cb);});
    // fft = new Uint8Array(analyser.frequencyBinCount);
    // analyser.getByteFrequencyData(fft);
    // var f = fft.length / 22000;
    // var chanBandwidth = ((Math.floor(maxFreq*f) - Math.floor(minFreq*f)) / freqChannels);
    // //minFreq = 4000, maxFreq = 8000, freqChannels = 17;
    // var maxi1 = -100, max1 = 150; //threshold
    // var maxi2 = -100, max2 = 150; //threshold
    // for(var i=Math.floor(minFreq*f); i<Math.floor(maxFreq*f);i+=1){
    //   if(fft[i]>max1 && Math.abs(fft[i] - max2) > chanBandwidth){
    //     max1 = fft[i];
    //     maxi1 = i + chanBandwidth;
    //   }else if(fft[i]>max2 && Math.abs(fft[i] - max1) > chanBandwidth){
    //     max2 = fft[i];
    //     maxi2 = i + chanBandwidth;
    //   }
    // }
    // if(maxi1 > -1 && maxi2 > -1){
    //   var chan1 = Math.floor((maxi1 - Math.floor(minFreq*f)) / chanBandwidth),
    //       chan2 = Math.floor((maxi2 - Math.floor(minFreq*f)) / chanBandwidth),
    //       chan;
    //   chan = chan1==16 || chan1==17 ? chan2 : chan1;
    //   cb(chan);
    // }
  };

  var convertData = function(str){
    // var data = [], b, h1, h2, a, baseArray = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
    // data.push(baseArray);
    // for(var i=0; i<str.length; i++){
    //   b = str.charCodeAt(i);
    //   h1 = b >> 4 & 0x0f;
    //   h2 = b & 0x0f;
    //   a = baseArray.slice();
    //   a[h1] = 1; a[16] = 1;
    //   data.push(a);
    //   a = baseArray.slice();
    //   a[h2] = 1; a[17] = 1;
    //   data.push(a);
    // }
    // data.push(baseArray);
    // return data;
  };

  var send = function(data){
    if(data.length==0) return;
    setHalfByte(data.shift());
    setTimeout(function(){send(data)}, 40);
  };

  var init = function(cb){
    navigator.getMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
    navigator.getMedia({audio: true}, function(stream){_init(stream); cb();}, function(error){
      console.log("error: " + err);
    });
  };

  return {
    init: init,
    //setState: setState,
    //setByte: setByte,
    listen: listen,
    //convertData: convertData,
    send: send
  };

});

