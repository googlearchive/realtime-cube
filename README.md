# CollabCube 3D

![CollabCube 3D Screenshot](https://github.com/googledrive/realtime-cube/raw/master/screenshot.png)

## Overview

**CollabCube 3D**, is an online game demonstrating usage of the [Google Drive Realtime API](https://developers.google.com/drive/realtime).

CollabCube 3D allows you to play to a well known colored cube puzzle collaboratively.

You can try out CollabCube 3D on its [live instance](https://realtime-cube.appspot.com).

## Installation and Configuration

The project can run on any static web server, but we also provide required configuration and boilerplate files to host it on App Engine.

If you wish to host it in your own App Engine instance make sure you set the name of your App Engine application in `/app.yaml`. To create an App Engine instance follow the instructions on [appengine.google.com](https://appengine.google.com).

### Create a Google APIs project and Activate the Drive API

First, you need to activate the Drive API for your app. You can do it by configuring your API project in the Google APIs Console.

- Create an API project in the [Google APIs Console](https://developers.google.com/console).
- Select the Services tab in your API project, and enable the Drive API.
- Select the API Access tab in your API project, and click Create an OAuth 2.0 client ID.
- In the Branding Information section, provide a name for your application (e.g. "CollabCube 3D"), and click Next. Providing a product logo is optional.
- In the Client ID Settings section, do the following:
  - Select Web application for the Application type
  - Click the more options link next to the heading, Your site or hostname.
  - List your hostname in the Authorized Redirect URIs and JavaScript Origins fields.
  - Click Create Client ID.
- In the **API Access** page, locate the section **Client ID for Web applications** and note the **Client ID** value.
- List your hostname in JavaScript origins in the Client ID settings.
- Go to the **Drive SDK** page and copy the **App ID**


### Setup your App information in the code

You should now have your **Client ID** and your **App ID**. In `/collabcube.js` change the `appId` and the `clientId` in the `realTimeOptions` object.

### Deploy, run that's it!