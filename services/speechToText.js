// Imports the Google Cloud client library
const speech = require("@google-cloud/speech");
const {
  eventEmitter,
  STOP_TALKING_EVENT,
  HAS_TEXT_EVENT,
  DIALOGFLOW_FINISHED_EVENT
} = require("./eventEmitter");

class SpeechToTextStream {
  constructor(recognizeStream, endSpeakingTimeout, pauseSpeakingTimeout) {
    this.recognizeStream = recognizeStream;
    this.endSpeakingTime = endSpeakingTimeout;
    this.pauseSpeakingTime = pauseSpeakingTimeout;
    this.transcript = "";

    this.endSpeakingTimer = null;
    this.pauseSpeakingTimer = null;
  }

  onData(data) {
    const text = `${this.transcript} ${data.results[0].alternatives[0].transcript}`;

    if (text.length > 0) {
      //console.log(`text: ${text}`);
      clearTimeout(this.endSpeakingTimer);
      clearTimeout(this.pauseSpeakingTimer);
      this.pauseSpeakingTimer = setTimeout(
        function() {
          eventEmitter.emit(HAS_TEXT_EVENT, text.trim());
          this.transcript = "";
          this.endSpeakingTimer = setTimeout(() => {
            eventEmitter.emit(STOP_TALKING_EVENT);
          }, this.endSpeakingTime);
        }.bind(this),
        this.pauseSpeakingTime
      );
    }

    if (data.results[0].isFinal) {
      this.transcript += `${data.results[0].alternatives[0].transcript} `;
    }
  }

  start() {
    this.endSpeakingTimer = setTimeout(() => {
      eventEmitter.emit(STOP_TALKING_EVENT);
    }, this.endSpeakingTime);
    this.pauseSpeakingTimer = setTimeout(() => {
      eventEmitter.emit(HAS_TEXT_EVENT, "");
    }, this.pauseSpeakingTime);
  }

  pause() {
    //console.log("pausing stt stream");
    this.recognizeStream.pause();
  }

  resume() {
    //console.log("resuming stt stream");
    this.recognizeStream.resume();
  }

  stop() {
    //console.log("stopping stt stream");
    this.recognizeStream.removeListener("data", this.onData);
  }
}

function startSpeachToTextStream() {
  const encoding = "LINEAR16";
  const sampleRateHertz = 16000;
  const languageCode = "en-US";

  const request = {
    config: {
      encoding: encoding,
      sampleRateHertz: sampleRateHertz,
      languageCode: languageCode,
      metadata: {
        interactionType: "DICTATION",
        microphoneDistance: "MIDFIELD",
        recordingDeviceType: "SMARTPHONE",
        originalMediaType: "AUDIO"
      },
      enableAutomaticPunctuation: true
    },
    interimResults: true
  };

  const client = new speech.SpeechClient();
  const recognizeStream = client
    .streamingRecognize(request)
    .on("error", console.error);

  const endSpeakingTimeout = parseInt(process.env["END_SPEAKING_TIMEOUT"], 10);
  const pauseSpeakingTimeout = parseInt(
    process.env["PAUSE_SPEAKING_TIMEOUT"],
    10
  );

  if (isNaN(endSpeakingTimeout) || isNaN(pauseSpeakingTimeout)) {
    throw new Error("Missing timeout environment variables");
  }

  const sttStream = new SpeechToTextStream(
    recognizeStream,
    endSpeakingTimeout,
    pauseSpeakingTimeout
  );
  sttStream.start();
  recognizeStream.on("data", sttStream.onData.bind(sttStream));

  eventEmitter.on(HAS_TEXT_EVENT, () => {
    sttStream.pause();
  });

  eventEmitter.on(STOP_TALKING_EVENT, () => {
    sttStream.stop.call(sttStream);
  });

  eventEmitter.on(DIALOGFLOW_FINISHED_EVENT, () => {
    sttStream.resume();
  });

  return recognizeStream;
}

module.exports = {
  startSpeachToTextStream
};
