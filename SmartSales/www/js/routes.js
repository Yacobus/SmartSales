angular.module('starter.routes', [])

.config(function($stateProvider, $urlRouterProvider) {
    $stateProvider

         .state('login', {
             url: '/login',
             templateUrl: 'templates/login.html',
             controller: "LoginCtrl"
         })

       .state('register', {
           url: '/register',
           templateUrl: 'templates/register.html',
           controller: "RegisterCtrl"
       })


      .state('app', {
          url: "/app",
          abstract: true,
          templateUrl: 'templates/menu.html',
          controller: 'AppCtrl'
      })
	
	 .state('app.schedule', {
            url: '/schedule',
            views: {
                'menuContent': {
                    templateUrl: 'templates/schedule.html',
                    controller: 'ScheduleCtrl'
                }
            }
	 })

    .state('app.notification', {
        url: '/notification',
        views: {
            'menuContent': {
                templateUrl: 'templates/notification.html',
                controller: 'NotificationCtrl'
            }
        }
    })

    // if none of the above states are matched, use this as the fallback
    $urlRouterProvider.otherwise('/login');
});
