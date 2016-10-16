var express = require('express');
var request = require('request');
var bodyParser = require('body-parser');
var watson = require( 'watson-developer-cloud' );
var jsonfile = require('jsonfile');
var ObjectStorage = require('bluemix-objectstorage').ObjectStorage;
var app = express();
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

const PLATFORM = 'messenger';

//set up context storage
var credentials = {
    projectId: process.env.CONTEXT_STORAGE_PROJECT_ID,
    userId: process.env.CONTEXT_STORAGE_USER_ID,
    password: process.env.CONTEXT_STORAGE_PASSWORD,
    region: ObjectStorage.Region.DALLAS
};
var objStorage = new ObjectStorage(credentials);

var platformContainer;
objStorage.getContainer(PLATFORM)
  .then(function(container) {
    platformContainer = container;
  })
  .catch(function(err) {
    objStorage.createContainer(PLATFORM)
      .then(function(container) {
          platformContainer = container;
      })
      .catch(function(err) {
        console.error("Error creating conatiner: " + err);
      });
  });

require( 'dotenv' ).config( {silent: true} );

// Create the service wrapper
var conversation = watson.conversation( {
  url: 'https://gateway.watsonplatform.net/conversation/api',
  username: process.env.CONVERSATION_USERNAME || '<username>',
  password: process.env.CONVERSATION_PASSWORD || '<password>',
  version_date: '2016-07-11',
  version: 'v1'
} );

// This code is called only when subscribing the webhook //
app.get('/webhook/', function (req, res) {
    if (req.query['hub.verify_token'] === process.env.WEBHOOK_TOKEN) {
        res.send(req.query['hub.challenge']);
    }
    res.send('Error, wrong validation token');
})


// Incoming messages reach this end point //
app.post('/webhook/', function (req, res) {
    messaging_events = req.body.entry[0].messaging;
    for (i = 0; i < messaging_events.length; i++) {
        event = req.body.entry[0].messaging[i];
        sender = event.sender.id;

        if (event.message && event.message.text) {
            text = event.message.text;
            readContext(sender, text);
        }
    }
    res.sendStatus(200);
});

function messageConversation(context) {
  console.log("Context: " + context);
  //Watson conversation
  var payload = {
    workspace_id: workspace,
    input: {"text": text},
    context: context
  };

  // Send the input to the conversation service
  conversation.message(payload, function(err, data) {
    if ( err ) {
      console.error(err);
    }
    sendMessage(sender, data);
  });
}

// This function receives the response text and sends it back to the user //
function sendMessage(sender, data) {
  var messageData = {};
  if (data.context.text) {
    messageData.text = data.context.text;
  }
  if (data.context.quick_replies) {
    messageData.quick_replies = data.context.quick_replies;
  }
  console.log("Recieved from Watson: " + messageData.text + " " + messageData.quick_replies);
  if (messageData) {
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token: token},
        method: 'POST',
        json: {
            recipient: {id: sender},
            message: messageData,
        }
    }, function (error, response, body) {
        if (error) {
            console.log('Error sending message: ', error);
        } else if (response.body.error) {
            console.log('Error: ', response.body.error);
        }
        writeContext(sender, data.context);
    });
  }
};

function writeContext(sender, context) {
  platformContainer.createObject(sender, JSON.stringify(context))
    .then(function(object) {})
    .catch(function(err) {
      console.error(err);
    });
}

function readContext(sender, text) {
  platformContainer.getObject(sender)
    .then(function(object) {
      object.load(false)
        .then(function(context) {
          messageConversation(JSON.parse(context), text);
        })
        .catch(function(err) {
          console.log("Error loading context object: " + err);
        });
    })
    .catch(function(err) {
      messageConversation({}, text);
    });
}

var workspace = process.env.WORKSPACE_ID || '<workspace-id>';
if ( !workspace || workspace === '<workspace-id>' ) {
  console.log("Error finding workspace");
  return;
}
var token = process.env.FACEBOOK_TOKEN;
var host = (process.env.VCAP_APP_HOST || 'localhost');
var port = (process.env.VCAP_APP_PORT || 3000);
app.listen(port, host);
