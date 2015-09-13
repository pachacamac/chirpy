var Chirpy = (function(options){
  var audioStream, audioContext, gainNode, analyser, fft, lastSignal;
  var F=3.5;
  var freqs = [697*F,770*F,852*F,941*F, 1209*F,1336*F,1477*F,1633*F];

  var _init = function(stream){
    audioContext = new AudioContext() || new webkitAudioContext() || new mozAudioContext();
    audioStream = audioContext.createMediaStreamSource(stream);
    analyser = audioContext.createAnalyser();
    audioStream.connect(analyser);
    gainNode = audioContext.createGain ? audioContext.createGain() : audioContext.createGainNode();
    gainNode.gain.value = 0.25; //volume
    gainNode.connect(audioContext.destination);
    console.log("init done");
  };

  var tone = function(freq, duration){
    var osci = audioContext.createOscillator();
    osci.type = "sine";
    osci.frequency.value = freq;
    osci.connect(gainNode);
    var t = audioContext.currentTime;
    osci.start(t);
    osci.stop(t+duration/1000);
  };

  var setHalfByte = function(hb, duration){
    if(hb<0||hb>15)return;
    var fxi = hb%4, fyi = Math.floor(hb/4)+4;
    tone(freqs[fxi], duration);
    tone(freqs[fyi], duration);
  };

  var setByte = function(b){
    //TODO
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

    var delta = 60;
    //    0    1    2    3   freqs[0]
    //    4    5    6    7   freqs[1]
    //    8    9   10   11   freqs[2]
    //   12   13   14   15   freqs[3]
    // f[4] f[5] f[6] f[7]
    // (col%4)+(row*4)

    if((max_row_power - s_max_row_power) > delta && (max_col_power - s_max_col_power) > delta){
      lastSignal = (max_col_index % 4) + (max_row_index * 4)-16;
    } else {
      if(lastSignal !== null){
        cb(lastSignal);
        lastSignal = null;
      }
    }
    setTimeout(function(){listen(cb);}, 1);
  };

  var send = function(data){
    if(data.length==0) return;
    setHalfByte(data.shift(), 50);
    setTimeout(function(){send(data)}, 150);
  };

  var init = function(cb){
    navigator.getMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
    var opts = {
                "mandatory": {
                    "googEchoCancellation": "true",
                    "googAutoGainControl": "false",
                    "googNoiseSuppression": "false",
                    "googHighpassFilter": "false"
                },
                "optional": []
            };
    navigator.getMedia({"audio": opts}, function(stream){_init(stream); cb();}, function(error){
      console.log("error: " + error);
    });
  };


  return {
    init: init,
    listen: listen,
    send: send,
    tone: tone
  };

});

