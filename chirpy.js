var Chirpy = (function(options){
  var audioStream, audioContext, gainNode, analyser, fft;
  var freqs = [697,770,852,941, 1209,1336,1477,1633], oscillators = [];

  var _init = function(stream){
    audioContext = new AudioContext() || new webkitAudioContext() || new mozAudioContext();
    audioStream = audioContext.createMediaStreamSource(stream);
    analyser = audioContext.createAnalyser();
    audioStream.connect(analyser);
    gainNode = audioContext.createGain ? audioContext.createGain() : audioContext.createGainNode();
    gainNode.gain.value = 0.25; //volume
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
    var fxi = hb%4, fyi = Math.floor(hb/4)+4;
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
    //window.requestAnimationFrame(function(){listen(cb);});
    fft = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(fft);
    var f = 22000/fft.length;
    //f = 22000/fft.length = 21.4
    // bin: 697/21.4 fft[bin] -> power bei 697 Hz
    var max_row_power = -1, max_col_power = -1, s_max_row_power = -1, s_max_col_power = -1;
    var max_row_index = -1, max_col_index = -1;

    for (var i = 0; i < freqs.length; i++) {
      var power = fft[Math.round(freqs[i]/f)];
      // rows
      if(i < 4){
        if(power >= max_col_power){
          max_col_power = power;
          max_col_index = i;
        }
        else if(power > s_max_col_power){ // power < max_row_power
          s_max_col_power = power;
        }
      }
      // cols
      else {
        if(power >= max_row_power){
          max_row_power = power;
          max_row_index = i;
        }
        else if(power > s_max_row_power){ // power < max_col_power
          s_max_row_power = power;
        }
      }
    };

    var delta = 50;
    //    0    1    2    3   freqs[0]
    //    4    5    6    7   freqs[1]
    //    8    9   10   11   freqs[2]
    //   12   13   14   15   freqs[3]
    // f[4] f[5] f[6] f[7]
    // (col%4)+(row*4)

    if(max_row_power - s_max_row_power > delta && max_col_power - s_max_col_power > delta){
      console.log(max_row_index, max_col_index);
      cb((max_col_index % 4) + (max_row_index * 4)-16);
    }
    setTimeout(function(){listen(cb);}, 1);
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

