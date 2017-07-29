
var request = require("request")


var cryptocurrencies = {
    "bitcoin": {
        "price": "1234"
    }, 
    "ether": {
        "price": "456"
    }
}


// Route the incoming request based on type (LaunchRequest, IntentRequest,
// etc.) The JSON body of the request is provided in the event parameter.
exports.handler = function (event, context) {
    try {
        console.log("event.session.application.applicationId=" + event.session.application.applicationId);

        /**
         * Uncomment this if statement and populate with your skill's application ID to
         * prevent someone else from configuring a skill that sends requests to this function.
         */

    if (event.session.application.applicationId !== "amzn1.ask.skill.f2a7b7a9-8de3-4164-a396-0b5f0b4c7b1e") {
        context.fail("Invalid Application ID");
     }

        if (event.session.new) {
            onSessionStarted({requestId: event.request.requestId}, event.session);
        }

        if (event.request.type === "LaunchRequest") {
            onLaunch(event.request,
                event.session,
                function callback(sessionAttributes, speechletResponse) {
                    context.succeed(buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === "IntentRequest") {
            onIntent(event.request,
                event.session,
                function callback(sessionAttributes, speechletResponse) {
                    context.succeed(buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === "SessionEndedRequest") {
            onSessionEnded(event.request, event.session);
            context.succeed();
        }
    } catch (e) {
        context.fail("Exception: " + e);
    }
};

/**
 * Called when the session starts.
 */
function onSessionStarted(sessionStartedRequest, session) {
    // add any session init logic here
}

/**
 * Called when the user invokes the skill without specifying what they want.
 */
function onLaunch(launchRequest, session, callback) {
    getWelcomeResponse(callback)
}

/**
 * Called when the user specifies an intent for this skill.
 */
function onIntent(intentRequest, session, callback) {

    var intent = intentRequest.intent
    var intentName = intentRequest.intent.name;

    // dispatch custom intents to handlers here
    if (intentName == "CryptoIntent") {
        handleCryptoResponse(intent, session, callback)
    } else if (intentName == "AMAZON.YesIntent") {
        handleYesResponse(intent,  session, callback)
    } else if (intentName = "AMAZON.NoIntent") {
        handleNoResponse(intent, session, callback)
    } else if (intentName = "AMAZON.HelpIntent") {
        handleGetHelpRequest(intent, session, callback)
    } else if (intentName = "AMAZON.StopIntent") {
        handleFinishSessionRequest(intent, session, callback)
    } else if (intentName = "AMAZON.CancelIntent") {
        handleFinishSessionRequest(intent, session, callback)
    } else {
        throw "Invalid intent"
    }
}

/**
 * Called when the user ends the session.
 * Is not called when the skill returns shouldEndSession=true.
 */
function onSessionEnded(sessionEndedRequest, session) {

}

// ------- Skill specific logic -------

function getWelcomeResponse(callback) {
    var speechOutput = "Welcome to Crypto Price! I can tell you the price of Bitcoin and Ether"

    var reprompt = "Which currency are you interested in? I can tell you the price of Bitcoin and Ether"

    var header = "Crypto Price"

    var shouldEndSession = false

    var sessionAttributes = {
        "speechOutput" : speechOutput,
        "repromptText" : reprompt
    }

    callback(sessionAttributes, buildSpeechletResponse(header, speechOutput, reprompt, shouldEndSession))
}


function handleCryptoResponse(intent, session, callback) {
    var crypto = intent.slots.Crypto.value.toLowerCase()


    getJSON(function(data) {
        if (data != "ERROR") {
            var price = 0
            if (crypto == "bitcoin") {
                price = Number(data.USDT_BTC.last)
            } else if (crypto = "ether") {
                price = Number(data.USDT_ETH.last)
            } 
        } 
        // callback(session.attributes, buildSpeechletResponseWithoutCard(speechOutput, "", true))
        if (!cryptocurrencies[crypto]) {
        var speechOutput = "I don't know the price of that crypto. Ask about Bitcoin or Ether"
        var repromptText = "Try asking about Bitcoin or Ether"
        var header = "Unknown crypto"
    } else {
        var speechOutput = "The price of " + capitalizeFirst(crypto) + " is " + Math.round(price) + " USD. Do you need the price of another crypto?"
        var repromptText = "Do you need the price of another crypto?"
        var header = capitalizeFirst(crypto)
    }

    var shouldEndSession = false

    callback(session.attributes, buildSpeechletResponse(header, speechOutput, repromptText, shouldEndSession))
    })

    


}

function url() {
    return "https://poloniex.com/public?command=returnTicker"
}

function getJSON(callback) {
    request.get(url(), function(error, response, body) {
        var d = JSON.parse(body)
        callback(d)
    })
}

function handleYesResponse(intent,  session, callback) {
    var speechOutput = "Great! Which crypto do you need the price of? Bitcoin or Ether?"
    var repromptText = speechOutput
    var shouldEndSession = false

    callback(session.attributes, buildSpeechletResponseWithoutCard(speechOutput, repromptText, shouldEndSession))
}

function handleNoResponse(intent, session, callback) {
    handleFinishSessionRequest(intent, session, callback)
}

function handleGetHelpRequest(intent, session, callback) {
    // Ensure that session.attributes has been initialized
    if (!session.attributes) {
        session.attributes = {};

    }

    var speechOutput = "I can tell you the price of Bitcoin and Ether. Which one you want to know the price of?"

    var repromptText = speechOutput

    var shouldEndSession = false

    callback(session.attributes, buildSpeechletResponseWithoutCard(speechOutput, repromptText, shouldEndSession))

}

function handleFinishSessionRequest(intent, session, callback) {
    // End the session with a "Good bye!" if the user wants to quit the game
    callback(session.attributes,
        buildSpeechletResponseWithoutCard("Good bye!", "", true));
}


// ------- Helper functions to build responses for Alexa -------


function buildSpeechletResponse(title, output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: "PlainText",
            text: output
        },
        card: {
            type: "Simple",
            title: title,
            content: output
        },
        reprompt: {
            outputSpeech: {
                type: "PlainText",
                text: repromptText
            }
        },
        shouldEndSession: shouldEndSession
    };
}

function buildSpeechletResponseWithoutCard(output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: "PlainText",
            text: output
        },
        reprompt: {
            outputSpeech: {
                type: "PlainText",
                text: repromptText
            }
        },
        shouldEndSession: shouldEndSession
    };
}

function buildResponse(sessionAttributes, speechletResponse) {
    return {
        version: "1.0",
        sessionAttributes: sessionAttributes,
        response: speechletResponse
    };
}

function capitalizeFirst(s) {
    return s.charAt(0).toUpperCase() + s.slice(1)
}