(function() {
  angular.module('app')
    .component('navbar', {
      controller: controller,
      template: `
      <header>
        <div class="navbar-fixed">
          <nav>
            <div class="nav-wrapper">
              <a ui-sref="posts" class="brand-logo left">boxEZ</a>
              <!--<ul id="nav-mobile" class="right hide-on-med-and-down">-->
              <ul class="right">
                <li>
                  <a ng-if="$ctrl.loginMode=='signedout'" ng-click="$ctrl.openAuthModal()">Sign in</a>
                  <a ng-if="$ctrl.loginMode=='signedin'" ng-click="$ctrl.signOut()">Sign out</a>
                </li>
              </ul>
            </div>
          </nav>
        </div>
      </header>
      <main>
        <div class="container" style="transform: translate(0,0); height: 100%">
          <ui-view></ui-view>
        </div>
      </main>

      <ng-include src="'./modals/auth.template.html'" modal-init></ng-include>
      `
    })
    .directive('modalInit', function() {
      return {
        link: function($scope, element, attrs) {
          $(document).ready(function() {
            $('.modal').modal();
          });
        }
      }
    });

  controller.$inject = ['$state', '$http', 'authService', '$scope'];

  function controller($state, $http, authService, $scope) {

    const vm = this

    vm.user = null;
    vm.password = null;

    vm.$onInit = function() {
      vm.bSignedin = false;

      //check if user logged in
      $http.get('/api/users/auth')
        .then(function(response) {
          vm.loginMode = "signedin"

        })
        .catch(function(response) {
          vm.loginMode = "signedout"
          vm.formMode = "signin"
        })
    }
    vm.openAuthModal = function() {
      $('#modal-auth').modal('open')
    }
    vm.signOut = function() {
      $http.delete('/api/users/auth')
        .then(function(response) {
          vm.formMode = "signin"
          vm.loginMode = "signedout"
          $scope.$broadcast('authChange', { message: "msg" });

        })
        .catch(function(response) {
          alert(response.data)
        })
    }

    vm.clearInputs = function () {
        vm.formMessage=null;
        vm.user = null;
        vm.password = null;
        $('#user').removeClass('active')
        $('#password').removeClass('active')
    }

    vm.formSubmit = function() {
      authService.formSubmit(vm.user, vm.password, vm.formMode)
        .then(function(response) {
          if (response.success === true) {

            $scope.$broadcast('authChange', { message: "msg" });

            //happens when sign in or signup succeeds
            vm.formMode = response.formMode;
            vm.loginMode = response.loginMode;
            vm.formMessage = response.formMessage;
            if(vm.formMessage == 'sigininsuc') { vm.clearInputs(); vm.bSignedin = true; }

          }
        })
        .catch(function(response) {
          vm.formMessage = response.formMessage;
        })
    }

  }

}());
