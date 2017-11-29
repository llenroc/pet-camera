## Preparing environment
PetCameraBot is a personal hack project that allow me to do a remote monitoring of my pets when I'm out of home.

<img src="http://rcervantes.me/images/pets.png" />

The main goal is to be able to request through a bot exposed to the internet a video of 30 seconds, a minute or a minute and a half, which will be processed by the raspberry and returned to be stored in an azure container.

## Architecture
<img src="http://rcervantes.me/images/petcamerabot-architecture.png" width="550" />

## Prerequisites
- Raspberry Pi Zero W / Raspberry Pi 3 / Raspberry Pi 2
- Micro SD Card 8 GB or 16 GB
- PiCamera V2 (IR or NoIR)
- Azure Account
- Cellphone with 3G, 4G or 5G

I decided to use the new Raspberry Pi Zero W because is smaller than the latest RPi 3 and it comes with Wi-Fi. The architecture used for this project in RPi Zero W is ARM6, this is an important consideration for the software we will be using e.g. NodeJS. 

If you're new on RPi development you should start [here](http://raspberrypi.org), download NOOBS or Raspbian and follow the intructions to prepare your new operating system.

I hardly recommend investigate how to install NodeJS for this architecture if you want to follow the same scenario as me. 

Recommended repo for NodeJS for ARM6: [NodeJS for Pi Zero](https://github.com/sdesalas/node-pi-zero).

## Preparing your Azure Storage environment
To save all videos an Azure Storage account is required, you need to join to Azure Portal, go to Storage service and generate a new one for our service. e.g. petcamerastorage. 

Recommended lecture for Azure Storage: [About Azure storage accounts](https://docs.microsoft.com/en-us/azure/storage/storage-create-storage-account).

Once you have your storage account is necessary keep safe the Azure Storage connection string, this will be used in the following steps.

## Preparing your Raspberry environment
As first step update and upgrade your RPi to verify you have the lastest packages.

First, update your system's package list by entering the following command:

`sudo apt-get update`

Next, upgrade all your installed packages to their latest versions with the command:

`sudo apt-get dist-upgrade`

If you are not familiarized how connect and test your PiCamera to your RPi, check this [video](https://www.youtube.com/watch?v=ojJhLQBiv0I).

The second step that should do is enable [VNC](https://www.realvnc.com/en/connect/docs/raspberry-pi.html) to access remotely without attach devices to your RPi such as keyboard, mouse or HDMI LCD. In case you have issues with the resolution of your screen using VNC you should read this [documentation](https://support.realvnc.com/knowledgebase/article/View/523/2/troubleshooting-vnc-server-on-the-raspberry-pi).

As an optional step I recommend configure the [Samba file server](https://www.raspberrypi.org/magpi/samba-file-server/) on the RPi with this you can share files with you Mac or PC, e.g. you can use Visual Studio Code to develop your scripts, save them on your laptop and then test directly on your RPi.

Ensure your RPi has the correct date, if the timezone service is not updating your RPi, try it manually:

`sudo date -s "Tue Aug 15 17:06:00"`

>Perfect! you are now set to start working on your RPi.

***Download and configure NGROK***

NGROK is a free tool that allow to us to expose a local port to internet, providing a random HTTP/HTTPS URL.

Download the Linux ARM version: [ARM](https://ngrok.com/download).

`mkdir \home\pi\files\ngrok\` <- creating your files and ngrok folder

`cd \home\pi\files\ngrok\` <- navigate and extract the ngrok file into your ngrok folder 

To run NGROK just run on the NGROK folder:

`./ngrok http 3000` <- 3000 is the port that we are going to use on our NodeJS server

We want each time the RPi boots automatically gets a new HTTP/HTTPS URL exposing our port 3000 and notify to NGROK user portal to external monitoring. Create a login and get an AuthToken, this token will be very helpful to let the portal know that we are exposing a tunnel.

Now, let's modify the rc.local file to save our NGROK startup configuration.

`sudo nano /etc/rc.local`

Then write before: **exit 0**.

`"/home/pi/files/ngrok/"./ngrok authtoken XXXXXXXXXXXXXXXXX` <- write the authtoken provided from the portal

`"/home/pi/files/ngrok/"./ngrok http 3000` <- run the ngrok command

At this moment your ngrok service is ready to be executed automatically each time the RPi initialize.

To validate the NGROK startup service is running as expected reboot your RPi, then open a terminal and execute:

`./ngrok http 3000`

If the service is running from the startup an error should be raised indicating the port is busy. 

>Bingo!!, you are set with your NGROK service! :)

***Create and navigate to your working folder***

`mkdir \home\pi\share\` <- creating your share folder

`cd \home\pi\share\` <- navigate to your share folder

***Install GIT on your RPi***

`sudo apt-get install git`

***Clone the PetCamera NodeJS service from GitHub repo***

`git clone https://github.com/rcervantes/pet-camera.git`

***UPDATE***:

* Go to `source/raspberry-pi/` and move the files to: `\home\pi\share\petcamera-raspberry\`, if petcamera-raspberry folder not exists then create it, you can proceed to delete the rest of the repository previously cloned since we are going to use just the raspberry-pi files.

***Update .env variables***

AZURE_STORAGE_CONNECTION_STRING= Azure storage connection string, e.g. "DefaultEndpointsProtocol=https;AccountName=YourAccount;AccountKey=XXXXXXXXXX;EndpointSuffix=core.windows.net"

BLOB_PATH= Blob path, e.g. "https://YourAccount.blob.core.windows.net/"

CONTAINER_NAME= The name of the blob container, this container can be grouped by type, e.g. "camera-livingroom"

NGROK_TABLE_NAME= The name of the Azure Table Storage to save the last ngrok https address used by our service, e.g. "ngrok"

***Install missing NodeJS modules***

`npm install` <- path of the nodejs service, e.g. \home\pi\share\petcamera-raspberry\

***Test your PetCamera NodeJS service***

`cd \home\pi\share\` <- navigate to your share folder

`node app.js` <- run app.js using nodejs

If everything is running well you should received a notification that the NodeJS is opened on port 3000, and you should go to your Azure Table Storage and lookup on the table "ngrok" to see the latest https address provided.

Since everytime we run the RPi a new HTTP/HTTPS URL is provided, we want to persist that information to become visible to our bot, in case accidentally the RPi is turned off when restarts the URL should be updated on the Azure Table Storage.

***Register your PetCamera NodeJS service on the RPi startup***

It's time to register our NodeJS service previously downloaded by GitHub, the service is responsible of record a fragment of video and compress it using a tool called MP4Box. 

In case you need to install MP4Box read [this](http://raspi.tv/2013/another-way-to-convert-raspberry-pi-camera-h264-output-to-mp4).

***Install NodeJS Forever packages***

`npm install forever -g` <- global package installation

`npm install forever-service -g` <- global package installation

***Install PetCamera service with NodeJS Forever package***

`sudo /opt/nodejs/lib/node_modules/forever-service/bin/forever-service install petCameraService --script  /home/pi/share/petcamera-raspberry/app.js` 

Verify the correct nodejs path with: `which node` or `which nodejs`.

If you need to delete the service try:

`sudo /opt/nodejs/lib/node_modules/forever-service/bin/forever-service delete petCameraService`

If you need to see the details of the running services:

`sudo /opt/nodejs/lib/node_modules/forever/bin/forever list`

Now, let's modify the rc.local file to save our NGROK startup configuration.

`sudo nano /etc/rc.local`

Then write after NGROK configuration (previously added) and before: **exit 0**.

`sudo service petCameraService start`

It's time to reboot your RPi, if want to see the log of the service for any exception or validate the correct execution:

`sudo nano /var/log/petCameraService.log`

If the log has too much executions saved try it with a deletion and then reboot and check it again.

>Bingo!! your RPi is ready to record, save your video on Azure and persists the dynamic URL from NGROK.

## Preparing your Azure Bot Service environment

***Create an Azure Form Bot Service***

Join to the Azure Portal and create a Form Bot Service (Preview).

Recommended lecture: [Azure Bot Service](https://docs.microsoft.com/en-us/bot-framework/azure/azure-bot-service-overview).

***Clone the PetCamera Bot Service from GitHub repo***

`git clone https://github.com/rcervantes/pet-camera.git`

***UPDATE***:

* The files needed for the bot service are located on the path: `source/bot-service/`.

***Prepare your local bot environment***

Follow the next steps to debug locally your Azure Bot Service:[Debug Azure Bot Service](https://docs.microsoft.com/en-us/bot-framework/azure/azure-bot-service-debug-bot).

***Deploy your bot to Azure***

Recommended lecture: [Deploy to GitHub](https://docs.microsoft.com/en-us/bot-framework/deploy-bot-github).

## Testing our Pet Camera Bot Service

You can test the bot service in three ways:

- Test the Raspberry NodeJS service: You can send POST request directly to the Raspberry NodeJS service to see if the video file is generated on backend. To achieve this task you can use [Postman](https://www.getpostman.com/).

- Test locally your Azure Bot service: [Debug Azure Bot Service](https://docs.microsoft.com/en-us/bot-framework/azure/azure-bot-service-debug-bot).

- Test the Azure Bot Service on Internet: You can use your Azure Bot Emulator and point to the Azure service or if you prefer, you can use the web chat on your internet mobile navigator.

## Images for reference

Raspberry Pi Zero W

<img src="http://rcervantes.me/images/raspberry-petcamera.png"  width="550" />

Welcome and first conversation.

<img src="http://rcervantes.me/images/petcamera-rasp3.png"  width="250" />

Second conversation.

<img src="http://rcervantes.me/images/petcamera-rasp4.png" width="250" />

Displaying the video.

<img src="http://rcervantes.me/images/petcamera-rasp5.png" width="250" />
