var async = require("async");
var exec = require('child_process').exec;
var express = require('express');
var bodyParser = require('body-parser');
var path = require('path');
var mime = require('mime');
var fs = require('fs');
var azureManager = require('./azure-manager');

var router = express.Router();
router.use(bodyParser.urlencoded({ extended: false })); // support encoded bodies
router.use(bodyParser.json()); // support json encoded bodies

router.post('/video', function(req, res) {
    var d = new Date();
    var message = "START PROCESS... " + d.toLocaleString();
    console.log(message);
    
    var duration = req.body.duration;
    console.log("Duration: " + duration);

    async.waterfall([
        async.apply(startRaspivid, duration),
        startMP4Box,
        startRMFile,
    ], function (error, result) {
        if(error)
        {
            console.log("ERROR ASYNC: " + error);
            res.status(400).send({details: error});
        }
        else
        {
            d = new Date();
            var message = result + " " + d.toLocaleString();
            azureManager.SendToBlob(message, function(callback_result){
                if(callback_result.result)
                {
                    res.status(200).send({details: callback_result.details, video: callback_result.video, title: callback_result.title, subtitle: callback_result.subtitle });
                }else {
                    res.status(400).send({details: callback_result.details});
                }
            });
        }
    });
});

function startRaspivid(time, callback) {
    console.log("STARTED - raspivid h264 file...");
    var cmd = "raspivid -w 1280 -h 720 -fps 25 -hf -t " + time + " -b 1800000 -o - | psips > /home/pi/share/output/live.h264";
    console.log("Record command: " + cmd);
    exec(cmd, (error, stdout, stderr) => {
            if (error) {
                console.error("exec error: " + error);
                return;
            }
            console.log("FINISHED - raspivid h264 file...");
            callback(null);
        });
}
function startMP4Box(callback) {
    console.log("STARTED - MP4Box mp4 file...");
    var cmd = "MP4Box -add /home/pi/share/output/live.h264 -new /home/pi/share/output/live.mp4";
    exec(cmd, (error, stdout, stderr) => {
            if (error) {
                console.error("exec error: " + error);
                return;
            }
            console.log("FINISHED - MP4Box mp4 file...");
            callback(null);
        });
}
function startRMFile(callback) {
    console.log("STARTED - rm h264 file...");
    var cmd = "rm /home/pi/share/output/live.h264";
    exec(cmd, (error, stdout, stderr) => {
            if (error) {
                console.error("exec error: " + error);
                return;
            }
            console.log("FINISHED - rm h264 file...");
            callback(null,"PROCESS DONE...");
        });
}

module.exports = router;