const dialogflow = require("dialogflow");
const { struct } = require("pb-util");

const sessionContext = new dialogflow.ContextsClient();
const projectId = "watadoo-13c84";

// Using pb-util because of this thread: https://github.com/googleapis/nodejs-dialogflow/issues/97.
exports.createContext = async (id, name, lifespan = 2, parameters = {}) => {
  await sessionContext.createContext({
    parent: sessionContext.sessionPath(projectId, id),
    context: {
      name: sessionContext.contextPath(projectId, id, name),
      lifespanCount: lifespan,
      parameters: struct.encode(parameters)
    }
  });
};

exports.updateContext = async (id, name, lifespan = 2, parameters = {}) => {
  const ctx = {
    name: sessionContext.contextPath(projectId, id, name),
    lifespanCount: lifespan,
    parameters: struct.encode(parameters)
  };
  await sessionContext.updateContext({
    context: ctx
  });
};

exports.deleteContext = async (id, name) => {
  await sessionContext.deleteContext({
    name: sessionContext.contextPath(projectId, id, name)
  });
};

exports.deleteAllContexts = async (id) => {
  await sessionContext.deleteAllContexts({
    parent: sessionContext.sessionPath(projectId, id)
  });
};