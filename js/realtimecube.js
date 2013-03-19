/**
 * Copyright 2013 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var VERSION = 'v1.0';
var IS_DEBUG = false;

/**
 * Options for the RealTime loader.
 */
var realTimeOptions = {
  /**
   * Client ID from the API console.
   */
   clientId: YOUR_CLIENTID_HERE,

  /**
   * Application ID from the API console.
   */
   appId: YOUR_APP_ID_HERE,

  /**
   * Function to be called when a RealTime model is first created.
   */
  initializeModel: initializeModel,

  /**
   * Function to be called every time a RealTime file is loaded.
   */
  onFileLoaded: onFileLoaded,

  /**
   * ID of the auth button.
   */
  authButtonElementId: 'authorizeButton',

  /**
   * Automatically create file after auth.
   */
  autoCreate: true,

  /**
   * Name of new files that gets created.
   */
  defaultTitle: 'Realtime Cube'
};

function showShareDialog() {
  var shareClient = new gapi.drive.share.ShareClient(realTimeOptions.appId);
  shareClient.setItemIds(rtclient.params['fileId']);
  shareClient.showSettingsDialog();
}


function startRealtimeCube() {
  logDebug('Starting Realtime Cube');
  var realTimeLoader = new rtclient.RealtimeLoader(realTimeOptions);
  realTimeLoader.start(function(){document.getElementById("loading").style.display = ''});
}

var AXIS_X = 'x';
var AXIS_Y = 'y';
var AXIS_Z = 'z';

var MOVE_AXIS_KEY = 'axis';
var MOVE_LAYER_KEY = 'layer';
var MOVE_DIRECTION_KEY = 'dir'

var MOVES_KEY = 'moves';

var rubik;
var movesList;

var collabDoc;


/**
 * This function is called the first time that the RealTime model is created
 * for a file. This function should be used to initialize any values of the
 * model. In this case, we just create the single string model that will be
 * used to control our text box. The string has a starting value of 'Hello
 * RealTime World!', and is named 'text'.
 * @param model {gapi.drive.realtime.Model} the RealTime root model object.
 */
function initializeModel(model) {
  logDebug('initializeModel');
  model.getRoot().set(MOVES_KEY, model.createList());
}

function updateForCubeDoneInitializing() {
  document.getElementById('mainCube').style.display = 'block';
}

function updateForRealTimeDoneInitializing() {
  document.getElementById('loading').style.display = 'none';
  document.getElementById('content').style.display = 'block';
  document.getElementById('collaborators').style.display = 'block';
}

/**
 * This function is called when the RealTime file has been loaded. It should
 * be used to initialize any user interface components and event handlers
 * depending on the RealTime model. In this case, create a text control binder
 * and bind it to our string model that we created in initializeModel.
 * @param doc {gapi.drive.realtime.Document} the RealTime document.
 */
function onFileLoaded(doc) {
  logDebug('onFileLoaded');
  collabDoc = doc;

  document.getElementById("loading").style.display = 'none';

  var model = doc.getModel();
  movesList = model.getRoot().get(MOVES_KEY);

  doc.addEventListener(gapi.drive.realtime.EventType.COLLABORATOR_JOINED, onCollaboratorsChanged);
  doc.addEventListener(gapi.drive.realtime.EventType.COLLABORATOR_LEFT, onCollaboratorsChanged);

  movesList.addEventListener(gapi.drive.realtime.EventType.VALUES_ADDED, onMovesListValuesAdded);
  movesList.addEventListener(gapi.drive.realtime.EventType.VALUES_REMOVED, onMovesListValuesRemoved);

  setTimeout(function() {
    updateForRealTimeDoneInitializing();
    setTimeout(function() {
      updateCollaborators();
      setTimeout(function() {
        initCube();
      }.bind(this), 0)
    }.bind(this), 0);
  }.bind(this), 0);
}

function onCollaboratorsChanged(e) {
  updateCollaborators();
}

function updateCollaborators() {
  logDebug('****updateCollaborators***');
  removeAbsentCollaborators();
  addPresentCollaborators();

  // TODO: Highlight the collaborator that made the move.
}

function removeAbsentCollaborators() {
  // If there is a 'current' DOM session ID in the  that is not present in the
  // updated collaborators list, remove it.
  var updatedCollaborators = collabDoc.getCollaborators();
  var currentDomSessionIds = getCurrentCollaboratorSessionIdsByDom();
  for (var i = 0; i < currentDomSessionIds.length; i++) {
    var domSessionId = currentDomSessionIds[i];
    var found = false;
    for (var j = 0; i < updatedCollaborators.length; j++) {
      var updatedCollaborator = updatedCollaborators[j];
      if (domSessionId == updatedCollaborator.sessionId) {
        // Found, do not remove
        found = true;
        break;
      }
    }

    // Not found, remove from dom.
    if (!found) {
      removeCollaboratorBySessionId(domSessionId);
    }
  }
}

function addPresentCollaborators() {
  var newCollaborators = collabDoc.getCollaborators();
  for (var i = 0; i < newCollaborators.length; i++) {
    maybeAddCollaborator(newCollaborators[i]);
  }
  setTimeout(fadeInAllCollaborators, 0);
}

function fadeInAllCollaborators() {
  var collaborators = collabDoc.getCollaborators();
  for (var i = 0; i < collaborators.length; i++) {
    var collaboratorDiv = getCollaboratorDiv(collaborators[i]);
    collaboratorDiv.className += ' collaborator-shown';
  }
}

function maybeAddCollaborator(collaborator) {
  if (!collaboratorExists(collaborator)) {
    getCollaboratorsContainerDiv().appendChild(genCollaboratorDiv(collaborator));
  }
}

function maybeRemoveCollaborator(collaborator) {
  if (collaboratorExists(collaborator)) {
    getCollaboratorsContainerDiv().removeChild(getCollaboratorDiv(collaborator));
  }
}

function removeCollaboratorBySessionId(sessionId) {
  var divToRemove = getCollaboratorDivBySessionId(sessionId);
  getCollaboratorsContainerDiv().removeChild(divToRemove);
}

function getCurrentCollaboratorSessionIdsByDom() {
  var collaboratorChildren = getCollaboratorsContainerDiv().children;
  var sessionIds = [];
  for (var i = 0; i < collaboratorChildren.length; i++) {
    sessionIds.push(getSessionIdFromCollaboratorDiv(collaboratorChildren[i]));
  }
  return sessionIds;
}

function getSessionIdFromCollaboratorDiv(collaboratorDiv) {
  return collaboratorDiv.id.substring(collaboratorDiv.id.indexOf('_') + 1);
}

function genCollaboratorDiv(collaborator) {
  var collaboratorDiv = document.createElement('div');
  collaboratorDiv.id = getIdForCollaboratorDiv(collaborator);
  collaboratorDiv.setAttribute('class', 'collaborator');

  var imgDiv = document.createElement('img');
  imgDiv.setAttribute('class', 'collaborator-image shadow');
  imgDiv.setAttribute('title', collaborator.displayName);
  imgDiv.setAttribute('alt', collaborator.displayName);
  imgDiv.setAttribute('src', collaborator.photoUrl);

  collaboratorDiv.appendChild(imgDiv);
  return collaboratorDiv;
}

function getCollaboratorsContainerDiv() {
  return document.getElementById('collaborators-container');
}

function collaboratorExists(collaborator) {
  return !!getCollaboratorDiv(collaborator);
}

function getCollaboratorDiv(collaborator) {
  return getCollaboratorDivBySessionId(collaborator.sessionId);
}

function getCollaboratorDivBySessionId(sessionId) {
  return document.getElementById(getIdForCollaboratorDivBySessionId(sessionId));
}

function getIdForCollaboratorDiv(collaborator) {
 return getIdForCollaboratorDivBySessionId(collaborator.sessionId);
}

function getIdForCollaboratorDivBySessionId(sessionId) {
 return 'collaborator_' + sessionId;
}

function initCube() {
  rubik = new Rubik();
  initPreviousCubeMoves();

  setTimeout(updateForCubeDoneInitializing, 0);
}


function initPreviousCubeMoves() {
  processIncomingMovesAdded(movesList.asArray(), true /* opt_skipAnimation */);
}

function onMovesListValuesAdded(e) {
  logDebug('Moves List Values Added:');
  logDebug(e);
  processIncomingMovesAdded(e.values, false /* opt_skipAnimation */);
}

function onMovesListValuesRemoved(e) {
  setTimeout(function() {
    logDebug('Moves List Values Removed:');
    logDebug(e);
    processIncomingMovesRemoved(e.values);
  }.bind(this), 0);
}

function scrambleCube() {
  rubik.randomize();
}

function addMove(axis, dir, layer) {
  movesList.push(serializeMove(axis, dir, layer));
}


function serializeMove(axis, dir, layer) {
  var move = {};
  move[MOVE_AXIS_KEY] = axis;
  move[MOVE_DIRECTION_KEY] = dir;
  move[MOVE_LAYER_KEY] = layer;
  return move;
}

function executeMove(move, opt_skipAnimation) {
  if (move[MOVE_AXIS_KEY] == AXIS_X) {
    rubik._rotateX(move[MOVE_DIRECTION_KEY], move[MOVE_LAYER_KEY], true, opt_skipAnimation);
  }
  else if (move[MOVE_AXIS_KEY] == AXIS_Y) {
    rubik._rotateY(move[MOVE_DIRECTION_KEY], move[MOVE_LAYER_KEY], true, opt_skipAnimation);
  }
  else if (move[MOVE_AXIS_KEY] == AXIS_Z) {
    rubik._rotateZ(move[MOVE_DIRECTION_KEY], move[MOVE_LAYER_KEY], true, opt_skipAnimation);
  }
  else {
    alert('Unrecognized move.');
  }
}


function processIncomingMovesAdded(moves, opt_skipAnimation) {
  // These are the new moves. Make them locally.
  logDebug('Processing incoming moves!');
  logDebug(moves);

  for (var i = 0; i < moves.length; i++) {
    executeMove(moves[i], opt_skipAnimation);
  }
}


function logDebug(msg) {
  if (IS_DEBUG) {
    window.console.debug(msg);
  }
}
