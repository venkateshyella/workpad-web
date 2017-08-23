/**
 * Created by Vikas on 28/11/16.
 */
(function () {
	"use strict";

	angular.module('app.services')
	.service('ConferenceService', [
	                          '$q', 'Connect',
	                          'mDialog', '$mdToast',
	                          'blockUI', 'Lang','DataProvider','URL',
	                          'AppCoreUtilityServices','Session','JITSI_CONF_OPTIONS',
	                          '$rootScope','CONFERENCE_BROADCAST','MEETING_CUSTOM_COMMANDS', ConferenceService
	                          ]);

	function ConferenceService($q, Connect, Dialog, $mdToast, blockUI, Lang, 
			               DataProvider, URL, AppCoreUtilityServices, Session,JITSI_CONF_OPTIONS, 
			               $rootScope, CONFERENCE_BROADCAST, MEETING_CUSTOM_COMMANDS) {

		var LANG = Lang.en.data;
		
		// JitsiMeetJS.setLogLevel(JitsiMeetJS.logLevels.ERROR);
		var initOptions = {
		    disableAudioLevels: true,
		    // Desktop sharing method. Can be set to 'ext', 'webrtc' or false to disable.
		    desktopSharingChromeMethod: 'ext',
		    // The ID of the jidesha extension for Chrome.
		    desktopSharingChromeExtId: 'mbocklcggfhnbahlnepmldehdhpjfcjp',
		    // The media sources to use when using screen sharing with the Chrome
		    // extension.
		    desktopSharingChromeSources: ['screen', 'window'],
		    // Required version of Chrome extension
		    desktopSharingChromeMinExtVersion: '0.1',

		    // The ID of the jidesha extension for Firefox. If null, we assume that no
		    // extension is required.
		    desktopSharingFirefoxExtId: null,
		    // Whether desktop sharing should be disabled on Firefox.
		    desktopSharingFirefoxDisabled: true,
		    // The maximum version of Firefox which requires a jidesha extension.
		    // Example: if set to 41, we will require the extension for Firefox versions
		    // up to and including 41. On Firefox 42 and higher, we will run without the
		    // extension.
		    // If set to -1, an extension will be required for all versions of Firefox.
		    desktopSharingFirefoxMaxVersionExtRequired: -1,
		    // The URL to the Firefox extension for desktop sharing.
		    desktopSharingFirefoxExtensionURL: null,
		    audiobandwidth : 1024,
		}

		var _connection = null;
		var _room = null;
		var _connectionOptions = JITSI_CONF_OPTIONS;
		var _roomConfOptions = {
			    openSctp: true,
			    resolution : 1024
			}
		var _connectorRole = {
				MODERATOR : false,
				PARTICIPANT : false
		};
		
		var _roomCredentials = {name: null, password: null};
		var _localTracks = [];
		var _remoteTracks = {};
		var _userRole = null;
		var _myTrack = null;
		var _participentsList = [];
		var isJoined = false;
		var _roomConnectDeferred = null;
		var _roomJoinResponse = {
									isRoomJoined : false,
									room : null
								};
		var _boshAuth = { username: Session.userInfo.chatUserName,
						  password: Session.userInfo.chatPassword };
		var myDisplayName = null;
		var localId = null;
		var _participantAppUserId = null;
		
		
		/**
		 * function is called when connection is established successfully
		 */
		function onConnectionSuccess(){
			console.log("onConnectionSuccess getting my display Name ::: " + _roomCredentials.name);
			
		    _room = _connection.initJitsiConference(_roomCredentials.name, _roomConfOptions);
		  
		    _room.on(JitsiMeetJS.events.conference.TRACK_ADDED, onRemoteTrack);
		    _room.on(JitsiMeetJS.events.conference.TRACK_REMOVED, function (track) {
		        console.log("track removed!!!" + track);
		    });
		    _room.on(JitsiMeetJS.events.conference.CONFERENCE_JOINED, onConferenceJoined);
		    _room.on(JitsiMeetJS.events.conference.CONFERENCE_FAILED, onConferenceFailed);
		    _room.on(JitsiMeetJS.events.conference.KICKED, onUserKicked);
		    
		    //room.on(JitsiMeetJS.events.conference.USER_JOINED, function(id){ console.log("user join");remoteTracks[id] = [];});
		    _room.on(JitsiMeetJS.events.conference.USER_JOINED, onUserJoined);
		    
		    _room.on(JitsiMeetJS.events.conference.USER_LEFT, onUserLeft);

            _room.addCommandListener(CONFERENCE_BROADCAST.MEETING_ENDED,function (values) {
                // onUserKicked();
				$rootScope.$broadcast(MEETING_CUSTOM_COMMANDS.CUSTOM_END,values.attributes)
            });

            // room.addCommandListener(MEETING_CUSTOM_COMMANDS.MEMBER_REMOVED,function (values) {
            //
            // });

		    /* room.on(JitsiMeetJS.events.conference.USER_ROLE_CHANGED, function (id ,role){
		    	  console.log("USER_ROLE_CHANGED :: "+id + " - " + role);
		    	  userRole = role;
		    	  console.log("USER_ROLE_CHANGED :: userRole ==== "+userRole);
		    	  var userDisplayName ="Name  :  " + id + ",    Role  :  " + userRole + ",   Id  :  " + id;
		    	  var userRemoveRoleName ="Name  :  " + id + ",    Role  :  " + participantString + ",   Id  :  " + id;
		    	  
		    	     var index = participentsList.indexOf(userRemoveRoleName);
		    	        if (index > -1) {
		    	        	participentsList.splice(index, 1);
		    	        }
		    	   setParticipentsList(participentsList);
		    	  participentsList.push(userDisplayName);
		    	  if(id === localId){
		    		  isModerator = true;
		    		  console.log("I'm moderator, locking room with password" + password);
		    		  room.lock(password);
		    	  }
		    	    
		    	 getUserList();
		    });
		   
		    
		    */
		    JitsiMeetJS.mediaDevices.addEventListener(JitsiMeetJS.events.mediaDevices.PERMISSION_PROMPT_IS_SHOWN, function(environmentType ){
		    	//environmentTypes : 'chrome'|'opera'|'firefox'|'iexplorer'|'safari'|'nwjs'|'react-native'|'android'
				  // alert("Enable browser permission to access audio devices for " + environmentType +"browser." );
			   });
		    
		    console.info('Room Joined ');
		    
		  //  var password = "sagar";
		    _room.setDisplayName(_roomCredentials.displayName);
		    
		   if (! _connectorRole.MODERATOR) {
			   console.log("not moderator");
			   _room.join(_roomCredentials.password);
		    } else {
		    	console.log(" moderator");
		    	_room.join();
		    	_room.lock(_roomCredentials.password);
		    }
		   
		   _room.addCommandListener("AddedNewParticipant", function(values){
			   console.log("========= New participant is added to the conference =============");
		   });
		   
		   JitsiMeetJS.createLocalTracks({devices: ["audio"]}, true).
		    then(onLocalTracks).catch(function (error) {
		    	  console.log("connect localtrack erroe=r ::;");
		        throw error;
		    });
		   
		   _room.addCommandListener(MEETING_CUSTOM_COMMANDS.NEW_MEMBER_ADDED, function (values) {
			   console.log("MEETING_CUSTOM_COMMANDS.NEW_MEMBER_ADDED ::: "+angular.toJson(values));
				$rootScope.$broadcast(MEETING_CUSTOM_COMMANDS.NEW_MEMBER_ADDED, {userDetails : values,
			});
		   });
		   
		   _room.addCommandListener(MEETING_CUSTOM_COMMANDS.MEMBER_REMOVED, function (values) {
			   console.log("MEETING_CUSTOM_COMMANDS.MEMBER_REMOVED ::: "+angular.toJson(values));
				$rootScope.$broadcast(MEETING_CUSTOM_COMMANDS.MEMBER_REMOVED, {userDetails : values,
			});
		   });
		   
		   _room.addCommandListener(MEETING_CUSTOM_COMMANDS.MEETING_EXTENDED, function (values) {
			   console.log("MEETING_CUSTOM_COMMANDS.MEETING_EXTENDED ::: "+angular.toJson(values));
				$rootScope.$broadcast(MEETING_CUSTOM_COMMANDS.MEETING_EXTENDED, values.attributes);
		   });
		   
		   
		    
		};
		
		function disconnect(){
		    console.log("disconnect!");
		    connection.removeEventListener(JitsiMeetJS.events.connection.CONNECTION_ESTABLISHED, onConnectionSuccess);
		    connection.removeEventListener(JitsiMeetJS.events.connection.CONNECTION_FAILED, onConnectionFailed);
		    connection.removeEventListener(JitsiMeetJS.events.connection.CONNECTION_DISCONNECTED, disconnect);
		    //getUserList();
		}

		/**
		 * This function is called when the connection fail.
		 */
		function onConnectionFailed(){
			console.error("Connection Failed!")
		};
		
		/**
		 * Handles remote tracks
		 * @param track JitsiTrack object
		 */
		function onRemoteTrack(track) {
			console.log("onRemoteTrack..");
			
		    if(track.isLocal())
		        return;
		    
			 console.log("getParticipantId :::" +track.getParticipantId());

		    var participant = track.getParticipantId();
		    if(!_remoteTracks[participant])
		    	_remoteTracks[participant] = [];
		    var idx = _remoteTracks[participant].push(track);
		    
		    var id = participant + track.getType() + idx;
		    
		    
		    track.addEventListener(JitsiMeetJS.events.track.TRACK_AUDIO_LEVEL_CHANGED,
		            function (audioLevel) {
		                console.log("Audio Level remote: " + audioLevel);
		            });
		        track.addEventListener(JitsiMeetJS.events.track.TRACK_MUTE_CHANGED,
		            function () {
		                console.log("remote track muted");
		            });
		        track.addEventListener(JitsiMeetJS.events.track.LOCAL_TRACK_STOPPED,
		            function () {
		                console.log("remote track stoped");
		            });
		        track.addEventListener(JitsiMeetJS.events.track.TRACK_AUDIO_OUTPUT_CHANGED,
		            function (deviceId) {
		                console.log("track audio output device was changed to " + deviceId);
		            });
		        
		        $("body").append("<audio autoplay='1' id='" + participant + "audio" + idx + "' />");
		        track.attach($("#" + id)[0]);
		    
		}
		
		
		/**
		 * Handles local tracks.
		 * @param tracks Array with JitsiTrack objects
		 */
		function onLocalTracks(tracks)
		{
			 console.log("onLocalTracksl:" );
			 
			 _localTracks = tracks;
		    console.log("onLocalTracksl: length :::" +tracks.length);
		    
		    
		    for(var i = 0; i < _localTracks.length; i++)
		    {
		    	console.log("onLocalTracksl: track content :::" + _localTracks[i]);
		        
		    	_localTracks[i].addEventListener(JitsiMeetJS.events.track.TRACK_AUDIO_LEVEL_CHANGED,
		                function (audioLevel) {
		                    console.log("Audio Level local" + audioLevel);
		                });
		    	_localTracks[i].addEventListener(JitsiMeetJS.events.track.TRACK_MUTE_CHANGED,
		                function () {
		                    console.log("local track muted");
		                });
		    	_localTracks[i].addEventListener(JitsiMeetJS.events.track.LOCAL_TRACK_STOPPED,
		                function () {
		                    console.log("local track stoped");
		                });
		    	_localTracks[i].addEventListener(JitsiMeetJS.events.track.TRACK_AUDIO_OUTPUT_CHANGED,
		                function (deviceId) {
		                    console.log("track audio output device was changed " + deviceId);
		                });
		           
		            	console.log("local audio track ");
		                $("body").append("<audio autoplay='1' muted='true' id='localAudio" + i + "' />");
		                _localTracks[i].attach($("#localAudio" + i)[0]);
		            
		            if(isJoined)
		            	_room.addTrack(_localTracks[i]);
		    }
		}

		
		/**
		 * That function is executed when the conference is joined
		 */
		function onConferenceJoined(){
		    console.log("conference joined!");
		    
		    isJoined = true;
		    for(var i = 0; i < _localTracks.length; i++)
		    {  
		    	_room.addTrack(_localTracks[i]);
		    }
		    console.log("tracks ::: "+ _localTracks[0]);
		    _myTrack = _localTracks[0];
		    
		    _room.setDisplayName(myDisplayName);
		    
		    localId = _room.myUserId();
		    var  isModerator = _room.isModerator();
		    
		    console.log("localId   ::: " + localId);
		    console.log("isModerator   ::: " + _room.isModerator());
		    
		    var participents = _room.participants;
		    console.info("Participents  onConferenceJoined ::: "+ participents);
		    console.info(participents);
		    
		   _roomJoinResponse.isRoomJoined = true;
		   _roomJoinResponse.room = _room;
		   _roomConnectDeferred.resolve(_roomJoinResponse);
		   
		}
		
		
		function onConferenceFailed(error){
			console.log("conference failed!");
		   _roomConnectDeferred.reject(error);
		}
		
		function onUserKicked(){
			 console.log("onUserKicked");
			  for(var i = 0; i < _localTracks.length; i++){
				 // room.removeTrack(localTracks[i]);
				  
				  if(!(_localTracks[i].isEnded())){
				   detachAndRemoveLocalTracks(i);
				  _localTracks[i].dispose(); 
				  }
			  }
			_room.leave();
			!!_connection && _connection.disconnect();
			 var userDisplayName ="Name  :  " + myDisplayName + ",    Role  :  " + _room.getRole() + ",   Id  :  " + localId;
		    var index = _participentsList.indexOf(userDisplayName);
		    if (index > -1) {
		    	_participentsList.splice(index, 1);
		    }
		    
		    
		    $rootScope.$broadcast(CONFERENCE_BROADCAST.LOCAL_PARTICIPANT_KICKED, {conferenceParticipantId : localId});
		}
		
		
		function onUserJoined(id, user){ 
			
			 console.log("onUserJoined ::: " + id);
			 console.log("Participents   onUserJoined  " +  _room.participants);
			 console.info(_room.participants);
			 
			 var userObject = user;
			 console.info(userObject);
			 console.info("name = "+userObject._displayName);
			 console.info("role = "+userObject._role);
			 
			 var userDisplayName ="Name  :  " + userObject._displayName + ",    Role  :  " + userObject._role + ",   Id  :  " + id;
			 
			 
			 _participentsList.push(userDisplayName);
			 //setParticipentsList(_participentsList);
			
			 console.log("user join");
			_remoteTracks[id] = [];
			
			_roomJoinResponse.isRoomJoined = true;
			 _roomJoinResponse.room = _room;
			// _roomConnectDeferred.resolve(_roomJoinResponse);
			 
			 $rootScope.$broadcast(CONFERENCE_BROADCAST.PARTICIPANT_JOINED, {userDetails : user,
																		 conferenceParticipantId : id});
				 												
			
		}

		function onUserLeft(id, user) {
			console.log("user left ::: " + id);
			console.log("Participents   onUserLeft  " +  _room.participants);
			console.info(_room.participants);

			var userObject = user;
			console.info(userObject);
			console.info("name = "+userObject._displayName);
			console.info("role = "+userObject._role);

			// setParticipentsList(room.participants);

			if(!_remoteTracks[id])
				return;
			var tracks = _remoteTracks[id];

			var userDisplayName ="Name  :  " + userObject._displayName + ",    Role  :  " + userObject._role + ",   Id  :  " + id;
			var index = _participentsList.indexOf(userDisplayName);
			if (index > -1) {
				_participentsList.splice(index, 1);
			}

			var elemId = id+"audio1";
			detachAndRemoveRemoteTracks(tracks[0],elemId);

			$rootScope.$broadcast(CONFERENCE_BROADCAST.PARTICIPANT_LEFT, {userDetails : user,
				conferenceParticipantId : id});
		}
		
		
		function initConnection(){
			
			 var _con_deferred = $q.defer();
			
			JitsiMeetJS.init(initOptions).then(function(){
				
				_connection = new JitsiMeetJS.JitsiConnection(null, null, _connectionOptions);

				_connection.addEventListener(JitsiMeetJS.events.connection.CONNECTION_ESTABLISHED, onConnectionSuccess);
				_connection.addEventListener(JitsiMeetJS.events.connection.CONNECTION_FAILED, onConnectionFailed);
				_connection.addEventListener(JitsiMeetJS.events.connection.CONNECTION_DISCONNECTED, disconnect);

			    //JitsiMeetJS.mediaDevices.addEventListener(JitsiMeetJS.events.mediaDevices.DEVICE_LIST_CHANGED, onDeviceListChanged);
			    
			   // _connection.connect();
			    
			    _con_deferred.resolve();

			   
			    
			}).catch(function (error) {
				_con_deferred.reject(error);
			    console.log(error);
			});
			
			return _con_deferred.promise;
		}
		
		
		function connectModerator(roomName, roomPassword, displayName, appUserId){
			console.log("connect moderator::");
			_roomCredentials.name = roomName;
			_roomCredentials.password = roomPassword;
			_roomCredentials.displayName = displayName+"@@"+appUserId;

			_connectorRole.MODERATOR = true;
			_participantAppUserId = appUserId;
			
			myDisplayName = _roomCredentials.displayName;
			var userAuthName = _boshAuth.username + "@localhost";
			//var userPwdObj = {"id":userAuthName,"password":"12345"};
			var userPwdObj = {"id":userAuthName,"password": _boshAuth.password};
			_connection.connect(userPwdObj);
			
			//_connection.connect();
			
			_roomConnectDeferred = $q.defer();
			
			return _roomConnectDeferred.promise;
		}
		
		
		function connectParticipant(roomName, roomPassword, displayName, appUserId){
			console.log("connect participant::");
			_roomCredentials.name = roomName;
			_roomCredentials.password = roomPassword;
			_roomCredentials.displayName = displayName+"@@"+appUserId;
			
			_connectorRole.PARTICIPANT = true;
			_participantAppUserId = _roomCredentials.displayName;
			
			myDisplayName = _roomCredentials.displayName = displayName+"@@"+appUserId;
			var userAuthName = _boshAuth.username + "@localhost";
			var userPwdObj = {"id":userAuthName,"password": _boshAuth.password};
			
			_connection.connect(userPwdObj);
			
			_roomConnectDeferred = $q.defer();
			return _roomConnectDeferred.promise;
			//_connection.connect();
			
		}
		
		function endConnection(){
			!!_connection && _connection.disconnect();
		}
		
		function leaveAndKickEveryOne(){
			console.log("leaveAndKickEveryOne ");
			_room._leaveRoomAndRemoveParticipants();
		}
		
		function leaveRoom(){
			
			try{
				
			
			  for(var i = 0; i < _localTracks.length; i++){
				 // room.removeTrack(localTracks[i]);
				  
				  
				  if(!(_localTracks[i].isEnded())){
					  detachAndRemoveLocalTracks(i);
					  _localTracks[i].dispose(); 
				  }
				  
			  }
			  !!_room && _room.leave() && removeRoomEventListeners();
			
			
			!!_connection && _connection.disconnect();
			 var userDisplayName ="Name  :  " + myDisplayName + ",    Role  :  " + _room.getRole() + ",   Id  :  " + localId;
		     var index = _participentsList.indexOf(userDisplayName);
		     if (index > -1) {
		     	_participentsList.splice(index, 1);
		     }
		     
			}catch(err){
				console.log("ERROR WHILE LEAVE ROOM : "+err);
				var user = {};
				user._displayName = myDisplayName;
				$rootScope.$broadcast(CONFERENCE_BROADCAST.PARTICIPANT_LEFT, {userDetails : user,
					conferenceParticipantId : id, isForced : true});
			}finally{
				
			}
		     
		}

		function kickUser(id){
			console.log("Trying to kick user  ::; " + id)
			if(id){
			_room.kickParticipant(id);
            }else{
				console.log("Can't kick undefined")
			}
		}
		
		function dismissConference(){
			 for(var i = 0; i < _localTracks.length; i++){
				 // room.removeTrack(localTracks[i]);
				 if(!(_localTracks[i].isEnded()))
				  _localTracks[i].dispose(); 
			  }
			 
			 !!_room && _room.leave() && removeRoomEventListeners();
			 //_room._leaveRoomAndRemoveParticipants();
			 
			 
			!!_connection && _connection.disconnect();
			 var userDisplayName ="Name  :  " + myDisplayName +"   Id  :  " + localId;
		     var index = _participentsList.indexOf(userDisplayName);
		     if (index > -1) {
		     	_participentsList.splice(index, 1);
		     }
		}
		
		function muteLocalUser(){
			_myTrack.mute();
		}
		
		function unmuteLocalUser(){
			_myTrack.unmute();
		}
		
		function detachAndRemoveLocalTracks(id){
			console.log("removing local track container with id ==> "+id);
             _localTracks[id].detach($("#localAudio" + id)[0]);
             $("body #localAudio"+id).remove();
		}
		
		function detachAndRemoveRemoteTracks(reTrack, id){
			
			console.log("removing remote track container with id ==> "+id);
			!!reTrack && !!reTrack.detach && reTrack.detach($("#" + id)[0]);
            $("body #"+id).remove();
		}
		
		function removeRoomEventListeners(){
			    _room.off(JitsiMeetJS.events.conference.TRACK_ADDED, onRemoteTrack);
			    _room.off(JitsiMeetJS.events.conference.TRACK_REMOVED, function (track) {
			       // console.log("track removed!!!" + track);
			    });
			    _room.off(JitsiMeetJS.events.conference.CONFERENCE_JOINED, onConferenceJoined);
			    _room.off(JitsiMeetJS.events.conference.CONFERENCE_FAILED, onConferenceFailed);
			    _room.off(JitsiMeetJS.events.conference.KICKED, onUserKicked);
			    
			    _room.off(JitsiMeetJS.events.conference.USER_JOINED, onUserJoined);
			    
			    _room.off(JitsiMeetJS.events.conference.USER_LEFT, onUserLeft);
		}
		
		function getAudioOutputDevices(){
			var deferred = $q.defer();
			var audioOutputDevices  = [];
			//if (JitsiMeetJS.mediaDevices.isDeviceChangeAvailable('output')) {
			    JitsiMeetJS.mediaDevices.enumerateDevices(function(devices) {
			        audioOutputDevices = devices.filter(function(d) { return d.kind === 'audiooutput'; });
			        deferred.resolve(audioOutputDevices);
			    })
			//}
			
			return deferred.promise;
		}
		
		function getAudioInputDevices(){
			var deferred = $q.defer();
			var audioInputDevices  = [];
			if (JitsiMeetJS.mediaDevices.isDeviceChangeAvailable('input')) {
			    JitsiMeetJS.mediaDevices.enumerateDevices(function(devices) {
			    	audioInputDevices = devices.filter(function(d) { return d.kind === 'audioinput'; });
			        deferred.resolve(audioInputDevices);
			    })
			}
			
			return deferred.promise;
		}
		
		function changeAudioOutput(selectedDevice) {
		    JitsiMeetJS.mediaDevices.setAudioOutputDevice(selectedDevice.deviceId);
		}
		
		function setLocalTrackElementVolume(volumeLevel){
			JitsiMeetJS.util.RTCUIHelper.setVolume($("#localAudio0")[0], volumeLevel);
		}
		
		function newParticipantListener(commandName, values){
			_room.sendCommandOnce(commandName, values); 
		}

        function emitEndConfrence(meeting){
            _room.sendCommandOnce(CONFERENCE_BROADCAST.MEETING_ENDED,{
                attributes:{
                    meeting : meeting
                }
            });
        }
		
		return {
			initConnection: initConnection,
			endConnection : endConnection,
			connectModerator: connectModerator,
			connectParticipant : connectParticipant,
			leaveConference : leaveRoom,
			leaveAndEndConference : dismissConference,
			kickUser : kickUser,
			muteLocalUser : muteLocalUser,
			unmuteLocalUser : unmuteLocalUser,
			getAudioOutputDevices : getAudioOutputDevices,
			getAudioInputDevices : getAudioInputDevices,
			changeAudioOutput : changeAudioOutput,
			setLocalTrackElementVolume : setLocalTrackElementVolume,
			newParticipantListener : newParticipantListener,
            emitEndConfrence : emitEndConfrence

		}

	}

})();