(function() {
  'use strict';

  angular.module('app').config(config)
    .service('authService', authService)
    .service('updateService', updateService)

  config.$inject = ['$stateProvider', '$urlRouterProvider', '$locationProvider']

  function config($stateProvider, $urlRouterProvider, $locationProvider) {

    $locationProvider.html5Mode(true)

    $stateProvider
      .state({
        name: 'nav',
        abstract: true,
        component: 'navbar',
      })
      .state({
        name: 'posts',
        url: '/',
        parent: 'nav',
        component: 'post'
      })
      .state({
        name: 'edit',
        url: '/edit',
        parent: 'nav',
        component: 'edit'
      })
  }

  function updateService() {

    const vm = this;
    vm.iPage = 0;
    vm.prevAllBoxesLen=0;
    vm.currentTarget = undefined;

    // these are used to track which page paginator goes to after user operation
    vm.typeOp = "init" //addEdit, del

    // this value assigned from post component, selected box to edit
    vm.box = null;
  }

  authService.$inject = ['$http'];
  function authService($http) {

    const vm = this;

    vm.formEvent = null;


    // vm.formMode = "signin"
    vm.username = null;
    vm.password = null;

    //gets set from two possible sources:
    //  1) formSubmitSignin response: (typically, when user comes to site, signed out)
    //  2) usrs /auth route, when user comes to site signed in
    //check if user logged in (token valid)
    vm.username = null;
    $http.get('/api/users/auth')
      .then(function(response) {
        vm.username = response.data;
      })
      .catch(function(response) {
        vm.loginMode = "signedout"
        vm.formMode = "signin"
      })

    vm.formSubmit = function(username, password, formMode) {

      vm.formMode=formMode

      let data = {
        username: username,
        password: password
      }

      if (formMode === "signin") {
        //needs to return even though sign in returns no values, just to conform to promise in component that needs val returned from signup
        return vm.formSubmitSignin(data);
      }

      if (formMode === "signup") {
        //this one is returned bc return val to component controller method determines ng-if visability.
        vm.formEvent = 'signupreq'
        return vm.formSubmitSignup(data);
      }
    }

    vm.formSubmitSignin = function(data) {
      //verify submitted login
      return $http.post('/api/users/signin', data)
        //200s go here
        .then(function success(response) {

          vm.username = response.username;

          $('#modal-auth').modal('close');
          return {success: true, formMode: 'signin', loginMode: 'signedin', formMessage: 'sigininsuc'}
        })
        //others go here
        .catch(function error(response) {
          throw {success: false, formMode: 'signin', loginMode: 'signedout', formMessage: 'signinfail'}
        })
    }

    vm.formSubmitSignup = function(data) {
      //verify submitted login
      return $http.post('/api/users/signup', data)
        //200s go here
        .then(function success(response) {
          console.log("form signup success")
          vm.formEvent = null;
          console.log(response.data)
          console.log(vm.formMode)
          return {success: true, formMode: 'signin', loginMode: 'signedout', formMessage: 'signupsuc'};
        })
        //others go here
        .catch(function error(response) {
          console.log("form signup fail")
          console.log(response)

          throw {success: false, formMessage: 'signuperr'}//return false;
          //status code in response.status
          //status message in response.data
        })
    }
  };


}());
