"use strict";

let body;

let hierarchyAddElementEvent;
let hierarchyAddElementContainer;

let hideableComponents;

let onChangeTransform;
let onChangeCamera;

let onChangeFirstLight;
let onChangeSecondLight;

let addElementButton;
let removeElementButton;

let dropdownContent;

let createCubeContent;
let createConeContent;
let createSphereContent;

let createMeshContent;
let uploadMeshContent;

let transformComponent;
let cameraComponent;

let firstLightSourceComponent;
let secondLightSourceComponent;

let addTextureButton;
let removeTextureButton;

let textureComponent;

let activeElement = null;
let listDOM = [];

let id = 0;

function createElement(shape, nameShape) {
    const newElement = document.createElement('a');
    const newElementText = document.createTextNode(
        nameShape + "_" + id.toString()
    );

    newElement.setAttribute("href", "#");
    newElement.appendChild(newElementText);

    newElement.onclick = setAsActive;

    hierarchyAddElementContainer.appendChild(newElement);
    listDOM.push(newElement);
    id++;

    canvasCont.createObject(shape);

    updateHierarchy();
}

function createCube() {
    const shapes = canvasCont.shapes;
    createElement(shapes.cube, "cube");
}

function createCone() {
    const shapes = canvasCont.shapes;
    createElement(shapes.cone, "cone");
}

function createSphere() {
    const shapes = canvasCont.shapes;
    createElement(shapes.sphere, "sphere");
}

function createMesh() {
    const reader = new FileReader();

    reader.onload = function(e) {
        let textObj = e.target.result;
        const shape = meshData.createMesh(
            canvasCont.gl,
            textObj
        )[0];
        createElement(shape, "mesh");
    }

    reader.readAsText(this.files[0]);
}

function removeElement() {
    if (activeElement === null) {
        return;
    }

    const index = listDOM.indexOf(activeElement);
    if (index > -1) {
        listDOM.splice(index, 1);
        canvasCont.removeObject(index);
    }

    activeElement.remove();
    activeElement = null;

    updateHierarchy();
}

function setAsActive() {
    listDOM.forEach(element => element.classList.remove("active"));
    this.classList.add("active");
    activeElement = this;

    updateTransformComponent();
    updateRendererComponent();

    updateHierarchy();
}

function updateHierarchy() {
    removeElementButton.disabled = activeElement === null;

    hideableComponents.forEach(
        component =>
            component.hidden = activeElement === null
    );
}

function changeCamera() {
    const camera = canvasCont.camera;

    camera.position.x = Number.parseFloat(cameraComponent.position.x.value);
    camera.position.y = Number.parseFloat(cameraComponent.position.y.value);
    camera.position.z = Number.parseFloat(cameraComponent.position.z.value);

    camera.rotation.x = Number.parseFloat(cameraComponent.rotation.x.value);
    camera.rotation.y = Number.parseFloat(cameraComponent.rotation.y.value);
    camera.rotation.z = Number.parseFloat(cameraComponent.rotation.z.value);

    camera.fieldOfView = Number.parseFloat(cameraComponent.fov.value);
    camera.zNear = Number.parseFloat(cameraComponent.zNear.value);
    camera.zFar = Number.parseFloat(cameraComponent.zFar.value);

    camera.ambientColor.x = Number.parseFloat(cameraComponent.ambientColor.x.value) / 255;
    camera.ambientColor.y = Number.parseFloat(cameraComponent.ambientColor.y.value) / 255;
    camera.ambientColor.z = Number.parseFloat(cameraComponent.ambientColor.z.value) / 255;

    updateCameraComponent();
}

function changeLight(index) {

    let light;
    let lightSourceComponent;

    if (index === 0) {
        light = canvasCont.firstLight;
        lightSourceComponent = firstLightSourceComponent;
    } else {
        light = canvasCont.secondLight;
        lightSourceComponent = secondLightSourceComponent;
    }


    light.position.x = Number.parseFloat(lightSourceComponent.position.x.value);
    light.position.y = Number.parseFloat(lightSourceComponent.position.y.value);
    light.position.z = Number.parseFloat(lightSourceComponent.position.z.value);

    light.color.x = Number.parseFloat(lightSourceComponent.color.x.value) / 255;
    light.color.y = Number.parseFloat(lightSourceComponent.color.y.value) / 255;
    light.color.z = Number.parseFloat(lightSourceComponent.color.z.value) / 255;

    light.shininess = Number.parseFloat(lightSourceComponent.shininess.value);
    light.attenuation = Number.parseFloat(lightSourceComponent.attenuation.value);

    updateLightComponent(index);
}

function cameraConstructor() {
    const component = ".camera .row ";

    return {
        position: positionConstructor(component),
        rotation: rotationConstructor(component),
        ambientColor: scaleConstructor(component),

        fov: document.querySelector(".fov"),
        zNear: document.querySelector(".z-near"),
        zFar: document.querySelector(".z-far")
    }
}

function lightSourceConstructor(index) {
    const component = index + " .row ";

    return {
        position: positionConstructor(component),
        color: rotationConstructor(component),

        shininess: document.querySelector(component + ".field-value .float-field .shininess"),
        attenuation: document.querySelector(component + ".field-value .float-field .attenuation"),
    }
}

function textureConstructor() {
    const add = document.querySelector(".texture-add");
    const remove = document.querySelector(".texture-remove");
    const source = document.querySelector(".texture-source");

    add.onchange = addTexture;
    remove.onclick = removeTexture;

    return {
        add,
        remove,
        source
    }
}

function updateCameraComponent() {

    const camera = canvasCont.camera;

    cameraComponent.position.x.value = camera.position.x;
    cameraComponent.position.y.value = camera.position.y;
    cameraComponent.position.z.value = camera.position.z;

    cameraComponent.rotation.x.value = camera.rotation.x;
    cameraComponent.rotation.y.value = camera.rotation.y;
    cameraComponent.rotation.z.value = camera.rotation.z;

    cameraComponent.fov.value = camera.fieldOfView
    cameraComponent.zNear.value = camera.zNear;
    cameraComponent.zFar.value = camera.zFar;

    cameraComponent.ambientColor.x.value = camera.ambientColor.x * 255;
    cameraComponent.ambientColor.y.value = camera.ambientColor.y * 255;
    cameraComponent.ambientColor.z.value = camera.ambientColor.z * 255;
}

function updateLightComponent(index) {

    let light;
    let lightSourceComponent;

    if (index === 0) {
        light = canvasCont.firstLight;
        lightSourceComponent = firstLightSourceComponent;
    } else {
        light = canvasCont.secondLight;
        lightSourceComponent = secondLightSourceComponent;;
    }

    lightSourceComponent.position.x.value = light.position.x;
    lightSourceComponent.position.y.value = light.position.y;
    lightSourceComponent.position.z.value = light.position.z;

    lightSourceComponent.color.x.value = light.color.x * 255;
    lightSourceComponent.color.y.value = light.color.y * 255;
    lightSourceComponent.color.z.value = light.color.z * 255;

    lightSourceComponent.shininess.value = light.shininess;
    lightSourceComponent.attenuation.value = light.attenuation;
}

function changeTransform() {
    if (activeElement === null) {
        return;
    }

    const index = listDOM.indexOf(activeElement);
    if (index > -1) {
        const object = canvasCont.objects[index];

        object.position.x = transformComponent.position.x.value;
        object.position.y = transformComponent.position.y.value;
        object.position.z = transformComponent.position.z.value;

        object.rotation.x = transformComponent.rotation.x.value;
        object.rotation.y = transformComponent.rotation.y.value;
        object.rotation.z = transformComponent.rotation.z.value;

        object.scale.x    = transformComponent.scale.x.value;
        object.scale.y    = transformComponent.scale.y.value;
        object.scale.z    = transformComponent.scale.z.value;
    }
}

function addTexture() {
    if (activeElement === null) {
        return;
    }

    const index = listDOM.indexOf(activeElement);
    if (index > -1) {
        const object = canvasCont.objects[index];

        let source = textureComponent.add.value.split('\\');
        source = source[source.length - 1];

        object.textureSrc = source;
        object.texture = this.files[0];
        console.log(this.files[0]);
        textureComponent.source.value = object.textureSrc;

        canvasCont.updateTexture(object);
    }
}

function removeTexture() {
    if (activeElement === null) {
        return;
    }

    const index = listDOM.indexOf(activeElement);
    if (index > -1) {
        const object = canvasCont.objects[index];

        object.textureSrc = canvasCont.TEXTURE_EMPTY;
        object.texture = null;
        textureComponent.source.value = object.textureSrc;

        canvasCont.updateTexture(object);
    }
}

function transformConstructor() {
    const component = ".transform .row ";

    return {
        position: positionConstructor(component),
        rotation: rotationConstructor(component),
        scale   : scaleConstructor(component)
    }
}

function positionConstructor(component) {
    return {
        x: document.querySelector(component + ".position .vector3-x "),
        y: document.querySelector(component + ".position .vector3-y "),
        z: document.querySelector(component + ".position .vector3-z ")
    }
}

function rotationConstructor(component) {
    return {
        x: document.querySelector(component + ".rotation .vector3-x "),
        y: document.querySelector(component + ".rotation .vector3-y "),
        z: document.querySelector(component + ".rotation .vector3-z ")
    }
}

function scaleConstructor(component) {
    return {
        x: document.querySelector(component + ".scale .vector3-x "),
        y: document.querySelector(component + ".scale .vector3-y "),
        z: document.querySelector(component + ".scale .vector3-z ")
    }
}

function updateTransformComponent() {
    if (activeElement === null) {
        return;
    }

    const index = listDOM.indexOf(activeElement);
    if (index > -1) {
        const object = canvasCont.objects[index];

        transformComponent.position.x.value = object.position.x;
        transformComponent.position.y.value = object.position.y;
        transformComponent.position.z.value = object.position.z;

        transformComponent.rotation.x.value = object.rotation.x;
        transformComponent.rotation.y.value = object.rotation.y;
        transformComponent.rotation.z.value = object.rotation.z;

        transformComponent.scale.x.value    = object.scale.x;
        transformComponent.scale.y.value    = object.scale.y;
        transformComponent.scale.z.value    = object.scale.z;
    }

}

function updateRendererComponent() {
    if (activeElement === null) {
        return;
    }

    const index = listDOM.indexOf(activeElement);
    if (index > -1) {
        const object = canvasCont.objects[index];

        textureComponent.add.value = "";
        textureComponent.source.value = object.textureSrc;
    }
}

function toggleDropdownContent() {
    dropdownContent.classList.toggle('show');
}

function disableDropdownContent(event) {
    if (!event.target.matches('.hierarchy-button-plus')) {
        if (dropdownContent.classList.contains('show')) {
            dropdownContent.classList.remove('show');
        }
    }
}

function uiControllerConstructor() {
    hierarchyAddElementEvent = document.querySelector(".hierarchy-add-element");
    hierarchyAddElementContainer = document.querySelector(".hierarchy-link");

    addElementButton = document.querySelector(".hierarchy-button-plus");
    removeElementButton = document.querySelector(".hierarchy-button-minus");

    createCubeContent = document.querySelector(".create-cube");
    createConeContent = document.querySelector(".create-cone");
    createSphereContent = document.querySelector(".create-sphere");

    createMeshContent = document.querySelector(".create-mesh");
    uploadMeshContent = document.querySelector(".upload-mesh");

    hideableComponents = document.querySelectorAll(".hideable-components");

    onChangeTransform = document.querySelector(".on-change-transform");
    onChangeCamera = document.querySelector(".on-change-camera");

    onChangeFirstLight = document.querySelector(".on-change-first-light");
    onChangeSecondLight = document.querySelector(".on-change-second-light");

    addTextureButton = document.querySelector(".texture-add");
    removeTextureButton = document.querySelector(".texture-remove");

    dropdownContent = document.querySelector(".dropdown-content");

    body = document.querySelector("body");

    addElementButton.onclick = toggleDropdownContent;
    removeElementButton.onclick = removeElement;

    onChangeTransform.onchange = changeTransform;
    onChangeCamera.onchange = changeCamera;

    addTextureButton.onchange = addTexture;

    onChangeFirstLight.onchange = function() {
       changeLight(0);
    };

    onChangeSecondLight.onchange = function() {
        changeLight(1);
    };

    transformComponent = transformConstructor();
    cameraComponent = cameraConstructor();
    textureComponent = textureConstructor();

    firstLightSourceComponent = lightSourceConstructor(".first-light-source");
    secondLightSourceComponent = lightSourceConstructor(".second-light-source");

    body.onclick = disableDropdownContent;

    createCubeContent.onclick = createCube;
    createConeContent.onclick = createCone;
    createSphereContent.onclick = createSphere;

    createMeshContent.onclick = function(e) {
        e.preventDefault();
        uploadMeshContent.click();
    };
    uploadMeshContent.onchange = createMesh;

    canvasCont.construct();

    updateLightComponent(0);
    updateLightComponent(1);

    updateCameraComponent();
    updateHierarchy();
}

uiControllerConstructor();

