var azure = require('azure-storage');

exports.ReadFromNGROKTableStorage = function(callback) 
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

    var query = new azure.TableQuery()
    .select(['description'])
    .top(5)
    .where('PartitionKey eq ?', process.env.NGROK_TABLE_NAME);

    var tableSvc = azure.createTableService(process.env.AZURE_STORAGE_CONNECTION_STRING);
    tableSvc.queryEntities(process.env.NGROK_TABLE_NAME, query, null, function(error, result, response){
        if(!error) {
            callback(result.entries[0].description);
        }else{
            console.log(error);
        }
    });
}