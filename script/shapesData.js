"use strict";

const CUBE_FACE_INDICES = [
    [3, 7, 5, 1],
    [6, 2, 0, 4],
    [6, 7, 3, 2],
    [0, 1, 5, 4],
    [7, 6, 4, 5],
    [2, 3, 1, 0],
];

class shapesInfo {

    // region Create Vertices

    static deIndexVertices(vertices) {
        const indices = vertices.indices;
        const newVertices = {};
        const numElements = indices.length;

        function expandToUnIndexed(channel) {
            const srcBuffer = vertices[channel];
            const numComponents = srcBuffer.numComponents;
            const dstBuffer = utils.createAugmentedTypedArray(
                numComponents, numElements, srcBuffer.constructor
            );

            for (let i = 0; i < numElements; i++) {
                const ndx = indices[i];
                const offset = ndx * numComponents;
                for (let j = 0; j < numComponents; j++) {
                    dstBuffer.push(srcBuffer[offset + j]);
                }
            }

            newVertices[channel] = dstBuffer;
        }

        function allButIndices(name) {
            return name !== 'indices';
        }

        Object.keys(vertices).filter(allButIndices).forEach(expandToUnIndexed);

        return newVertices;
    }

    static makeDefaultVertexColors(vertices, options) {
        options = options || { };

        const numElements = vertices.position.numElements === undefined
            ? utils.getNumElementsFromNonIndexedArrays(vertices)
            : vertices.position.numElements;

        const vColors = utils.createAugmentedTypedArray(
            4, numElements, Uint8Array
        );

        vertices.color = vColors;

        if (vertices.indices) {
            for (let i = 0; i < numElements; i++) {
                const color = [
                    255, 255, 255, 255
                ];
                vColors.push(color);
            }

            return vertices;
        }

        const numVertsPerColor = options.vertsPerColor || 3;
        const numSets = numElements / numVertsPerColor;
        for (let i = 0; i < numSets; ++i) {
            const color = [
                255, 255, 255, 255
            ];
            for (let j = 0; j < numVertsPerColor; j++) {
                vColors.push(color);
            }
        }

        return vertices;
    }

    static createFlattenedFunc(vertFunc) {
        return function(gl, ...args) {
            let vertices = vertFunc(...args);
            vertices = shapesInfo.deIndexVertices(vertices);
            vertices = shapesInfo.makeDefaultVertexColors(vertices, {
                vertsPerColor: 6
            });

            return utils.createBufferInfoFromArrays(gl, vertices);
        };
    }

    // endregion

    // region Shape functions

    static createCubeVertices(
        size
    ) {
        const k = size / 2;

        const cornerVertices = [
            [-k, -k, -k],
            [+k, -k, -k],
            [-k, +k, -k],
            [+k, +k, -k],
            [-k, -k, +k],
            [+k, -k, +k],
            [-k, +k, +k],
            [+k, +k, +k],
        ];

        const faceNormals = [
            [+1, +0, +0],
            [-1, +0, +0],
            [+0, +1, +0],
            [+0, -1, +0],
            [+0, +0, +1],
            [+0, +0, -1],
        ];

        const uvCoords = [
            [1, 0],
            [0, 0],
            [0, 1],
            [1, 1],
        ];

        const numVertices = 6 * 4;
        const positions = utils.createAugmentedTypedArray(3, numVertices);
        const normals   = utils.createAugmentedTypedArray(3, numVertices);
        const texCoords = utils.createAugmentedTypedArray(2 , numVertices);
        const indices   = utils.createAugmentedTypedArray(3, 6 * 2, Uint16Array);

        for (let i = 0; i < 6; i++) {
            const faceIndices = CUBE_FACE_INDICES[i];

            for (let v = 0; v < 4; ++v) {
                const position = cornerVertices[faceIndices[v]];
                const normal = faceNormals[i];
                const uv = uvCoords[v];

                positions.push(position);
                normals.push(normal);
                texCoords.push(uv);
            }

            const offset = 4 * i;
            indices.push(offset, offset + 1, offset + 2);
            indices.push(offset, offset + 2, offset + 3);
        }

        return {
            position: positions,
            normal: normals,
            texcoord: texCoords,
            indices: indices,
        };
    }


    static createSphereVertices(
        radius,
        subdivisionsAxis,
        subdivisionsHeight
    ) {
        if (subdivisionsAxis <= 0 || subdivisionsHeight <= 0) {
            throw Error('subdivisionAxis and subdivisionHeight must be > 0');
        }

        let startLatitudeInRadians = 0;
        let endLatitudeInRadians = Math.PI;
        let startLongitudeInRadians = 0;
        let endLongitudeInRadians = Math.PI * 2;

        const latRange = endLatitudeInRadians - startLatitudeInRadians;
        const longRange = endLongitudeInRadians - startLongitudeInRadians;

        const numVertices = (subdivisionsAxis + 1) * (subdivisionsHeight + 1);
        const positions = utils.createAugmentedTypedArray(3, numVertices);
        const normals   = utils.createAugmentedTypedArray(3, numVertices);
        const texCoords = utils.createAugmentedTypedArray(2 , numVertices);

        for (let y = 0; y <= subdivisionsHeight; y++) {
            for (let x = 0; x <= subdivisionsAxis; x++) {
                const u = x / subdivisionsAxis;
                const v = y / subdivisionsHeight;
                const theta = longRange * u;
                const phi = latRange * v;
                const sinTheta = Math.sin(theta);
                const cosTheta = Math.cos(theta);
                const sinPhi = Math.sin(phi);
                const cosPhi = Math.cos(phi);
                const ux = cosTheta * sinPhi;
                const uy = cosPhi;
                const uz = sinTheta * sinPhi;
                positions.push(radius * ux, radius * uy, radius * uz);
                normals.push(ux, uy, uz);
                texCoords.push(1 - u, v);
            }
        }

        const numVertsAround = subdivisionsAxis + 1;
        const indices = utils.createAugmentedTypedArray(
            3,
            subdivisionsAxis * subdivisionsHeight * 2,
            Uint16Array
        );

        for (let x = 0; x < subdivisionsAxis; x++) {
            for (let y = 0; y < subdivisionsHeight; y++) {
                indices.push(
                    (y + 0) * numVertsAround + x,
                    (y + 0) * numVertsAround + x + 1,
                    (y + 1) * numVertsAround + x);

                indices.push(
                    (y + 1) * numVertsAround + x,
                    (y + 0) * numVertsAround + x + 1,
                    (y + 1) * numVertsAround + x + 1);
            }
        }

        return {
            position: positions,
            normal: normals,
            texcoord: texCoords,
            indices: indices,
        };
    }


     static createTruncatedConeVertices(
        bottomRadius,
        topRadius,
        height,
        radialSubdivisions,
        verticalSubdivisions,
        opt_topCap,
        opt_bottomCap
     ) {
        if (radialSubdivisions < 3) {
            throw Error('radialSubdivisions must be 3 or greater');
        }

        if (verticalSubdivisions < 1) {
            throw Error('verticalSubdivisions must be 1 or greater');
        }

        const topCap = (opt_topCap === undefined) ? true : opt_topCap;
        const bottomCap = (opt_bottomCap === undefined) ? true : opt_bottomCap;

        const extra = (topCap ? 2 : 0) + (bottomCap ? 2 : 0);

        const numVertices = (radialSubdivisions + 1) * (verticalSubdivisions + 1 + extra);
        const positions = utils.createAugmentedTypedArray(3, numVertices);
        const normals   = utils.createAugmentedTypedArray(3, numVertices);
        const texCoords = utils.createAugmentedTypedArray(2, numVertices);
        const indices   = utils.createAugmentedTypedArray(
            3,
            radialSubdivisions * (verticalSubdivisions + extra) * 2,
            Uint16Array
        );

        const vertsAroundEdge = radialSubdivisions + 1;

        const slant = Math.atan2(bottomRadius - topRadius, height);
        const cosSlant = Math.cos(slant);
        const sinSlant = Math.sin(slant);

        const start = topCap ? -2 : 0;
        const end = verticalSubdivisions + (bottomCap ? 2 : 0);

        for (let j = start; j <= end; ++j) {
            let v = j / verticalSubdivisions;
            let y = height * v;
            let ringRadius;

            if (j < 0) {
                y = 0;
                v = 1;
                ringRadius = bottomRadius;
            } else if (j > verticalSubdivisions) {
                y = height;
                v = 1;
                ringRadius = topRadius;
            } else {
                ringRadius = bottomRadius + (topRadius - bottomRadius) * (j / verticalSubdivisions);
            }

            if (j === -2 || j === verticalSubdivisions + 2) {
                ringRadius = 0;
                v = 0;
            }

            y -= height / 2;
            for (let i = 0; i < vertsAroundEdge; ++i) {
                const sin = Math.sin(i * Math.PI * 2 / radialSubdivisions);
                const cos = Math.cos(i * Math.PI * 2 / radialSubdivisions);
                positions.push(sin * ringRadius, y, cos * ringRadius);
                normals.push(
                    (j < 0 || j > verticalSubdivisions) ? 0 : (sin * cosSlant),
                    (j < 0) ? -1 : (j > verticalSubdivisions ? 1 : sinSlant),
                    (j < 0 || j > verticalSubdivisions) ? 0 : (cos * cosSlant));
                texCoords.push((i / radialSubdivisions), 1 - v);
            }
        }

        for (let j = 0; j < verticalSubdivisions + extra; j++) {
            for (let i = 0; i < radialSubdivisions; i++) {
                indices.push(vertsAroundEdge * (j) + i,
                    vertsAroundEdge * (j) + 1 + i,
                    vertsAroundEdge * (j + 1) + 1 + i);
                indices.push(vertsAroundEdge * (j) + i,
                    vertsAroundEdge * (j + 1) + 1 + i,
                    vertsAroundEdge * (j + 1) + i);
            }
        }

        return {
            position: positions,
            normal: normals,
            texcoord: texCoords,
            indices: indices,
        };
    }

    // endregion

    // region Public shapesInfo functions

    static createCube(gl, ...args) {
        let func = shapesInfo.createFlattenedFunc(shapesInfo.createCubeVertices);

        return func(gl, ...args);
    }

    static createSphere(gl, ...args) {
        let func = shapesInfo.createFlattenedFunc(shapesInfo.createSphereVertices);

        return func(gl, ...args);
    }

    static createCone(gl, ...args) {
        let func = shapesInfo.createFlattenedFunc(shapesInfo.createTruncatedConeVertices);

        return func(gl, ...args);
    }

    // endregion
}