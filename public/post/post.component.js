(function() {
  angular.module('app')
    .component('post', {
      controller: controller,
      bindings: {
        'bSignedin': '<'
      },
      template: `
      <ng-include src="'./post/post.template.html'"></ng-include>
      `
    })

    //this is used because it is called when the canvas is available in dom,
    //so then it becomes possible to call $ctrl.genBox(box, canvas),
    //as genBox() needs a canvas element in the dom to work.
    .directive('canvasInit', function() {
      return {
        template: `
          <canvas class="canvas-style">
          </canvas>
        `,
        link: function($scope, element, attrs) {
          let canvas = element.find('canvas')[0];

          $scope.$watch('box', function(newValue, oldValue) {
            $scope.$parent.$ctrl.genBox(newValue, canvas)
          });

          //needed for materialize modal stuff to work
          $(document).ready(function() {
            $('.modal').modal();
          });

          //style ui-view under body to fill up whole body
          $("#body-ui").css("height", "100%");
        },
      }
    })
    .directive('paginator', function() {
      return {
        template: `
          <ul id="pgn-ul" ng-if="$ctrl.numPages > 1" class="pagination">
            <li ng-click="$ctrl.pageLeft($ctrl.updateService.iPage)" ng-class="{disabled: $ctrl.updateService.iPage===(0)}" class="waves-effect"><a><i class="material-icons">chevron_left</i></a></li>

            <li ng-repeat="i in [].constructor($ctrl.numPages) track by $index" class="waves-effect"
              ng-class="{active: $ctrl.updateService.iPage === $index}" ng-click="$ctrl.loadPage($index)">
              <a>{{$index+1}}</a>
            </li>

            <li ng-click="$ctrl.pageRight($ctrl.updateService.iPage)" ng-class="{disabled: $ctrl.updateService.iPage === ($ctrl.numPages - 1)}" class="waves-effect"><a><i class="material-icons">chevron_right</i></a></li>
          </ul>
          `
      }
    });



  controller.$inject = ['$state', '$http', 'authService', 'updateService', '$scope'];

  function controller($state, $http, authService, updateService, $scope) {

    const vm = this

    $scope.$on('authChange', function(e, obj) {
      vm.getBoxes()
    })

    vm.updateService = updateService

    //this value is used by edit.component.js to determine if a box is being updated or created new
    updateService.box = null;

    vm.formMode = "signin"
    vm.loginMode = "siginedout"

    vm.$onInit = function() {

      vm.numPages = null;
      vm.prevNumPages = null;
      vm.curBoxes = [];

      //populate vm.allBoxes and get page from getBoxes.then
      vm.numItems = 6;
      vm.getBoxes()
    }

    vm.pageLeft = function(iPage) {
      if (iPage > 0) {
        vm.loadPage(iPage - 1)
      }
    }
    vm.pageRight = function(iPage) {
      if (iPage < vm.numPages - 1) {
        vm.loadPage(iPage + 1)
      }
    }


    vm.loadPage = function(iPage) {
      updateService.iPage = iPage

      let i;
      const newBoxes = [];
      for (i = 0; i < vm.numItems; i++) {
        if (vm.allBoxes[i + (vm.numItems * iPage)] !== undefined) {
          newBoxes.push(vm.allBoxes[(iPage * vm.numItems) + i]);
        }
      }

      vm.curBoxes = newBoxes;
    }

    //generate box from parameters from box description from database
    vm.genBox = function(box, canvas) {

      let curCanvas = canvas //document.getElementById("editCanvas");

      let engine = new BABYLON.Engine(canvas, true);

      let scene = new BABYLON.Scene(engine);

      scene.clearColor = new BABYLON.Color3(1, 1, 1);

      let camera = new BABYLON.ArcRotateCamera("ArcRotateCamera", 1, 1, 120, new BABYLON.Vector3.Zero(), scene);
      camera.setPosition(new BABYLON.Vector3(50, 50, -100));

      var light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(-50, 100, 0), scene);

      light.intensity = 1.0;

      var boxOptions = {
        // size: number,
        width: box.width,
        height: box.height,
        depth: box.depth,
        // faceUV: Vector4[],
        // faceColors: Color4[],
        // sideOrientation: number,
        // frontUVs: Vector4,
        // backUVs: Vector4,
        updatable: true
      };

      let box01 = BABYLON.MeshBuilder.CreateBox("box01", boxOptions, scene)

      var materialSnarf = new BABYLON.StandardMaterial("snarf", scene);

      materialSnarf.diffuseColor = new BABYLON.Color3(1.0, 1.0, 1.0);

      materialSnarf.alpha = 0.5;

      box01.material = materialSnarf;

      box01.position.x = 0;
      box01.position.y = 0;
      box01.position.z = 0;

      engine.runRenderLoop(function() {
        box01.rotation.x += .0025
        box01.rotation.y += .0025
        box01.rotation.z += .0025
        scene.render();
      });
    }

    vm.getBoxes = function(typeOp = updateService.typeOp) {

      //load up all the boxes to front end but do not render them.
      //rendering will be front-end paginated
      $http.get('/api/boxes')
        .then(function(response) {
          vm.allBoxes = response.data

          console.log(response.data)

          //update paginator if total num of boxes exceeds fitting on one page
          vm.numPages = Math.ceil(vm.allBoxes.length / vm.numItems)

          //load whatever page needs to be loaded (0 defualt)
          switch (typeOp) {
            case "init":
              vm.loadPage(updateService.iPage)
              break;
            case "editAdd":
              if (updateService.prevAllBoxesLen === vm.allBoxes.length) {
                vm.loadPage(updateService.iPage)
              } else {
                updateService.iPage = (vm.numPages - 1)
                vm.loadPage(updateService.iPage)
              }
              break;
            case "del":
              if ((vm.allBoxes.length + 1) - (updateService.iPage * vm.numItems) === 1) {
                updateService.iPage = (updateService.iPage - 1)
                vm.loadPage(updateService.iPage)
              } else {
                vm.loadPage(updateService.iPage)
              }
              break;
          }

          updateService.prevAllBoxesLen = vm.allBoxes.length
        })
    }

    vm.launchEditor = function() {

      //check if user is logged in
      $http.get('/api/users/auth')
        .then(function(response) {
          $state.go('edit')
        })
        .catch(function(response) {
          $('#modal-auth').modal('open')
        })
    }

    vm.update = function(box) {
      updateService.box = box
      $state.go('edit')
    }

    vm.delete = function(box) {
      $http.delete('/api/boxes/' + box.id)
        .then(function() {
          updateService.typeOp = "del"
          vm.getBoxes()
        })
        .catch(function() {
          console.log("post.component.js get fail")
        })
    }

  }
}());
