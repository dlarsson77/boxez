(function() {
  angular.module('app')
    .component('edit', {
      controller: controller,
      template: `
<div class="row">

  <div style="display: flex; flex-direction: column; align-items: center">
      <canvas id="editCanvas" class="edit-canvas"></canvas>

    <div style="display: relative; width: 500px">
      <div style="display: flex; flex-direction: row; align-items: center">
      <a ng-class="{ctrlactive: $ctrl.controlMode === 'rotate'}" ng-click="$ctrl.actionOrbit()" style="margin-left: auto; margin-right: auto; margin-bottom: 25px" class="btn-floating btn-large waves-effect waves-light custom"><i class="material-icons">3d_rotation</i></a>

      <a ng-click="$ctrl.actionSubmit()" style="margin: 0" class="btn-floating btn-large waves-effect waves-light red"><i class="material-icons">send</i></a>

      <a ng-class="{ctrlactive: $ctrl.controlMode === 'edit'}" ng-click="$ctrl.actionMove()" style="margin-left: auto; margin-right: auto; margin-bottom: 25px" class="btn-floating btn-large waves-effect waves-light custom"><i class="material-icons">edit</i></a>
      </div>
    </div>
  </div>

</div>
      `
    })

  controller.$inject = ['$state', '$http', 'authService', 'updateService'];

  function controller($state, $http, authService, updateService) {
    const vm = this

    vm.$onInit = function() {

      vm.controlMode = "rotate"; //toggle rotate to edit on button colors

      if (updateService.box !== null) {
        console.log("updateService.box not null")
        vm.genBox(updateService.box)
      } else {
        vm.genBox({
          width: 25,
          height: 25,
          depth: 25
        })
      }

    }

    vm.genBox = function(box) {

      vm.canvas = document.getElementById("editCanvas");
      console.log(vm.canvas)
      vm.engine = new BABYLON.Engine(vm.canvas, true);

      vm.scene = new BABYLON.Scene(vm.engine);

      vm.scene.clearColor = new BABYLON.Color3(1, 1, 1);

      vm.camera = new BABYLON.ArcRotateCamera("ArcRotateCamera", 1, 1, 120, new BABYLON.Vector3.Zero(), vm.scene);
      vm.camera.setPosition(new BABYLON.Vector3(50, 50, -100));

      // This attaches the camera to the canvas
      vm.camera.attachControl(vm.canvas, false);

      var light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(-50, 100, 0), vm.scene);

      light.intensity = 1.0;

      var sphere0 = BABYLON.Mesh.CreateSphere("sphere1", 16, 2, vm.scene);
      var sphereX = BABYLON.Mesh.CreateSphere("sphere1", 16, 2, vm.scene);
      var sphereY = BABYLON.Mesh.CreateSphere("sphere1", 16, 2, vm.scene);
      var sphereZ = BABYLON.Mesh.CreateSphere("sphere1", 16, 2, vm.scene);

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

      vm.box01 = BABYLON.MeshBuilder.CreateBox("box01", boxOptions, vm.scene)

      var materialSnarf = new BABYLON.StandardMaterial("snarf", vm.scene);

      var materialTestX = new BABYLON.StandardMaterial("testX", vm.scene);
      var materialTestY = new BABYLON.StandardMaterial("testY", vm.scene);
      var materialTestZ = new BABYLON.StandardMaterial("testZ", vm.scene);

      materialSnarf.diffuseColor = new BABYLON.Color3(1.0, 1.0, 1.0);

      materialTestX.diffuseColor = new BABYLON.Color3(1.0, 0.0, 0.0);
      materialTestY.diffuseColor = new BABYLON.Color3(0.0, 1.0, 0.0);
      materialTestZ.diffuseColor = new BABYLON.Color3(0.0, 0.0, 1.0);

      materialSnarf.alpha = 0.5;

      vm.box01.material = materialSnarf;

      sphereX.material = materialTestX;
      sphereY.material = materialTestY;
      sphereZ.material = materialTestZ;

      vm.box01.position.x = 0;
      vm.box01.position.y = 0;
      vm.box01.position.z = 0;

      sphere0.position.x = 0;
      sphere0.position.y = 0;
      sphere0.position.z = 0;

      sphereX.position.x = 10;
      sphereX.position.y = 0;
      sphereX.position.z = 0;

      sphereY.position.x = 0;
      sphereY.position.y = 10;
      sphereY.position.z = 0;

      sphereZ.position.x = 0;
      sphereZ.position.y = 0;
      sphereZ.position.z = 10;

      vm.engine.runRenderLoop(function() {
        vm.scene.render();
      });

    }

    vm.actionMove = function() {
      console.log("edit")
      vm.controlMode = "edit";
      /*
      uses an actionmanager on the box mesh to wait for a click.

      click generates a "helper plane" and registers an observer (observer2) on the scene
      to watch for mouse pointer over it. epending on face clicked on,
      coordinate to drag faces to with mouse move is received from position return from helper plane observer.
      will also check for mouse-up to end action.

      a canvas listener clears listens for pointer-off-canvas to turn off move-mode until next click.
      */

      // credit to the internet for this isEquivalent helper function
      function isEquivalent(a, b) {
        // Create arrays of property names
        var aProps = Object.getOwnPropertyNames(a);
        var bProps = Object.getOwnPropertyNames(b);

        // If number of properties is different,
        // objects are not equivalent
        if (aProps.length != bProps.length) {
          return false;
        }

        for (var i = 0; i < aProps.length; i++) {
          var propName = aProps[i];

          // If values of same property are not equal,
          // objects are not equivalent
          if (a[propName] !== b[propName]) {
            return false;
          }
        }

        // If we made it this far, objects
        // are considered equivalent
        return true;
      }

      //register action on test mesh
      vm.box01.actionManager = new BABYLON.ActionManager(vm.scene);
      var normals = vm.box01.getVerticesData(BABYLON.VertexBuffer.NormalKind);
      var vertices = vm.box01.getVerticesData(BABYLON.VertexBuffer.PositionKind);
      console.log(normals)

      //setup push/pull index-into-vertexbuffer for each side of box01
      var vertsLeft = [];
      var vertsRight = [];
      var vertsBack = [];
      var vertsFront = [];
      var vertsTop = [];
      var vertsBottom = [];

      let i;

      var vertsToMove = [];

      //x
      for (i = 0; i < vertices.length; i += 3) {
        if (Math.sign(vertices[i]) === 1) {
          vertsLeft.push(i)
        }
      }
      for (i = 0; i < vertices.length; i += 3) {
        if (Math.sign(vertices[i]) === -1) {
          vertsRight.push(i)
        }
      }
      //y
      for (i = 1; i < vertices.length; i += 3) {
        if (Math.sign(vertices[i]) === 1) {
          vertsTop.push(i)
        }
      }
      for (i = 1; i < vertices.length; i += 3) {
        if (Math.sign(vertices[i]) === -1) {
          vertsBottom.push(i)
        }
      }
      //z
      for (i = 2; i < vertices.length; i += 3) {
        if (Math.sign(vertices[i]) === 1) {
          vertsFront.push(i)
        }
      }
      for (i = 2; i < vertices.length; i += 3) {
        if (Math.sign(vertices[i]) === -1) {
          vertsBack.push(i)
        }
      }

      //box has been clicked on
      //so register an action to it that:
      //creates helper plane with action assigned
      vm.box01.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickDownTrigger,
        function(event) {
          //get location clicked on, so we know where to create helper plane
          let pickedObj = vm.scene.pick(event.pointerX, event.pointerY);
          let v3PickedNormal = vm.scene.pick(event.pointerX, event.pointerY).getNormal();
          let v3PickedWorldCoord = vm.scene.pick(event.pointerX, event.pointerY).pickedPoint;
          console.log("check this: ", v3PickedWorldCoord)
          let prevPickedPoint = v3PickedWorldCoord;
          // let pickedFaceId = scene.pick(event.pointerX, event.pointerY).faceId;
          console.log(pickedObj)

          //freeze camera
          vm.camera.detachControl(vm.canvas)

          //set box to not pickable bc we want to get pick location of helper plane instead
          // vm.box01.isPickable = true;

          //create helper plane
          var planeHelper = BABYLON.Mesh.CreatePlane("plane", 200.0, vm.scene, false, BABYLON.Mesh.DOUBLESIDE);

          planeHelper.isVisible = false;

          function positionHelperPlane() {
            planeHelper.position.x = v3PickedWorldCoord.x;
            planeHelper.position.y = v3PickedWorldCoord.y;
            planeHelper.position.z = v3PickedWorldCoord.z;
          }

          //this is the value which is set to index into picked point vector by update vertex function
          var indPickedPoint;
          var normalCoef;

          // left end picked
          if (isEquivalent(v3PickedNormal, {
              x: 1,
              y: 0,
              z: 0
            })) {
            console.log("left")
            normalCoef = 1;
            //default plane rotation ok here, just transform position
            positionHelperPlane();
            vertsToMove = vertsLeft;
            indPickedPoint = "x"
          } else if (isEquivalent(v3PickedNormal, {
              x: 0,
              y: 0,
              z: 1
            })) {
            console.log("front")
            normalCoef = 1;
            positionHelperPlane();
            planeHelper.rotation.y = Math.PI / 2;
            vertsToMove = vertsFront;
            indPickedPoint = "z"
          } else if (isEquivalent(v3PickedNormal, {
              x: -1,
              y: 0,
              z: 0
            })) {
            console.log("right")
            normalCoef = -1;
            // default plane rotation ok here, just transform position
            positionHelperPlane();
            vertsToMove = vertsRight;
            indPickedPoint = "x"
          } else if (isEquivalent(v3PickedNormal, {
              x: 0,
              y: 0,
              z: -1
            })) {
            console.log("back")
            normalCoef = -1;
            positionHelperPlane();
            planeHelper.rotation.y = Math.PI / 2;
            // planeHelper.rotation.z = Math.PI / 2;
            vertsToMove = vertsBack;
            indPickedPoint = "z"
          } else if (isEquivalent(v3PickedNormal, {
              x: 0,
              y: 1,
              z: 0
            })) {
            console.log("top")
            normalCoef = 1;
            positionHelperPlane();
            //default plane rotation ok here, just transform position
            vertsToMove = vertsTop;
            indPickedPoint = "y"
          } else if (isEquivalent(v3PickedNormal, {
              x: 0,
              y: -1,
              z: 0
            })) {
            console.log("bottom")
            normalCoef = -1;
            positionHelperPlane();
            //default plane rotation ok here, just transform position
            vertsToMove = vertsBottom;
            indPickedPoint = "y"
          }

          //fire up a scene event handler (onPointerObservable) that will detect and fire callback event when pointer moved.
          //assign it to a reference so it can be removed upon mouse/touch-up
          //this is what moves the vertices when dragging.
          //this observer is meant to observe mouse movement over the "helper plane" to get dragging coordinates.

          function observerCb(pointerInfo) {

            if (pointerInfo.event.type === "pointerup") {

              vm.scene.removeMesh(planeHelper)
              vm.scene.onPointerObservable.remove(vm.observer2);

            } else {

              function difPoint(curPoint, prevPoint) {
                let retPoint = {};

                retPoint.x = curPoint.x - prevPoint.x;
                retPoint.y = curPoint.y - prevPoint.y;
                retPoint.z = curPoint.z - prevPoint.z;

                return retPoint;
              }

              //this is needed to return position via scene.pick
              var predicatePlaneHelper = function(mesh) {
                if (mesh === planeHelper)
                  return true;
                return false;
              }
              let pickedPoint = vm.scene.pick(vm.scene.pointerX, vm.scene.pointerY, predicatePlaneHelper).pickedPoint;
              let distToMove = difPoint(pickedPoint, prevPickedPoint);

              prevPickedPoint = pickedPoint;

              // let constraints = {x: 30, y: 30, z: 30}
              let threshMid = 12.5
              vm.box01.updateMeshPositions(function() {
                let checkPos = (vertices[vertsToMove[0]] + distToMove[indPickedPoint]) * normalCoef

                if (checkPos >= 2.5 && checkPos <= 25) {
                  for (let ind of vertsToMove) {
                    vertices[ind] += distToMove[indPickedPoint];
                  }
                } else {
                  //do this to avoid "stuttering" motion when near threshold values
                  if (checkPos > threshMid) {
                    for (let ind of vertsToMove) {
                      vertices[ind] = 25 * normalCoef
                    }
                  } else {
                    for (let ind of vertsToMove) {
                      vertices[ind] = 2.5 * normalCoef
                    }
                  }
                }
              });
              vm.box01.refreshBoundingInfo();
              vm.box01.updateVerticesData(BABYLON.VertexBuffer.PositionKind, vertices);
            }

          }
          vm.observer2 = vm.scene.onPointerObservable.add(observerCb);

          // watch for mouse off canvas
          vm.canvas.addEventListener("mouseout", function() {
            vm.scene.removeMesh(planeHelper)

            vm.scene.onPointerObservable.remove(vm.observer2);
          })

        }));

    }

    vm.actionOrbit = function() {
      console.log("orbit")
      vm.controlMode = "rotate";
      vm.box01.actionManager.actions = [];
      vm.scene.onPointerObservable.remove(vm.observer2);
      vm.camera.attachControl(vm.canvas, false);
    }

    vm.actionSubmit = function() {
      console.log("actionSubmit: ", authService.box)

      //use boxe's bounding box to get w,h,d size of new box
      let newBoxMin = vm.box01._boundingInfo.boundingBox.minimum;
      let newBoxMax = vm.box01._boundingInfo.boundingBox.maximum;

      // console.log(newBox)
      if (updateService.box === null) {
        console.log("post will be called")
        let newBox = {
          width: Math.abs(newBoxMin.x) + Math.abs(newBoxMax.x),
          height: Math.abs(newBoxMin.y) + Math.abs(newBoxMax.y),
          depth: Math.abs(newBoxMin.z) + Math.abs(newBoxMax.z)
        }
        //second param is request body
        console.log("updateService.box is null")

        //should this communicate via service numBoxes for paginator build?
        $http.post('/api/boxes/', newBox)
          .then(function(response) {
            console.log("box insert success")
            updateService.typeOp = "editAdd"
            $state.go('posts')
          })
          .catch(function(response) {
            console.log("box insert fail: ", response)
          })
      } else {
        let newBox = {
          id: updateService.box.id,
          user_id: updateService.box.user_id,
          width: Math.abs(newBoxMin.x) + Math.abs(newBoxMax.x),
          height: Math.abs(newBoxMin.y) + Math.abs(newBoxMax.y),
          depth: Math.abs(newBoxMin.z) + Math.abs(newBoxMax.z)
        }
        console.log("newbox patch ", updateService.box.id)
        $http.patch('/api/boxes/' + updateService.box.id, newBox)
          .then(function(response) {
            console.log("box insert success")
            updateService.box = null
            updateService.typeOp = "editAdd"
            $state.go('posts')
          })
          .catch(function(response) {
            console.log("box insert fail: ", response)
          })
      }

    }
  }
}());
