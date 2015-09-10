var Chirpy = (function(options){
  var audioStream, audioContext, gainNode;
  var freqs = [], oscillators = [];
  var minFreq = 4000, maxFreq = 8000, freqChannels = 256;
  for(var i=4000; i<=8000; i+=((maxFreq-minFreq)/freqChannels)){ freqs.push(i); }

  function init(stream){
    audioContext = new AudioContext() || new webkitAudioContext() || new mozAudioContext();
    audioStream  = audioContext.createMediaStreamSource(stream);
    gainNode     = audioContext.createGain ? audioContext.createGain() : audioContext.createGainNode();
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
  }

  navigator.getMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
  navigator.getMedia({audio: true}, init, function(error){
    console.log("error: " + err);
  });

  var setState = function(bits){
    for(var i=0; i<bits.length; i++){
      bits[i] == 0 ? oscillators[i].disconnect() : oscillators[i].connect(gains[i]);
    }
  };

  var setByte = function(b){
    for(var i=0; i<oscillators.length; i++) oscillators[i].disconnect();
    oscillators[b].connect(gainNode);
  };

  return {
    setState: setState,
    setByte: setByte
  };

});

