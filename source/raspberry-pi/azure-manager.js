var azure = require('azure-storage');

exports.SendToNGROKTableStorage = function(address, callback) 
{
    var startDate = new Date();
    var expiryDate = new Date(startDate);
    expiryDate.setMinutes(startDate.getMinutes() + 100);
    startDate.setMinutes(startDate.getMinutes() - 100);

    console.log("Start Date: " + startDate);
    console.log("End Date: " + expiryDate);

    var sharedAccessPolicy = {
    AccessPolicy: {
            Permissions: azure.BlobUtilities.SharedAccessPermissions.READ + azure.BlobUtilities.SharedAccessPermissions.ADD + azure.BlobUtilities.SharedAccessPermissions.CREATE + azure.BlobUtilities.SharedAccessPermissions.WRITE,
            Start: startDate,
            Expiry: expiryDate
        }
    };

    var entGen = azure.TableUtilities.entityGenerator;
    var task = {
      PartitionKey: entGen.String(process.env.NGROK_TABLE_NAME),
      RowKey: entGen.String('1'),
      description: entGen.String(address)
    };

    var tableSvc = azure.createTableService(process.env.AZURE_STORAGE_CONNECTION_STRING);
    tableSvc.insertOrReplaceEntity(process.env.NGROK_TABLE_NAME, task, function(error, result, response){
        if(!error) {
            console.log("ngrok address updated!");
        }else{
            console.log(error);
        }
    });
}

exports.SendToBlob = function(message, callback) {
    
    var containerName = process.env.CONTAINER_NAME;
    var timeStamp = new Date().toISOString();
    var blobName = "live" + timeStamp + ".mp4";
    var file = "/home/pi/share/output/live.mp4";
    var blobPath = process.env.BLOB_PATH + process.env.CONTAINER_NAME + "/" + blobName + "?";

    var startDate = new Date();
    var expiryDate = new Date(startDate);
    expiryDate.setMinutes(startDate.getMinutes() + 100);
    startDate.setMinutes(startDate.getMinutes() - 100);

    console.log("Start Date: " + startDate);
    console.log("End Date: " + expiryDate);

    var sharedAccessPolicy = {
    AccessPolicy: {
            Permissions: azure.BlobUtilities.SharedAccessPermissions.READ + azure.BlobUtilities.SharedAccessPermissions.ADD + azure.BlobUtilities.SharedAccessPermissions.CREATE + azure.BlobUtilities.SharedAccessPermissions.WRITE,
            Start: startDate,
            Expiry: expiryDate
        }
    };

    var blobService = azure.createBlobService(process.env.AZURE_STORAGE_CONNECTION_STRING);

    var callback_response = {
        result: false,
        details:"",
        video:"",
        title:"",
        subtitle:""
    }

    blobService.createContainerIfNotExists(containerName, function(error, result, response) {
        if (error) {
            console.log("Couldn't create container %s", containerName);
            console.log(error);
            callback_response.details = error;
            callback(callback_response);
        } else {
            if (result.created) {
                console.log('Container %s created', containerName);
            } else {
                console.log('Container %s already exists', containerName);
            }

            var token = blobService.generateSharedAccessSignature(containerName, null, sharedAccessPolicy);
            var sasBlobService = azure.createBlobServiceWithSas(blobService.host, token);
            console.log("token: " + token);
            
            console.log("STARTED - uploading to azure blob storage...");
            sasBlobService.createBlockBlobFromLocalFile(containerName, blobName, file, 
                { 
                    contentSettings: { 
                        contentType: 'video/mp4;'
                    } 
                }, function(error, result, response) {
                console.log("FINISHED - uploading to azure blob storage...");
                if (!error) {
                    console.log(message);
                    callback_response.result = true;
                    callback_response.details = message;
                    callback_response.video = blobPath + token;
                    callback_response.title = timeStamp;
                    callback_response.subtitle = "captura en vivo";
                    callback(callback_response);
                }else{
                    console.log(error);
                    callback_response.details = error;
                    callback(callback_response);
                }
            });
        }
    });

}