"use strict";
var restify = require('restify');
var builder = require('botbuilder');
var botbuilder_azure = require("botbuilder-azure");
var request = require('./request');
var path = require('path');

var useEmulator = (process.env.NODE_ENV == 'development');

var connector = useEmulator ? new builder.ChatConnector() : new botbuilder_azure.BotServiceConnector({
    appId: process.env['MicrosoftAppId'],
    appPassword: process.env['MicrosoftAppPassword'],
    stateEndpoint: process.env['BotStateEndpoint'],
    openIdMetadata: process.env['BotOpenIdMetadata']
});

var bot = new builder.UniversalBot(connector, [
    function (session, args) {
        var card = createAnimationCard(session);
        var msg = new builder.Message(session).addAttachment(card);
        session.send(msg);
        session.beginDialog('AskForVideoLivingRoom');
    }
]);
bot.localePath(path.join(__dirname, './locale'));

bot.dialog('AskForVideoLivingRoom', [
    function (session, args) {
        builder.Prompts.choice(session, "Do you want to see the living room?", "yes|no", "button");
    },
    function (session, results) {
        //session.endDialogWithResult(results);
        session.dialogData.askForVideo = (results.response.index == 0) ? true : false;

        if(session.dialogData.askForVideo)
        {
            session.beginDialog('AskForVideoLivingRoomDuration');
        }else{
            session.endDialogWithResult(results);
        }
    }
]);

bot.dialog('AskForVideoLivingRoomDuration', [
    function (session, args) {
        builder.Prompts.choice(session, "Record duration?", "30 secs|1 min|1.5 mins", "button");
    },
    function (session, results) {
        switch (results.response.index) {
            case 0:
                session.dialogData.duration = 30000;
                break;
            case 1:
                session.dialogData.duration = 60000;
                break;
            case 2:
                session.dialogData.duration = 90000;
                break;  
            default:
                session.dialogData.duration = 30000;
                break;
        }
        callService(session);
        session.endDialogWithResult(results);
    }
]);

function createAnimationCard(session) {
    return new builder.HeroCard(session)
        .title("Welcome to PetCameraBot")
        .subtitle("Powered by Azure")
        .images([{url:"http://clipart-library.com/images/dc9KX44Ki.png"}]);
}

function createVideoCard(session, videoPath, title, subtitle) {
    return new builder.VideoCard(session)
        .title(title)
        .subtitle(subtitle)
        .media([{url:videoPath}]);
}

function callService(session)
{
    session.send("Please wait, we are getting your real-time video");
    var obj = { duration: session.dialogData.duration };
    request.performRequest('/api/video','POST', obj, function(res) {
        
        if(res.result)
        {
            var card = createVideoCard(session, res.object.video, res.object.title, res.object.subtitle);
            var msg = new builder.Message(session).addAttachment(card);
            session.send(msg);
        }else {
            session.send("There was an error contacting the remote service, please verify your event log");
        }
        
    });
}

if (useEmulator) {
    var restify = require('restify');
    var server = restify.createServer();
    server.listen(3978, function() {
        console.log('test bot endpont at http://localhost:3978/api/messages');
    });
    server.post('/api/messages', connector.listen());    
} else {
    module.exports = { default: connector.listen() }
}
