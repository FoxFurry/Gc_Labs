"use strict";

class canvasCont {

    static TEXTURE_EMPTY = "Empty";
    static TEXTURE_ERROR = "Error";

    static gl;
    static programInfo;

    static degToRad = Math.PI / 180;

    static objects = [];
    static lightObjects = [];

    static camera;

    static setupGl(gl) {
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        gl.enable(gl.CULL_FACE);
        gl.enable(gl.DEPTH_TEST);

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    }

    static setupShapes(gl) {
        const sphereBufferInfo = shapesInfo.createSphere(gl, 10, 120, 60);
        const cubeBufferInfo   = shapesInfo.createCube(gl, 20);
        const coneBufferInfo   = shapesInfo.createCone(gl, 10, 0, 20, 12, 1, true, false);

        canvasCont.shapes = {
            "sphere": sphereBufferInfo,
            "cube"  : cubeBufferInfo,
            "cone"  : coneBufferInfo
        };

        Object.freeze(canvasCont.shapes);
    }

    static getDefaultTexture() {
        const gl = canvasCont.gl;
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.LUMINANCE,
            1,
            1,
            0,
            gl.LUMINANCE,
            gl.UNSIGNED_BYTE,
            new Uint8Array([
                0xFF
            ]));
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

        return texture;
    }

    static updateTexture(object) {
        let texture = null;
        const gl = canvasCont.gl;

        if (object.texture === null) {
            texture = canvasCont.getDefaultTexture();
            object.uniforms.u_texture = texture;
        } else {
            const image = new Image();
            const reader = new FileReader();

            texture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
                new Uint8Array([0, 0, 255, 255]));

            reader.onload = function(e) {
                image.src = e.target.result;

                image.onload = function() {
                    gl.bindTexture(gl.TEXTURE_2D, texture);
                    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
                    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,gl.UNSIGNED_BYTE, image);

                    if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
                        gl.generateMipmap(gl.TEXTURE_2D);
                    } else {
                        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                    }

                    object.uniforms.u_texture = texture;
                };

                function isPowerOf2(value) {
                    return (value & (value - 1)) === 0;
                }
            }

            reader.readAsDataURL(object.texture);
        }


    }

    static updateLightObjects(firstLight, secondLight) {
        firstLight.object.position = firstLight.position;
        firstLight.object.scale = firstLight.objectScale;
        firstLight.object.lightMult = 0;

        secondLight.object.position = secondLight.position;
        secondLight.object.scale = secondLight.objectScale;
        secondLight.object.lightMult = 0;
    }

    static computeGraphics(gl, objects, computeMatrix, camera, degToRad, firstLight, secondLight) {

        const fov = camera.fieldOfView * degToRad;
        const zNear = camera.zNear;
        const zFar = camera.zFar;

        const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
        const projectionMatrix = matrix4.perspective(fov, aspect, zNear, zFar);

        const cPosition = camera.position;
        const cTarget = new vector3(
            camera.position.x + camera.targetSub.x,
            camera.position.y + camera.targetSub.y,
            camera.position.z + camera.targetSub.z
        );
        const up = vector3.copy(camera.up);

        cTarget.xRotateAround(camera.rotation.x * degToRad, cPosition);
        cTarget.yRotateAround(camera.rotation.y * degToRad, cPosition);
        up.zRotateAround(camera.rotation.z * degToRad, camera.v3Zero);

        const cameraMatrix = matrix4.lookAt(
            cPosition.toArray(), cTarget.toArray(), up.toArray()
        );

        let viewMatrix = matrix4.inverse(cameraMatrix);

        let viewProjectionMatrix = matrix4.multiply(projectionMatrix, viewMatrix);

        objects.forEach(function(object) {
            object.uniforms.u_world = computeMatrix(
                matrix4.identity(),
                object,
                degToRad
            );

            object.uniforms.u_matrix = matrix4.multiply(
                viewProjectionMatrix,
                object.uniforms.u_world
            );

            object.uniforms.u_worldInverse = matrix4.inverse(
                object.uniforms.u_world
            );

            object.uniforms.u_worldInverse = matrix4.transpose(
                object.uniforms.u_worldInverse
            )

            object.uniforms.u_ambientColor = [
                camera.ambientColor.x,
                camera.ambientColor.y,
                camera.ambientColor.z
            ];

            object.uniforms.u_lightMult = object.lightMult;

            object.uniforms.u_firstLightPosition = [
                firstLight.position.x,
                firstLight.position.y,
                firstLight.position.z
            ];

            object.uniforms.u_firstLightColor = [
                firstLight.color.x,
                firstLight.color.y,
                firstLight.color.z
            ];

            object.uniforms.u_firstLightShininess = firstLight.shininess;
            object.uniforms.u_firstLightAttenuation = firstLight.attenuation;

            object.uniforms.u_secondLightPosition = [
                secondLight.position.x,
                secondLight.position.y,
                secondLight.position.z
            ];

            object.uniforms.u_secondLightColor = [
                secondLight.color.x,
                secondLight.color.y,
                secondLight.color.z
            ];

            object.uniforms.u_secondLightShininess = secondLight.shininess;
            object.uniforms.u_secondLightAttenuation = secondLight.attenuation;
        });
    }

    static updateGraphics(gl, objects) {
        let lastUsedProgramInfo = null;
        let lastUsedBufferInfo = null;

        objects.forEach(function(object) {
            let programInfo = object.programInfo;
            let bufferInfo = object.bufferInfo;
            let bindBuffers = false;

            if (programInfo !== lastUsedProgramInfo) {
                lastUsedProgramInfo = programInfo;
                gl.useProgram(programInfo.program);

                bindBuffers = true;
            }

            if (bindBuffers || bufferInfo !== lastUsedBufferInfo) {
                lastUsedBufferInfo = bufferInfo;
                utils.setBuffersAndAttributes(gl, programInfo, bufferInfo);
            }

            utils.setUniforms(programInfo, object.uniforms);

            utils.drawBufferInfo(gl, bufferInfo);
        });

    }

    static computeMatrix(matrix, object, degToRad) {
        matrix = matrix4.translate(
            matrix,
            object.position.x,
            object.position.y,
            object.position.z
        );

        matrix = matrix4.rotate(
            matrix,
            object.rotation.x * degToRad,
            object.rotation.y * degToRad,
            object.rotation.z * degToRad
        );

        matrix = matrix4.scale(
            matrix,
            object.scale.x,
            object.scale.y,
            object.scale.z
        );

        return matrix;
    }

    static update() {
        const lightObjects = canvasCont.lightObjects;
        const objects = canvasCont.objects;
        const gl = canvasCont.gl;

        const computeMatrix = canvasCont.computeMatrix;
        const camera = canvasCont.camera;

        const firstLight = canvasCont.firstLight;
        const secondLight = canvasCont.secondLight;

        const degToRad = canvasCont.degToRad;

        utils.resizeCanvasToDisplaySize(gl.canvas);

        canvasCont.setupGl(gl);

        canvasCont.updateLightObjects(firstLight, secondLight);

        const arrays = [objects, lightObjects];
        for (let i = 0; i < arrays.length; i++) {
            let array = arrays[i];
            canvasCont.computeGraphics(
                gl,
                array,
                computeMatrix,
                camera,
                degToRad,
                firstLight,
                secondLight
            );

            canvasCont.updateGraphics(
                gl,
                array
            );
        }

        requestAnimationFrame(canvasCont.update);
    }

    static construct() {
        const canvas = document.querySelector(".canvas");
        let gl = canvas.getContext("webgl");

        canvasCont.gl = gl;

        if (!gl) {
            return;
        }


        canvasCont.setupShapes(gl, this)

        canvasCont.programInfo = utils.createProgramInfo(
            gl,
            [
                "vertex-shader-3d",
                "fragment-shader-3d"
            ],
            [
                "VERTEX_SHADER",
                "FRAGMENT_SHADER",
            ]
        );

        canvasCont.fieldOfView = 60 * canvasCont.degToRad;

        canvasCont.objects = [];

        canvasCont.lightPosition = gl.getUniformLocation(
            canvasCont.programInfo.program,
            "u_lightPosition"
        );

        canvasCont.lightTarget = gl.getUniformLocation(
            canvasCont.programInfo.program,
            "u_lightTarget"
        );

        canvasCont.camera = {
            position: new vector3(0, 20, 95),
            rotation: new vector3(0, 0, 0),

            targetSub: new vector3(0, 0, -100),
            up: new vector3(0, 1, 0),
            v3Zero: vector3.zero(),

            fieldOfView: 45,
            zNear: 1,
            zFar: 500,

            ambientColor: new vector3(.5, .2, .5)
        }

        canvasCont.firstLight = {
            position: new vector3(-15, 20, 0),
            color: new vector3(1, 1, 1),

            shininess: 30,
            attenuation: .2,

            object: canvasCont.createObject(
                canvasCont.shapes.sphere,
                canvasCont.lightObjects
            ),
            objectScale: new vector3(.2, .2, .2)
        }


        canvasCont.secondLight = {
            position: new vector3(15, 10, 0),
            color: new vector3(1, 1, 1),

            shininess: 30,
            attenuation: .2,

            object: canvasCont.createObject(
                canvasCont.shapes.sphere,
                canvasCont.lightObjects
            ),
            objectScale: new vector3(.2, .2, .2)
        }

        requestAnimationFrame(canvasCont.update);
    }

    static createObject(shape, array) {
        array = array || this.objects;

        const u_texture = canvasCont.getDefaultTexture();

        const position = vector3.zero();
        const rotation = vector3.zero();
        const scale = vector3.one();

        const programInfo = this.programInfo;

        const textureSrc = this.TEXTURE_EMPTY;
        const texture = null;

        const lightMult = 1;

        const uniforms = {
            u_matrix: matrix4.identity(),
            u_world: matrix4.one(),
            u_worldInverse: matrix4.one(),

            u_ambientColor: [.2, .2, .2],

            u_lightMult: lightMult,

            u_firstLightPosition: [20, 0, 20],
            u_firstLightColor: [1, 1, 1],
            u_firstLightShininess: 20,
            u_firstLightAttenuation: .2,

            u_secondLightPosition: [-20, 0, 0],
            u_secondLightColor: [1, 1, 1],
            u_secondLightShininess: 20,
            u_secondLightAttenuation: .2,

            u_texture: u_texture
        }

        const o = new object(
            uniforms,
            position,
            rotation,
            scale,
            programInfo,
            shape,
            textureSrc,
            texture,
            lightMult
        );

        array.push(o)
        return o;
    }

    static removeObject(index) {
        if (index > -1) {
            this.objects.splice(index, 1);
        }
    }
}