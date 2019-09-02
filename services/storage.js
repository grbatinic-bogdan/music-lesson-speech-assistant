const { eventEmitter, DIALOGFLOW_DATA_EVENT } = require("./eventEmitter");

class ConversationStorage {
  constructor() {
    this.data = [];
  }

  add(value) {
    this.data.push(value);
  }

  getData() {
    return this.data;
  }

  print() {
    console.log("Conversation transcript");
    this.data.forEach(value => {
      console.log(`Question: ${value.question}`);
      const isAmountValue =
        value.answer.amount !== undefined && value.answer.unit !== undefined;
      const isStringValue = value.answer.stringValue !== undefined;
      const isDateTime = value.answer.date_time !== undefined;
      if (isAmountValue) {
        console.log(
          `Answer: ${value.answer.amount[value.answer.amount.kind]} ${
            value.answer.unit[value.answer.unit.kind]
          }`
        );
      } else if (isStringValue) {
        console.log(`Answer: ${value.answer[value.answer.kind]}`);
      } else if (isDateTime) {
        console.log(
          `Answer: ${value.answer.date_time[value.answer.date_time.kind]}`
        );
      } else {
        console.log(value.answer);
      }
    });
  }
}
const conversationStorage = new ConversationStorage();
function storeConversation() {
  eventEmitter.on(DIALOGFLOW_DATA_EVENT, response => {
    const hasResult = response.intent && response.intent.displayName;
    if (!hasResult) {
      return;
    }
    const question = response.intent.displayName;
    let answer;

    switch (response.intent.displayName) {
      case "StudentAge":
        answer = response.parameters.fields.age.structValue.fields;
        break;
      case "Instrument":
        answer = response.parameters.fields.instrument;
        break;
      case "LessonLength":
        answer = response.parameters.fields["lesson-length"].structValue.fields;
        break;
      case "LessonTime":
        answer = response.parameters.fields["lesson-time"].structValue.fields;
        break;
    }
    if (question && answer) {
      conversationStorage.add({
        question,
        answer
      });
    }
  });
}

module.exports = {
  storeConversation,
  conversationStorage
};
