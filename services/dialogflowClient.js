const dialogflow = require("dialogflow");
const uuid = require("uuid");

const {
  eventEmitter,
  HAS_TEXT_EVENT,
  DIALOGFLOW_FINISHED_EVENT,
  DIALOGFLOW_DATA_EVENT
} = require("./eventEmitter");

class DialogflowClient {
  constructor(sessionId, sessionClient) {
    this.sessionId = sessionId;
    this.sessionClient = sessionClient;
  }

  async getDialogFlowResponse(text, queryParams) {
    const projectId = process.env["PROJECT_ID"];
    const sessionPath = this.sessionClient.sessionPath(
      projectId,
      this.sessionId
    );

    // The text query request.
    const request = {
      session: sessionPath,
      queryInput: {
        text: {
          text,
          languageCode: "en-US"
        }
      }
    };

    if (queryParams) {
      request.queryParams = queryParams;
    }

    const responses = await this.sessionClient.detectIntent(request);
    // return the response
    return responses[0].queryResult;
  }
}

function startDialogFlow() {
  const sessionId = uuid.v4();
  const sessionClient = new dialogflow.SessionsClient();
  const dfClient = new DialogflowClient(sessionId, sessionClient);
  let queryParams;

  eventEmitter.on(HAS_TEXT_EVENT, text => {
    dfClient
      .getDialogFlowResponse(text, queryParams)
      .then(queryResult => {
        /*
        if (
          dialogFlowResponse.intent &&
          dialogFlowResponse.intent.displayName
        ) {
          queryParams = {
            contexts: dialogFlowResponse.outputContexts
          };
        }
        */

        eventEmitter.emit(DIALOGFLOW_DATA_EVENT, queryResult);
      })
      .catch(error => {
        console.log(`Could not get response from DF, ${error}`);
      })
      .finally(() => {
        eventEmitter.emit(DIALOGFLOW_FINISHED_EVENT);
      });
    /*
    try {
      const dialogFlowResponse = await dfClient.getDialogFlowResponse(
        text,
        queryParams
      );

      if (dialogFlowResponse.intent) {
        queryParams = {
          contexts: dialogFlowResponse.outputContexts
        };
      }
    } catch (error) {

    }
    */
  });
}

/**
 * Send a query to the dialogflow agent, and return the query result.
 * @param {string} projectId The project to be used
 */
const getDialogFlowResponse = async (projectId, text, queryParams) => {
  // A unique identifier for the given session
  const sessionId = uuid.v4();

  // Create a new session
  const sessionClient = new dialogflow.SessionsClient();
  const sessionPath = sessionClient.sessionPath(projectId, sessionId);

  // The text query request.
  const request = {
    session: sessionPath,
    queryInput: {
      text: {
        text,
        languageCode: "en-US"
      }
    }
  };

  if (queryParams) {
    request.queryParams = queryParams;
  }

  // Send request and log result
  const responses = await sessionClient.detectIntent(request);

  const result = responses[0].queryResult;

  console.log(`  Query: ${result.queryText}`);
  console.log(`  Response: ${result.fulfillmentText}`);
  if (result.intent) {
    console.log(`  Intent: ${result.intent.displayName}`);
  } else {
    console.log(`  No intent matched.`);
  }

  return result;
};

module.exports = {
  getDialogFlowResponse,
  startDialogFlow
};
