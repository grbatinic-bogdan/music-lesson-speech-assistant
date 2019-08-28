const recorder = require("node-record-lpcm16");

// Imports the Google Cloud client library
const speech = require("@google-cloud/speech");

// Creates a client
const client = new speech.SpeechClient();

const { getDialogFlowResponse } = require("./services/dialogflowClient");

/**
 * TODO(developer): Uncomment the following lines before running the sample.
 */
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

let transcript = "";
let queryParams;
const STOP_SPEAKING_TIMEOUT = 10000;
const ENDED_SPEAKING_TIMEOUT = 4000;
// Create a recognize stream
function dataHandler(data) {
  const text = `${transcript} ${data.results[0].alternatives[0].transcript}`;
  if (text.length > 0) {
    clearTimeout(stopTimer);
    clearTimeout(endSpeakingTimer);
    //endedSpeaking(text);
    //stopTimer = setTimeout(stop, STOP_SPEAKING_TIMEOUT);
    endSpeakingTimer = setTimeout(async () => {
      await pauseRecording(text.trim());
      stopTimer = setTimeout(stop, STOP_SPEAKING_TIMEOUT);
    }, ENDED_SPEAKING_TIMEOUT);
  }
  if (data.results[0].isFinal) {
    transcript += `${data.results[0].alternatives[0].transcript} `;
  }
}

function endedSpeaking(text) {
  //console.log(`Text: ${text}`);
}

const recognizeStream = client
  .streamingRecognize(request)
  .on("error", console.error)
  .on("data", dataHandler);

// Start recording and send the microphone input to the Speech API

const recording = recorder.record({
  sampleRateHertz: sampleRateHertz,
  threshold: 0,
  // Other options, see https://www.npmjs.com/package/node-record-lpcm16#options
  verbose: false,
  recordProgram: "rec", // Try also "arecord" or "sox"
  silence: "10.0"
});

recording
  .stream()
  .on("error", console.error)
  .pipe(recognizeStream);

function stop() {
  recognizeStream.removeListener("data", dataHandler);
  recording.stop();
  console.log("No speech detected, closing the recording session");
  process.exit();
}

async function pauseRecording(text) {
  if (text.length > 0) {
    console.log(
      `pausing stt and audio stream and sending text '${text}' to df`
    );
    recording.pause();
    recognizeStream.pause();
    try {
      const dialogFlowResponse = await getDialogFlowResponse(
        process.env["PROJECT_ID"],
        text,
        queryParams
      );

      if (dialogFlowResponse.intent) {
        switch (dialogFlowResponse.intent.displayName) {
          case "BookLesson":
            queryParams = {
              contexts: dialogFlowResponse.outputContexts
            };
            break;
        }
      }
    } catch (error) {
      console.log(`Unable to get df response, ${error}`);
    } finally {
      recording.resume();
      recognizeStream.resume();
      transcript = "";
    }
  }
}

let stopTimer = setTimeout(stop, STOP_SPEAKING_TIMEOUT);
let endSpeakingTimer = setTimeout(
  pauseRecording.bind(""),
  ENDED_SPEAKING_TIMEOUT
);

console.log("Listening, press Ctrl+C to stop.");
