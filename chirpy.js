var Chirpy = (function(options){
  var audioStream, audioContext, gainNode, analyser, frequencies, lastClockBit = 0;
  var freqs = [], oscillators = [];
  var minFreq = 4000, maxFreq = 8000, freqChannels = 18;
  for(var i=4000; i<=8000; i+=((maxFreq-minFreq)/freqChannels)){ freqs.push(i); }

  var _init = function(stream){
    audioContext = new AudioContext() || new webkitAudioContext() || new mozAudioContext();
    audioStream = audioContext.createMediaStreamSource(stream);
    analyser = audioContext.createAnalyser();
    audioStream.connect(analyser);
    gainNode = audioContext.createGain ? audioContext.createGain() : audioContext.createGainNode();
    gainNode.gain.value = 0.5; //volume
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

  var setState = function(bits){
    for(var i=0; i<bits.length; i++){
      bits[i] == 0 ? oscillators[i].disconnect() : oscillators[i].connect(gainNode);
    }
  };

  var setByte = function(b){
    for(var i=0; i<oscillators.length; i++) oscillators[i].disconnect();
    oscillators[b].connect(gainNode);
  };

  var listen = function(cb){
    window.requestAnimationFrame(function(){listen(cb);});
    frequencies = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(frequencies);
    var f = frequencies.length / 22000;
    var chanBandwidth = ((Math.floor(maxFreq*f) - Math.floor(minFreq*f)) / freqChannels);
    //minFreq = 4000, maxFreq = 8000, freqChannels = 17;
    var maxi1 = -100, max1 = 150; //threshold
    var maxi2 = -100, max2 = 150; //threshold
    for(var i=Math.floor(minFreq*f); i<Math.floor(maxFreq*f);i+=1){
      if(frequencies[i]>max1 && Math.abs(frequencies[i] - max2) > chanBandwidth){
        max1 = frequencies[i];
        maxi1 = i + chanBandwidth;
      }else if(frequencies[i]>max2 && Math.abs(frequencies[i] - max1) > chanBandwidth){
        max2 = frequencies[i];
        maxi2 = i + chanBandwidth;
      }
    }
    if(maxi1 > -1 && maxi2 > -1){
      var chan1 = Math.floor((maxi1 - Math.floor(minFreq*f)) / chanBandwidth),
          chan2 = Math.floor((maxi2 - Math.floor(minFreq*f)) / chanBandwidth),
          chan;
      chan = chan1==16 || chan1==17 ? chan2 : chan1;
      cb(chan);
    }
  };

  var convertData = function(str){
    var data = [], b, h1, h2, a, baseArray = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
    data.push(baseArray);
    for(var i=0; i<str.length; i++){
      b = str.charCodeAt(i);
      h1 = b >> 4 & 0x0f;
      h2 = b & 0x0f;
      a = baseArray.slice();
      a[h1] = 1; a[16] = 1;
      data.push(a);
      a = baseArray.slice();
      a[h2] = 1; a[17] = 1;
      data.push(a);
    }
    data.push(baseArray);
    return data;
  };

  var send = function(data){
    if(data.length==0) return;
    setState(data.shift());
    setTimeout(function(){send(data)}, 125);
  };

  var init = function(cb){
    navigator.getMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
    navigator.getMedia({audio: true}, function(stream){_init(stream); cb();}, function(error){
      console.log("error: " + err);
    });
  };

  return {
    init: init,
    setState: setState,
    setByte: setByte,
    listen: listen,
    convertData: convertData,
    send: send
  };

});

