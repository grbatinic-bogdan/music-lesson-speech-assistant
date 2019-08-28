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
}
const conversationStorage = new ConversationStorage();
function storeConversation() {
  eventEmitter.on(DIALOGFLOW_DATA_EVENT, (question, answer) => {
    const data = {
      question,
      answer
    };

    conversationStorage.add(data);
  });
}

module.exports = {
  storeConversation,
  conversationStorage
};
