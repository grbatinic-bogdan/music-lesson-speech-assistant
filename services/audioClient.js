const recorder = require("node-record-lpcm16");

const {
  eventEmitter,
  STOP_TALKING_EVENT,
  HAS_TEXT_EVENT,
  DIALOGFLOW_FINISHED_EVENT
} = require("./eventEmitter");

const sampleRateHertz = 16000;

function startAudioStream(stream) {
  const recording = recorder.record({
    sampleRateHertz: sampleRateHertz,
    threshold: 0,
    recordProgram: "rec",
    silence: "10.0"
  });

  recording
    .stream()
    .on("error", console.error)
    .pipe(stream);

  eventEmitter.on(STOP_TALKING_EVENT, () => {
    recording.stop();
  });

  eventEmitter.on(HAS_TEXT_EVENT, () => {
    recording.pause();
  });

  eventEmitter.on(DIALOGFLOW_FINISHED_EVENT, () => {
    recording.resume();
  });
}

module.exports = {
  startAudioStream
};
