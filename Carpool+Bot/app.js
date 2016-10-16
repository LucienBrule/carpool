//
// Requires
//
var express = require('express');
var request = require('request');
var bodyParser = require('body-parser');
var watson = require('watson-developer-cloud');
var ObjectStorage = require('bluemix-objectstorage').ObjectStorage;
var exec = require('exec');
var requestify = require('requestify');
var qs = require("querystring");
var http = require("http");

var dotenv = require('dotenv').config({
    silent: true
});

//
// Constants
//
const PLATFORM = 'messenger';
const token = process.env.FACEBOOK_TOKEN;
const host = (process.env.VCAP_APP_HOST || 'localhost');
const port = (process.env.VCAP_APP_PORT || 3000);
const workspace = process.env.WORKSPACE_ID || '<workspace-id>';

//
// Object setup
//

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

// Create the watson conversation service wrapper
var conversation = watson.conversation({
    url: 'https://gateway.watsonplatform.net/conversation/api',
    username: process.env.CONVERSATION_USERNAME || '<username>',
    password: process.env.CONVERSATION_PASSWORD || '<password>',
    version_date: '2016-07-11',
    version: 'v1'
});

// Create Google Maps Client
var googleMapsClient = require('@google/maps').createClient({
    key: process.env.GOOGLE_MAPS_API_KEY
});

// Set up web framework express
var app = express();
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(bodyParser.json());

app.get('/webhook/', function(req, res) {
    if (req.query['hub.verify_token'] === process.env.WEBHOOK_TOKEN) {
        res.send(req.query['hub.challenge']);
    }
    res.send('Error, wrong validation token');
});

// This code is called only when subscribing the webhook //
app.get('/webhook/', function(req, res) {
    if (req.query['hub.verify_token'] === process.env.WEBHOOK_TOKEN) {
        res.send(req.query['hub.challenge']);
    }
    res.send('Error, wrong validation token');
});

// Incoming messages reach this end point //
app.post('/webhook/', function(req, res) {
    messaging_events = req.body.entry[0].messaging;
    var i;
    for (i = 0; i < messaging_events.length; i++) {
        event = req.body.entry[0].messaging[i];
        sender = event.sender.id;
        if (event.message) {
            message = event.message;
            console.log(message);
            //Begin processing
            readContext(sender, message);
        }
    }
    res.sendStatus(200);
});

//
// Functions
//

function readContext(sender, message) {
    platformContainer.getObject(sender)
      .then(function(object) {
            object.load(false)
                .then(function(context) {
                    console.log("yo  " + JSON.stringify(message));
                    return processContextMessage(sender, JSON.parse(context), message);
                }).catch(function(err) {
                    console.log("Error loading context object: " + err);
                });
        }).catch(function(error) {
            //no context saved
            requestify.post('http://example.com', {
                hello: 'world'
            })
            .then(function(response) {
                // Get the response body
                response.getBody();
            });
            return processContextMessage(sender, {}, message);
        });
}

function processContextMessage(sender, context, message) {
    console.dir(JSON.stringify(context));
    console.dir(JSON.stringify(message));

    //pre process message, update context
    var messageAddOn = {};
    context.quick_replies = "";

    // Check if user given location
    var location = false;
    if (message.attachments) {
      if (message.attachments[0].type == "location") {
        location = true;
      }
    }
    if (context.response_type == "pick_up_location" || location) {
        context.response_type = "";
        if (location) {
          console.log("HERE1");
            // Reverse geocode an address
            var lat = message.attachments[0].payload.coordinates.lat;
            var lng = message.attachments[0].payload.coordinates.long;
            googleMapsClient.reverseGeocode({
                latlng: [lat, lng]
            }, function(errorRep, response) {
              handleGeocode(response, sender, context, message.text, messageAddOn);
            });
        } else {
            // Geocode an address
            var geocodeRequestData = {
                address: message.text,
                components: {
                    country: "US"
                }
            };
            if (process.env.GOOGLE_MAPS_LOCALITY) {
                geocodeRequestData.components.locality = process.env.GOOGLE_MAPS_LOCALITY;
            }
            googleMapsClient.geocode(geocodeRequestData, function(errorRep, response) {
              handleGeocode(response, sender, context, message.text, messageAddOn);
            });
        }

    } else {
      console.log("HEREEE" + message.text);
        messageWatson(sender, context, message.text, messageAddOn);
    }
}

function handleGeocode(response, sender, context, text, messageAddOn) {
      var geocodeResult = response.json.results[0];
      console.log(JSON.stringify(geocodeResult));

      messageAddOn.pick_up_location = {
          "formatted_address": geocodeResult.formatted_address,
          "lat": geocodeResult.geometry.location.lat,
          "lng": geocodeResult.geometry.location.lng,
          "place_id": geocodeResult.place_id
      };
    context.response_type = 'correct_pick_up_location';
    console.log("HERE");
    messageWatson(sender, context, text, messageAddOn);
}

function messageWatson(sender, context, text, messageAddOn) {
    //Watson conversation
    var payload = {
        workspace_id: workspace,
        input: {
            "text": text
        },
        context: context
    };

    // Send the input to the conversation service
    conversation.message(payload, function(err, data) {
        if (err) {
            var errorMessage = "Watson conversation error: " + err;
            console.error(errorMessage);
            data = {
                "context": {
                    "text": errorMessage
                }
            };
        }
        sendMessage(sender, data, messageAddOn);
    });
}

// This function receives the response text and sends it back to the user //
function sendMessage(sender, data, messageAddOn) {
    var messageData = {};
    if (data.context.response_type &&
          data.context.response_type == "correct_pick_up_location" &&
          messageAddOn.pick_up_location) {
        var lat = messageAddOn.pick_up_location.lat;
        var lng = messageAddOn.pick_up_location.lng;
        item_url = "https://www.google.com/maps/preview/@" + lat + "," + lng + ",17z";
        image_url = "https://maps.googleapis.com/maps/api/staticmap?center=" + lat + "," + lng + "&zoom=17&scale=1&size=560x292&maptype=terrain&format=png&key=" + process.env.GOOGLE_MAPS_API_IMAGE;
        messageData.attachment = {
            "type": "template",
            "payload": {
                "template_type": "generic",
                "elements": {
                    "element": {
                        "title": messageAddOn.pick_up_location.formatted_address,
                        "item_url": item_url,
                        "image_url": image_url
                      }
                }
            }
        };
    } else if (data.context.text) {
        messageData.text = data.context.text;
    }
    if (data.context.quick_replies) {
        messageData.quick_replies = data.context.quick_replies;
    }
    console.log("Recieved from Watson: " + messageData.text + " " + messageData.quick_replies);
    if (messageData) {
        request({
            url: 'https://graph.facebook.com/v2.6/me/messages',
            qs: {
                access_token: token
            },
            method: 'POST',
            json: {
                recipient: {
                    id: sender
                },
                message: messageData,
            }
        }, function(error, response, body) {
            if (error) {
                console.log('Error sending message: ', error);
            } else if (response.body.error) {
                console.log('Error: ', response.body.error);
            }
            writeContext(sender, data.context);
        });
    }
}

function writeContext(sender, context) {
    platformContainer.createObject(sender, JSON.stringify(context))
        .then(function(object) {})
        .catch(function(err) {
            console.error("Error writing context to storage: " + err);
        });
}

function getProfile() {
  requestify.get('http://example.com').then(function(response) {
      // Get the response body (JSON parsed - JSON response or jQuery object in case of XML response)
      response.getBody();

  });
}

app.listen(port, host);
