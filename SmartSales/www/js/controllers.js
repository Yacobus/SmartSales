angular.module('starter.controllers', [])

.controller('AppCtrl', function ($scope, $rootScope, $location, $cordovaSQLite) {
    $rootScope.changeStatus = function (status) {
        $rootScope.status = status;
    };

    $scope.signOut = function () {
        var logTime = new Date();
        $cordovaSQLite.execute(db, 'UPDATE LogSession SET IsLogin=?,Username=?,LogTime=?', ['0', 'null',logTime]);
        $rootScope.userName = null;
        $rootScope.fullName = null;
        $rootScope.password = null;
        $rootScope.userId = null;
        $location.path('/login');
    }

   
})

.controller('LoginCtrl', function ($ionicLoading, $ionicPlatform, $ionicPopup, $scope, $location, $cordovaSQLite, $rootScope, $http, $cordovaToast,md5) {
    $scope.user = [];
   
         $scope.init = function () {
            $ionicPlatform.ready(function () {
        $ionicLoading.show({
            template: '<ion-spinner icon="bubbles"></ion-spinner><br/>Session Checking...'
        });
        $cordovaSQLite.execute(db, 'SELECT * FROM LogSession').then(function (res) {
            var a = new Date();
            var b = new Date(res.rows.item(0).LogTime); // Or any other JS date
            var diff = Math.floor((Math.abs(a - b) / 1000) / 60 / 60)

            if (res.rows.item(0).IsLogin == 1 && diff < 48) {
                $rootScope.userId = res.rows.item(0).UserID;
                $rootScope.userName = res.rows.item(0).Username;
                $rootScope.fullName = res.rows.item(0).Fullname;
                $rootScope.updateSchedule = res.rows.item(0).UpdateSchedule;
                $rootScope.delegateTask = res.rows.item(0).DelegateTask;
                $location.path('/app/schedule');
                $ionicLoading.hide();
            } else {
                $ionicLoading.hide();
            }
        }, function (err) {
            alert('error ' + JSON.stringify(err));
        });
    
        });
    }

    $scope.login = function () {
        var link = rootLink + 'login.php';
        var nowDate = moment(new Date()).format('YYYY-MM-DD HH:mm');
        $ionicLoading.show({
            template: '<ion-spinner icon="bubbles"></ion-spinner><br/>Logging In...'
        });
        $http.post(link, { username: $scope.user.username, password: md5.createHash($scope.user.password) }).then(function (res) {
            //alert(JSON.stringify(res));
            if (res.data.length > 0) {
                $rootScope.userId = res.data[0].UserID;
                $rootScope.userName = res.data[0].Username;
                $rootScope.fullName = res.data[0].Fullname;
                $rootScope.updateSchedule = res.data[0].UpdateSchedule;
                $rootScope.delegateTask = res.data[0].DelegateTask;
                $cordovaSQLite.execute(db, 'UPDATE LogSession SET UserID=?, IsLogin=?, Username=?,Fullname=?, UpdateSchedule=?, DelegateTask=?,LogTime=?', [$rootScope.userId, '1', $rootScope.userName, $rootScope.fullName, $rootScope.updateSchedule, $rootScope.delegateTask, nowDate])
                    .then(function (res) {
                        $ionicLoading.hide();
                        $cordovaToast.show('Welcome ' + $rootScope.fullName, 'short', 'center');
                        $location.path('/app/schedule');
                    }, function (err) {
                        $ionicLoading.hide();
                        alert(JSON.stringify(err));
                    });
               
            } else {
                $ionicLoading.hide();
                var popupwrong = $ionicPopup.show({
                    title: '<img style="width:120%" src="img/close.png"></img>',
                    subTitle: 'Wrong username or password !',
                    cssClass: 'popup-login',
                    scope: $scope,
                    buttons: [
                        {
                            text: "OK",
                            onTap: function (e) {
                                $scope.user.username = null;
                                $scope.user.password = null;
                            }
                        }
                    ]
                })
            }
        }, function (err) {
            $ionicLoading.hide();
            alert(JSON.stringify(err));
        });
    }

    
})

.controller('RegisterCtrl', function ($scope, $cordovaSQLite, $location) {
    $scope.user = [];
    $scope.register = function () {
        //var query = "INSERT INTO userSales(username, password, nama) VALUES (?,?,?)"
        $cordovaSQLite.execute(db, "INSERT INTO userSales(username, password, name) VALUES (?,?,?)", [$scope.user.username, $scope.user.password, $scope.user.name]).then(function (result) {
            //$ionicLoading.show({
            //    template: '<ion-spinner icon="bubbles"></ion-spinner><br/>Acquiring location!'
            //});
            alert("Register Berhasil");
            $location.path('/login');
            //$ionicLoading.hide();
        }, function (error) {
            alert(JSON.stringfy(error));
        })
    };
})

.controller('NotificationCtrl', function ($ionicLoading, $rootScope, $scope, $cordovaLocalNotification,$ionicPlatform,$http, $cordovaSQLite) {

    $rootScope.notificated = [];

        var link = rootLink + 'getClient.php';
        $http.post(link, { salesid: $rootScope.userId }).then(function (res) {
            if (res.data.length > 0) {
                //alert(JSON.stringify(res));
                for (var i = 0; i < res.data.length; i++) {
                    $rootScope.notificated.push({ id: res.data[i].ClientID, name: res.data[i].ClientName });
                }
            }
        })
})

.controller('ScheduleCtrl', function ( $rootScope, $scope, $compile, uiCalendarConfig, $ionicModal, $ionicPopup, $timeout, $ionicLoading, $cordovaGeolocation, $cordovaSQLite, $cordovaCamera, $cordovaFile, $http, $cordovaFileTransfer, $cordovaToast) {

    var allScheduleData = [];
    var personalScheduleData = [];
    var allEventData = [];
    var personalEventData = [];
    $scope.schedule = [];
    $scope.event = [];
    $scope.client = [];
    $scope.entity = [];
    $scope.view = 'month';
    $scope.displayCalendar = 'personal';
    $scope.displayData = 'schedule';

    

    var date = new Date();
    var d = date.getDate();
    var m = date.getMonth();
    var y = date.getFullYear();



    var fullMonthName = moment(date).format('MMMM');
    $scope.current = fullMonthName + ' ' + y;

    getDate = function () {
        myDate = uiCalendarConfig.calendars['myCalendar'].fullCalendar('getView');
        $scope.current = myDate.title;
    }

    /* alert on eventClick */
    $scope.alertOnEventClick = function (date, jsEvent, view) {//ketika event di klik
        if ($scope.displayData == 'schedule') {
            $scope.getScheduleDetail(date.id);
        } else {
            $scope.getEventDetail(date.id);
        }      

    }

    $scope.pathForImage = function (image) {
        if (image === null) {
            return '';
        } else {
            return cordova.file.dataDirectory + image;
        }
    };

    /* Change View */
    $scope.changeView = function (view, calendar) {
        uiCalendarConfig.calendars[calendar].fullCalendar('changeView', view);
        $scope.view = view;
        getDate();
    };

    $scope.today = function () {
        uiCalendarConfig.calendars['myCalendar'].fullCalendar('today');
        $scope.view = 'today';
        getDate();
    };

    $scope.prev = function () {
        uiCalendarConfig.calendars['myCalendar'].fullCalendar('prev');
        getDate();
    };

    $scope.next = function () {
        uiCalendarConfig.calendars['myCalendar'].fullCalendar('next');
        getDate();
    };

    /* event sources array*/
    $scope.eventSources = [personalScheduleData];

    /* config object */
    $scope.uiConfig = {
        calendar: {
            height: 480,
            editable: false,
            eventDurationEditable: false,
           // eventLimit: true,
            header: {
                left: '',
                center: '',
                right: ''

            },
            eventClick: $scope.alertOnEventClick
        }
    };
  
    function refreshScheduleAll() {
        $ionicLoading.show({
            template: '<ion-spinner icon="bubbles"></ion-spinner><br/>Load Schedule...'
        });
        var link = rootLink + 'getAllSchedule.php';
        $http.get(link).then(function (res) {
            if (res.data.length > 0) {
                allScheduleData.splice(0, allScheduleData.length);
                for (var i = 0; i < res.data.length; i++) {
                    var y = moment(res.data[i].StartDate.date).toDate();
                    var z = moment(res.data[i].EndDate.date).toDate();
                    var status = res.data[i].Status;
                    if (res.data[i].CompleteEventID != null) {
                        var complete = true;
                    } else {
                        var complete = false;
                    }

                    var now = new Date();
                    var eventColor = '';
                    switch (status) {
                        case 'C': {
                            eventColor = 'grey';
                            break;
                        }
                        case 'A': {
                            if (complete) {
                                eventColor = 'brown';
                            } else if (now < y) {
                                eventColor = 'green';
                            } else if (now > z) {
                                eventColor = 'red';
                            } else {
                                eventColor = 'blue';
                            }

                            break;
                        }
                        case 'D': {
                            eventColor = 'skyblue';
                            break;
                        }
                        case 'R': {
                            eventColor = 'purple';
                            break;
                        }
                        case 'P': {
                            eventColor = 'orange';
                            break;
                        }
                        
                    }           
                    allScheduleData.push({ id: res.data[i].ScheduleID, title: res.data[i].Title, start: y, end: z, allDay: false, stick: true, color:eventColor  });              
                }
            }
            $ionicLoading.hide();
        }, function (err) {
            alert(JSON.stringify(err));
        });

    }

    function refreshSchedulePersonal() {
        $ionicLoading.show({
            template: '<ion-spinner icon="bubbles"></ion-spinner><br/>Load Personal Schedule...'
        });
        var link = rootLink + 'getSchedule.php';
        $http.post(link, { salesid: $rootScope.userId }).then(function (res) {
            if (res.data.length > 0) {
                personalScheduleData.splice(0, personalScheduleData.length);
                for (var i = 0; i < res.data.length; i++) {
                    var y = moment(res.data[i].StartDate.date).toDate();
                    var z = moment(res.data[i].EndDate.date).toDate();
                    var status = res.data[i].Status;
                    
                    if (res.data[i].CompleteEventID != null) {
                        var complete = true;
                    } else {
                        var complete = false;
                    }
                    
                    var now = new Date();
                    var eventColor = '';
                    switch (status) {
                        case 'C': {
                            eventColor = 'grey';
                            break;
                        }
                        case 'A': {
                            if (complete){
                                eventColor = 'brown';
                            } else if (now < y) {
                                eventColor = 'green';
                            } else if (now > z) {
                                eventColor = 'red';
                             } else {
                                 eventColor = 'blue';
                             }

                            break;
                        }
                        case 'D': {
                            eventColor = 'skyblue';
                            break;
                        }
                        case 'R': {
                            eventColor = 'purple';
                            break;
                        }
                        case 'P': {
                            eventColor = 'orange';
                            break;
                        }

                    }
                    personalScheduleData.push({ id: res.data[i].ScheduleID, title: res.data[i].Title, start: y, end: z, allDay: false, stick: true });           
                }
            } 
            $ionicLoading.hide();
        }, function (err) {
            $ionicLoading.hide();
            alert(JSON.stringify(err));
               
        });
    }

    function refreshEventAll() {
        $ionicLoading.show({
            template: '<ion-spinner icon="bubbles"></ion-spinner><br/>Load Events...'
        });
        var link = rootLink + 'getAllEvent.php';
        $http.get(link).then(function (res) {
            if (res.data.length > 0) {
                allEventData.splice(0, allEventData.length);
                for (var i = 0; i < res.data.length; i++) {
                    var y = moment(res.data[i].CompleteDate.date).toDate();
                    var z = moment(res.data[i].CompleteDate.date).toDate();
                    allEventData.push({ id: res.data[i].EventID, title: res.data[i].EventTitle, start: y, end: z, allDay: false, stick: true });
                }
                $ionicLoading.hide();
            }
        }, function (err) {
            $ionicLoading.hide();
            alert(JSON.stringify(err));
        });

    }

    function refreshEventPersonal() {
        $ionicLoading.show({
            template: '<ion-spinner icon="bubbles"></ion-spinner><br/>Load Personal Events...'
        });
        var link = rootLink + 'getEvent.php';        
        $http.post(link, { salesid: $rootScope.userId }).then(function (res) {
            if (res.data.length > 0) {
                personalEventData.splice(0, personalEventData.length);
                for (var i = 0; i < res.data.length; i++) {
                    var y = moment(res.data[i].CompleteDate.date).toDate();
                    var z = moment(res.data[i].CompleteDate.date).toDate();
                    personalEventData.push({ id: res.data[i].EventID, title: res.data[i].EventTitle, start: y, end: z, allDay: false, stick: true });
                }
                $ionicLoading.hide();
            }
        }, function (err) {
            $ionicLoading.hide();
            alert(JSON.stringify(err));
        });
    }
       
    $scope.changeCalendar = function (view) {  
        $scope.displayCalendar = view;
        changeDisplay();
    }

    $scope.changeData = function (data) {
        $scope.displayData = data;
        changeDisplay();
    }

    function changeDisplay() {
        //$ionicLoading.show({
        //    template: '<ion-spinner icon="bubbles"></ion-spinner><br/>Load Calendar...'
        //});
       // $scope.data.splice(0, $scope.data.length);
        if ($scope.displayData == 'schedule') {
            if ($scope.displayCalendar == 'personal') {
                uiCalendarConfig.calendars['myCalendar'].fullCalendar('removeEventSources');
                uiCalendarConfig.calendars['myCalendar'].fullCalendar('addEventSource', personalScheduleData);
                
            } else {
                uiCalendarConfig.calendars['myCalendar'].fullCalendar('removeEventSources');
                uiCalendarConfig.calendars['myCalendar'].fullCalendar('addEventSource', allScheduleData);
            }
        } else {
            if ($scope.displayCalendar == 'personal') {
                uiCalendarConfig.calendars['myCalendar'].fullCalendar('removeEventSources');
                uiCalendarConfig.calendars['myCalendar'].fullCalendar('addEventSource', personalEventData);
            } else {
                uiCalendarConfig.calendars['myCalendar'].fullCalendar('removeEventSources');
                uiCalendarConfig.calendars['myCalendar'].fullCalendar('addEventSource', allEventData);
            }
        }
    };
    
    $rootScope.$on("RefreshCalendar", function(){
        refreshSchedulePersonal();
        refreshScheduleAll();
        refreshEventPersonal();
        refreshEventAll();
    });

    refreshSchedulePersonal();
    refreshScheduleAll();
    refreshEventPersonal();
    refreshEventAll();
    

    // Create the login modal that we will use later
    $ionicModal.fromTemplateUrl('templates/addSchedule.html', {
        scope: $scope
    }).then(function (modal) {
        $scope.modalAddSchedule = modal;
    });

    $ionicModal.fromTemplateUrl('templates/addEvent.html', {
        scope: $scope
    }).then(function (modal) {
        $scope.modalAddEvent = modal;
    });

    $ionicModal.fromTemplateUrl('templates/addEventSchedule.html', {
        scope: $scope
    }).then(function (modal) {
        $scope.modalAddEventSchedule = modal;
    });

    $ionicModal.fromTemplateUrl('templates/scheduleDetail.html', {
        scope: $scope
    }).then(function (modal) {
        $scope.modalDetailSchedule = modal;
    });

    $ionicModal.fromTemplateUrl('templates/eventDetail.html', {
        scope: $scope
    }).then(function (modal) {
        $scope.modalDetailEvent = modal;
    });
   
    $scope.addSchedule = function () {
        $scope.schedule.splice(0, $scope.schedule.length);
        $scope.modalAddSchedule.show();
    }

    $scope.getScheduleDetail = function (scheduleId) {       //ketika di klik pada button di schedule untuk add event
        $http.post(rootLink + 'getDetailSchedule.php', { scheduleId: scheduleId }).then(function (res) {
            $scope.schedule.scheduleId = scheduleId;
            $scope.schedule.titleEvent = res.data[0].Title;
                       
            $scope.schedule.salesId = res.data[0].AssignToID;
            $scope.schedule.salesName = res.data[0].UserName;
            $scope.schedule.clientId = res.data[0].ClientID;
            $scope.schedule.clientName = res.data[0].ClientName;
            $scope.schedule.entityId = res.data[0].EntityID;
            $scope.schedule.entityName = res.data[0].EntityName;


            $scope.schedule.startEvent = moment(res.data[0].StartDate.date).toDate();
            $scope.schedule.endEvent = moment(res.data[0].EndDate.date).toDate();
            $scope.schedule.description = res.data[0].TaskDescription;
            $scope.schedule.status = res.data[0].Status;
            $scope.schedule.complete = res.data[0].CompleteEventID;

            $scope.schedule.Phone1 = res.data[0].Phone1;
            $scope.schedule.Phone2 = res.data[0].Phone2;
            $scope.schedule.Email1 = res.data[0].Email1;
            $scope.schedule.Email2 = res.data[0].Email2;
            $scope.modalDetailSchedule.show();
        }, function (err) {
            alert(JSON.stringify(err));
        });
        //$http.post(rootLink + 'getDetailSchedule.php', { scheduleId: scheduleId }).then(function (res) {
        //     $scope.schedule.titleEvent = res.data[0].Title;
                       
        //     $scope.schedule.salesId = res.data[0].AssignToID;
        //     $http.post(rootLink + 'getClient.php', { salesid: $scope.schedule.salesId }).then(function (res2) {
                 
        //         if (res2.data.length > 0) {
        //             $scope.client.splice(0, $scope.client.length);
        //             for (var j = 0; j < res2.data.length; j++) {
        //                 $scope.client.push({ clientName: res2.data[j].ClientName, clientId: res2.data[j].ClientID })
        //             }                 
        //             $http.post(rootLink + 'getEntity.php', { clientid: res.data[0].ClientID }).then(function (res3) {
        //                 if (res3.data.length > 0) {
        //                     $scope.entity.splice(0, $scope.entity.length);
        //                     for (var k = 0; k < res3.data.length; k++) {
        //                         $scope.entity.push({ entityName: res3.data[k].EntityName, entityId: res3.data[k].EntityID, phone1: res3.data[k].Phone1, phone2: res3.data[k].Phone2, email1: res3.data[k].Email1, email2: res3.data[k].Email2 })
        //                     }
        //                     $scope.schedule.clientId = res.data[0].ClientID;
        //                     $scope.schedule.entityId = res.data[0].EntityID;

        //                     $scope.schedule.startEvent = moment(res.data[0].StartDate.date).toDate();
        //                     $scope.schedule.endEvent = moment(res.data[0].EndDate.date).toDate();
        //                     $scope.schedule.description = res.data[0].TaskDescription;

        //                     $scope.schedule.ContactPerson = res.data[0].ClientName;
        //                     $scope.schedule.Phone1 = res.data[0].Phone1;
        //                     $scope.schedule.Phone2 = res.data[0].Phone2;
        //                     $scope.schedule.Email1 = res.data[0].Email1;
        //                     $scope.schedule.Email2 = res.data[0].Email2;
        //                     $scope.modalDetailSchedule.show();
        //                 }
        //             }, function (err) {
        //                 alert(JSON.stringify(err));
        //             });
                    
        //         }
        //     }, function (err) {
        //         alert(JSON.stringify(err));
        //     });
     
                
        //    })
    };

    $scope.addEvent = function (id) {
        $scope.event.splice(0, $scope.event.length);
        if (id == -1) {
            $scope.getClient($rootScope.userId);
            $scope.event.scheduleId = null;
            $scope.event.salesId = $rootScope.userId;
            $scope.modalAddEvent.show();
        } else {
            $scope.event.scheduleId = $scope.schedule.scheduleId;
            $scope.event.salesId = $rootScope.userId;
            $scope.event.salesName = $scope.schedule.salesName;
            $scope.event.clientId = $scope.schedule.clientId;
            $scope.event.clientName = $scope.schedule.clientName;
            $scope.event.entityId = $scope.schedule.entityId;
            $scope.event.entityName = $scope.schedule.entityName;
            $scope.event.Phone1 = $scope.schedule.Phone1;
            $scope.event.Phone2 = $scope.schedule.Phone2;
            $scope.event.Email1 = $scope.schedule.Email1;
            $scope.event.Email2 = $scope.schedule.Email2;
            $scope.modalAddEventSchedule.show();
        }
        
    }

    $scope.getEventDetail = function (eventId) {       //ketika di klik pada button di schedule untuk add event
            $http.post(rootLink + 'getDetailEvent.php', { eventid: eventId }).then(function (res) {
                $scope.event.eventTitle = res.data[0].EventTitle;
                $scope.event.salesId = res.data[0].CompleteByID;
                $scope.event.salesName = res.data[0].UserName;
                $scope.event.clientId = res.data[0].ClientID;
                $scope.event.clientName = res.data[0].ClientName;
                $scope.event.entityId = res.data[0].EntityID;
                $scope.event.entityName = res.data[0].EntityName;
                $scope.event.eventDate = moment(res.data[0].CompleteDate.date).toDate();
                $scope.event.comment= res.data[0].Comment;
                $scope.event.Phone1 = res.data[0].Phone1;
                $scope.event.Phone2 = res.data[0].Phone2;
                $scope.event.Email1 = res.data[0].Email1;
                $scope.event.Email2 = res.data[0].Email2;
                $scope.event.lat = res.data[0].GenerateLatitude;
                $scope.event.long = res.data[0].GenerateLongitude;
                $scope.event.imagePath = rootLink + 'upload/' + res.data[0].CapturedImage;
                $scope.modalDetailEvent.show();
            },function(err){
                alert(JSON.stringify(err));
            });
    };

    $scope.event.image = null;
    $scope.event.imagePath = null;
    $scope.takePic = function () {
        var options = {
            quality: 100,
            destinationType: Camera.DestinationType.FILE_URI,
            sourceType: Camera.PictureSourceType.CAMERA,
            allowEdit:true,
            targetHeight: 100,
            targetWidth: 100,
            saveToPhotoAlbum: false
        };

        $cordovaCamera.getPicture(options).then(function (imagePath) {
            // Grab the file name of the photo in the temporary directory
            var currentName = imagePath.replace(/^.*[\\\/]/, '');

            //Create a new name for the photo
            var d = new Date(),
            n = d.getTime(),
            newFileName = n + ".jpg";


            var namePath = imagePath.substr(0, imagePath.lastIndexOf('/') + 1);
            // Move the file to permanent storage
            $cordovaFile.moveFile(namePath, currentName, cordova.file.dataDirectory, newFileName).then(function (success) {
                $scope.event.image = newFileName;
                $scope.event.imagePath = cordova.file.dataDirectory + newFileName;
            }, function (error) {
                $scope.showAlert('Error', error.exception);
            });
        })
    }


    $scope.closeSchedule=function(){
        $scope.schedule.titleEvent = null;
        $scope.schedule.entityId = null;
        $scope.schedule.startEvent = null;
        $scope.schedule.endEvent = null;
        $scope.schedule.description = null;
        $scope.schedule.salesId = null;
        $scope.schedule.clientId = null;
        $scope.schedule.entityId = null;
        $scope.schedule.ContactPerson = null;
        $scope.schedule.Phone1 = null;
        $scope.schedule.Phone2 = null;
        $scope.schedule.Email1 = null;
        $scope.schedule.Email2 = null;
        $scope.modalAddSchedule.hide();
        $scope.modalDetailSchedule.hide();
    }
    
    $scope.closeEvent = function () {
        $scope.event.eventTitle = null;
        $scope.event.entityId = null;
        $scope.event.comment = null;
        $scope.event.clientId = null;
        $scope.event.entityId = null;
        $scope.event.ContactPerson = null;
        $scope.event.Phone1 = null;
        $scope.event.Phone2 = null;
        $scope.event.Email1 = null;
        $scope.event.Email2 = null;
        $scope.event.image = null;
        $scope.event.imagePath = null;
        $scope.modalAddEvent.hide();
        $scope.modalAddEventSchedule.hide();
        $scope.modalDetailEvent.hide();
        $scope.modalDetailSchedule.hide();
    }

    $scope.saveSchedule = function () { //trigger ketika di add events pada calender
        $ionicLoading.show({
            template: '<ion-spinner icon="bubbles"></ion-spinner><br/>Saving Data!'
        });
            var link = rootLink + 'saveSchedule.php';
            var startDate = moment($scope.schedule.startEvent).format('YYYY-MM-DD HH:mm');
            var endDate = moment($scope.schedule.endEvent).format('YYYY-MM-DD HH:mm');
            var nowDate = moment(new Date()).format('YYYY-MM-DD HH:mm');
            if ($scope.schedule.salesId==null || $scope.schedule.salesId=='' || $scope.schedule.salesId==undefined) {
                $scope.schedule.status = 'P';
            } else {
                $scope.schedule.status = 'A';
            }
            $http.post(link, { entityId: $scope.schedule.entityId, dist: 'null', assign: $scope.schedule.salesId, assignByID: $rootScope.userId, title: $scope.schedule.titleEvent, status: $scope.schedule.status, desc: $scope.schedule.description, startDate: startDate, endDate: endDate, assignDate: nowDate }).then(function (res) {

                if (res.data.status == "1") {
                    refreshSchedulePersonal();
                    refreshScheduleAll();
                    $ionicLoading.hide();
                    $scope.closeSchedule();
                    $cordovaToast.show('Data has been Saved', 'long', 'center');   
                }
                else {
                    $ionicLoading.hide();
                    alert(JSON.stringify(res));
                }
            }, function (err) {
                $ionicLoading.hide();
                alert(JSON.stringify(err));
            });
        

    };

    $scope.saveEvent = function () { //trigger ketika di add events pada calender

        $ionicLoading.show({
            template: '<ion-spinner icon="bubbles"></ion-spinner><br/>Saving Data!'
        });
            var url = rootLink + 'upload.php';
            var transOptions = {
                fileKey: "file",
                fileName: $scope.event.image,
                chunkedMode: false,
                mimeType: "image/jpg",
                params: { 'directory': 'upload', 'fileName': $scope.event.image }
            };
            $cordovaFileTransfer.upload(url, $scope.event.imagePath, transOptions).then(function (result) {
                $cordovaGeolocation.getCurrentPosition(posOptions).then(function (position) {
                    var lat = position.coords.latitude;
                    var long = position.coords.longitude;
                    var link = rootLink + 'saveEvent.php';
                    var nowDate = moment(new Date()).format('YYYY-MM-DD HH:mm');
                    $http.post(link, {
                        title: $scope.event.eventTitle,
                        entityId: $scope.event.entityId,
                        comment: $scope.event.comment,
                        capturedImage: $scope.event.image,
                        lat: lat,
                        long: long,
                        completeById: $rootScope.userId,
                        completeDate: nowDate,
                        scheduleId:$scope.event.scheduleId
                    }).then(function (res) {
                        if (res.data.status == "1") {
                            //$rootScope.events.splice(0, $rootScope.events.length);
                            $scope.closeEvent();
                            //changeDisplay();
                            refreshEventPersonal();
                            refreshEventAll();
                            $ionicLoading.hide();
                            $cordovaToast.show('New Event has been saved', 'short', 'center');
                            $scope.modalAddEvent.hide();
                        } else {
                            $ionicLoading.hide();
                            alert(JSON.stringify(res));
                        }

                    }, function (err) {
                        $ionicLoading.hide();
                        alert(JSON.stringify(err));
                    });

                })
            }, function (error) { alert(JSON.stringify(error)) });

            var posOptions = {
                enableHighAccuracy: true,
                timeout: 20000,
                maximumAge: 0
            };
            
        
    };

    $scope.delegate = function () {
        var delegatePopup = $ionicPopup.confirm({
            title: 'Delegate Schedule',
            subTitle:'Delegate To :',
            scope: $scope,
            template: '<span class="item addTitleEvent item-input item-select item-floating-label"> \
                        <span>Sales</span> \
                        <select ng-model="schedule.newSalesId"> \
                            <option ng-repeat="item in sales" ng-value="{{item.userid}}"> \
                                {{item.salesName}} \
                            </option> \
                        </select> </span>'
        });

        delegatePopup.then(function (res) {
            if (res) {
                $http.post(rootLink + 'delegate.php', { toId:$scope.schedule.newSalesId,fromId:$scope.schedule.salesId,scheduleId: $scope.schedule.scheduleId }).then(function (res) {
                    if (res.data.status == "1") {
                        $scope.schedule.salesId = $scope.schedule.newSalesId;
                        $scope.schedule.newSalesId = null;
                        $cordovaToast.show('Schedule has been delegated', 'short', 'center');
                        changeDisplay();
                        $scope.modalDetailSchedule.hide();
                    } else {
                        alert(JSON.stringify(res));
                    }
                }, function (err) {
                    alert(JSON.stringify(err));
                });
            } else {
                $scope.schedule.newSalesId = null;
            }
        });
    }

    $scope.cancelSchedule = function () {
        var cancelPopup = $ionicPopup.confirm({
            title: 'Cancel Schedule',
            template: 'Are you sure you want to cancel this schedule?'
        });

        cancelPopup.then(function (res) {
            if (res) {
                $http.post(rootLink + 'cancelSchedule.php', { scheduleId:$scope.schedule.scheduleId  }).then(function (res) {
                    if (res.data.status == "1") {
                        $cordovaToast.show('Schedule has been cancel', 'short', 'center');
                        changeDisplay();
                        $scope.modalDetailSchedule.hide();
                    } else {
                        alert(JSON.stringify(res));
                    }
                }, function (err) {
                    alert(JSON.stringify(err));
                });
            } 
        });
    }

    $scope.reSchedule = function () {
        var reSchedulePopup = $ionicPopup.confirm({
            title: 'Reschedule',
            scope: $scope,
            template: '<span class="item addTitleEvent item-input item-floating-label"> \
                        <span>Start Event</span> \
                        <input type="datetime-local" ng-model="schedule.startEvent" id="timedatestart"> \
                    </span> \
                    <hr /> \
                    <span class="item addTitleEvent item-input item-floating-label"> \
                        <span>End Event</span> \
                        <input type="datetime-local" ng-model="schedule.endEvent" id="timedateend"> \
                    </span> \
                    <hr />'
        });

        reSchedulePopup.then(function (res) {
            if (res) {
                $http.post(rootLink + 'reschedule.php', { startDate: $scope.schedule.startEvent, endDate: $scope.schedule.endEvent, scheduleId: $scope.schedule.scheduleId }).then(function (res) {
                    if (res.data.status == "1") {
                        $scope.schedule.salesId = $scope.schedule.newSalesId;
                        $scope.schedule.newSalesId = null;
                        $cordovaToast.show('Schedule has been reschedule', 'short', 'center');
                        changeDisplay();
                         $scope.modalDetailSchedule.hide();
                    } else {
                        alert(JSON.stringify(res));
                    }
                }, function (err) {
                    alert(JSON.stringify(err));
                });
            } else {
                $scope.schedule.newSalesId = null;
            }
        });
    }
      
    $http.post(rootLink + 'getSales.php', {userid:$rootScope.userId}).then(function (res) {
        $scope.sales = [];
       // $scope.sales.splice(0, $scope.sales.length);
            if (res.data.length > 0) {
                for (var i = 0; i < res.data.length; i++) {
                    $scope.sales.push({ salesName: res.data[i].Username, userid:res.data[i].UserID})
                }
            }
        }, function (err) {
            alert(JSON.stringify(err));
        });

    $scope.getClient = function (salesId) {
        $scope.client.splice(0, $scope.client.length);
        $http.post(rootLink + 'getClient.php', { salesid: salesId }).then(function (res) {
            $scope.client = [];
            if (res.data.length > 0) {
                for (var i = 0; i < res.data.length; i++) {
                    $scope.client.push({ clientName: res.data[i].ClientName, clientId: res.data[i].ClientID })
                }
            }
        }, function (err) {
            alert(JSON.stringify(err));
        });

    };

    $scope.getEntity = function (clientId) {
            $http.post(rootLink + 'getEntity.php', { clientid: clientId }).then(function (res) {
                if (res.data.length > 0) {
                    $scope.entity.splice(0, $scope.entity.length);
                    for (var i = 0; i < res.data.length; i++) {
                        $scope.entity.push({ entityName: res.data[i].EntityName, entityId: res.data[i].EntityID, phone1: res.data[i].Phone1, phone2: res.data[i].Phone2, email1: res.data[i].Email1, email2: res.data[i].Email2 })
                    }
                }
            }, function (err) {
                alert(JSON.stringify(err));
            });

        }

    $scope.getEntityDetail = function (entityId,isSchedule) {
        if (isSchedule) {
            var indexEntity = $scope.entity.findIndex(x=> x.entityId == $scope.schedule.entityId);
            $scope.schedule.ContactPerson = $scope.entity[indexEntity].entityName;
            $scope.schedule.Phone1 = $scope.entity[indexEntity].phone1;
            $scope.schedule.Phone2 = $scope.entity[indexEntity].phone2;
            $scope.schedule.Email1 = $scope.entity[indexEntity].email1;
            $scope.schedule.Email2 = $scope.entity[indexEntity].email2;
        } else {
            var indexEntity = $scope.entity.findIndex(x=> x.entityId == $scope.event.entityId);
            $scope.event.ContactPerson = $scope.entity[indexEntity].entityName;
            $scope.event.Phone1 = $scope.entity[indexEntity].phone1;
            $scope.event.Phone2 = $scope.entity[indexEntity].phone2;
            $scope.event.Email1 = $scope.entity[indexEntity].email1;
            $scope.event.Email2 = $scope.entity[indexEntity].email2;
        }
    }

    $scope.shownGroup = 0;
       $scope.setActive = function (type) {
           $scope.active = type;
       };
       $scope.isActive = function (type) {
           return type === $scope.active;
       };

       $scope.toggleGroup = function (group) {
           if ($scope.isGroupShown(group)) {
               $scope.shownGroup = null;
           } else {
               $scope.shownGroup = group;
           }
       };
       $scope.isGroupShown = function (group) {
           return $scope.shownGroup === group;
       };
    
       
});


