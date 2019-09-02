const { startAudioStream } = require("./services/audioClient");
const { startSpeachToTextStream } = require("./services/speechToText");
const { startDialogFlow } = require("./services/dialogflowClient");
const {
  eventEmitter,
  STOP_TALKING_EVENT,
  DIALOGFLOW_DATA_EVENT
} = require("./services/eventEmitter");
const {
  storeConversation,
  conversationStorage
} = require("./services/storage");

function start() {
  const stream = startSpeachToTextStream();
  startAudioStream(stream);
  startDialogFlow();
  storeConversation();
  console.log("Listening, press Ctrl+C to stop.");
  console.log("Start by saying 'Book a music lesson'");

  eventEmitter.on(STOP_TALKING_EVENT, () => {
    conversationStorage.print();
    process.exit();
  });

  eventEmitter.on(DIALOGFLOW_DATA_EVENT, response => {
    console.log(response.fulfillmentText);
    //console.log(conversationStorage.getData());
  });
}

start();
