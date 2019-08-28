const EventEmitter = require("events").EventEmitter;

const appEventEmitter = new EventEmitter();

const STOP_TALKING_EVENT = "STOP_TALKING_EVENT";
const HAS_TEXT_EVENT = "HAS_TEXT_EVENT";
const DIALOGFLOW_FINISHED_EVENT = "DIALOGFLOW_FINISHED";
const DIALOGFLOW_DATA_EVENT = "DIALOGFLOW_DATA_EVENT";

module.exports = {
  eventEmitter: appEventEmitter,
  STOP_TALKING_EVENT,
  HAS_TEXT_EVENT,
  DIALOGFLOW_FINISHED_EVENT,
  DIALOGFLOW_DATA_EVENT
};
