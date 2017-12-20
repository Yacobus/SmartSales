// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.controllers' is found in controllers.js
var db = null;
//var linkroot = 'http://192.168.43.43:8080/sales/webresources/';
//var rootLink = 'http://192.168.43.163/schedule/rest/';
var rootLink = 'http://116.254.100.222:8888/rest/';

angular.module('starter', ['ionic', 'starter.controllers', 'starter.routes', 'ngCordova', 'ui.calendar', 'ion-floating-menu', 'angular-md5'])

.run(function ($ionicPlatform, $cordovaSQLite, $ionicPopup) {
    $ionicPlatform.ready(function () {
        // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
        // for form inputs)
        if (cordova.platformId === "ios" && window.cordova && window.cordova.plugins.Keyboard) {
            cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
            cordova.plugins.Keyboard.disableScroll(true);

        }
        if (window.StatusBar) {
            // org.apache.cordova.statusbar required
            StatusBar.styleDefault();
        }



        $ionicPlatform.registerBackButtonAction(function (event) {
            if (true) { // your check here
                $ionicPopup.confirm({
                    title: 'System warning',
                    template: '<label style="text-align:center">are you sure you want to exit?</label>'
                }).then(function (res) {
                    if (res) {
                        ionic.Platform.exitApp();
                    }
                })
            }
        }, 100);


        db = $cordovaSQLite.openDB({ name: "SAIL.db", location: 'default' });
        //$cordovaSQLite.execute(db, 'CREATE TABLE IF NOT EXISTS userSales (username TEXT PRIMARY KEY, password TEXT, name TEXT)');
        //$cordovaSQLite.execute(db, 'CREATE TABLE IF NOT EXISTS eventSales (eventid INTEGER PRIMARY KEY AUTOINCREMENT, titleEvent TEXT, startEvent TEXT, endEvent TEXT, username TEXT, tanggalRespon TEXT, commentRespon TEXT, latitude1 TEXT, longitude1 TEXT, latitude2 TEXT, longitude2 TEXT, imagePath TEXT DEFAULT "img/profile.png")');
        $cordovaSQLite.execute(db, 'CREATE TABLE IF NOT EXISTS LogSession (UserID INTEGER, Username TEXT,Fullname TEXT, DelegateTask TEXT, UpdateSchedule TEXT, IsLogin TEXT,LogTime TEXT)').then(function () {
            $cordovaSQLite.execute(db, 'INSERT INTO LogSession (UserID, Username,Fullname, UpdateSchedule, DelegateTask, IsLogin,LogTime) VALUES(?,?,?,?,?,?,?)', [1, 'NoName', 'NoName', '0', '0', '0','0-0-0']);
        });

        $cordovaSQLite.execute(db, 'CREATE TABLE IF NOT EXISTS Singchronize(SnzTime TEXT)');
        $cordovaSQLite.execute(db, 'CREATE TABLE IF NOT EXISTS Schedule (ScheduleID INTEGER,Title TEXT,EntityID INTEGER,StartDate TEXT,EndDate TEXT,\
                                    TaskDescription TEXT,AssignToID INTEGER,CompleteEventID INTEGER,DistributeFromID INTEGER,Status TEXT,AssignByID INTEGER,AssignDate TEXT)');
        $cordovaSQLite.execute(db, 'CREATE TABLE IF NOT EXISTS Event (EventID INTEGER,EventTitle TEXT,EntityID INTEGER,Comment TEXT,CapturedImage TEXT,\
                                    GenerateLatitude TEXT,GenerateLongitude TEXT,CompleteByID INTEGER,CompleteDate TEXT,UpdateByID INTEGER,UpdateDate TEXT,\
                                    DeleteByID INTEGER,DeleteDate TEXT)');
        $cordovaSQLite.execute(db, 'CREATE TABLE IF NOT EXISTS Entity (EntityID INTEGER,ClientID INTEGER,EntityName TEXT,Description TEXT, Email1 TEXT,Email2 TEXT,\
                                    Phone1 TEXT,Phone2 TEXT,CreateByID INTEGER,CreateDate TEXT,UpdateByID INTEGER, UpdateDate TEXT,DeleteByID INTEGER, DeleteDate TEXT)');
        $cordovaSQLite.execute(db, 'CREATE TABLE IF NOT EXISTS Clients (ClientID INTEGER,ClientName TEXT,Description TEXT,Address TEXT,Phone1 TEXT,Phone2 TEXT,Latitude TEXT,Longitude TEXT,\
                                    CreateByID INTEGER,CreateDate TEXT,UpdateByID INTEGER, UpdateDate TEXT,DeleteByID INTEGER, DeleteDate TEXT)');
        $cordovaSQLite.execute(db, 'CREATE TABLE IF NOT EXISTS Account (AccountID INTEGER,UserID INTEGER,ClientID INTEGER,AssignByID INTEGER,AssignDate TEXT,DeleteByID INTEGER,DeleteDate TEXT)');

                
            
         
    });
});




