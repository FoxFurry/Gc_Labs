"use strict";

class matrix4 {

    static identity() {
        return [
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ];
    }

    static one() {
        return [
            1, 1, 1, 1,
            1, 1, 1, 1,
            1, 1, 1, 1,
            1, 1, 1, 1
        ];
    }

    static multiply(a, b) {
        const matrix = new Float32Array(16);


        const mi0 = (4 * 0);
        const mi1 = (4 * 1);
        const mi2 = (4 * 2);
        const mi3 = (4 * 3);

        for (let i = 0; i < 16; ++i) {
            let base_i = Math.trunc(i / 4);
            let base = base_i * 4;
            let reminder = i % 4;

            matrix[i] = b[base + 0] * a[mi0 + reminder] +
                        b[base + 1] * a[mi1 + reminder] +
                        b[base + 2] * a[mi2 + reminder] +
                        b[base + 3] * a[mi3 + reminder];
        }

        return matrix;
    }

    static normalize(v) {
        const length = Math.sqrt(
            v[0] * v[0] +
            v[1] * v[1] +
            v[2] * v[2]
        );

        let result = [0, 0, 0];

        if (length > 0.00001) {
            result = [
                v[0] / length,
                v[1] / length,
                v[2] / length
            ];
        }

        return result;
    }

    static perspective(fov, aspect, near, far) {
        let f = Math.tan(Math.PI * 0.5 - 0.5 * fov);
        let rangeInv = 1.0 / (near - far);

        let m0 = f / aspect;
        let mA = (near + far) * rangeInv;
        let mE = near * far * rangeInv * 2;

        return [
            m0,  0,  0,  0,
             0,  f,  0,  0,
             0,  0, mA, -1,
             0,  0, mE,  0
        ];
    }

    static transpose(v) {
        return [
            v[0], v[4], v[ 8], v[12],
            v[1], v[5], v[ 9], v[13],
            v[2], v[6], v[10], v[14],
            v[3], v[7], v[11], v[15],
        ];
    }

    static subtract(a, b) {
        return [
            a[0] - b[0],
            a[1] - b[1],
            a[2] - b[2]
        ];
    }

    static cross(a, b) {
        return [
            a[1] * b[2] - a[2] * b[1],
            a[2] * b[0] - a[0] * b[2],
            a[0] * b[1] - a[1] * b[0]
        ];
    }

    static lookAt(camera, target, up) {
        const zAxis = this.normalize(this.subtract(camera, target));
        const xAxis = this.normalize(this.cross(up, zAxis));
        const yAxis = this.normalize(this.cross(zAxis, xAxis));

        return [
             xAxis[0],  xAxis[1],  xAxis[2], 0,
             yAxis[0],  yAxis[1],  yAxis[2], 0,
             zAxis[0],  zAxis[1],  zAxis[2], 0,
            camera[0], camera[1], camera[2], 1
        ];
    }

    // region inverse

    static inverse(m) {
        const matrix = new Float32Array(16);

        // f*k math
        matrix[0] = m[5] * m[10] * m[15] - m[5] * m[14] * m[11] - m[6] * m[9] * m[15] +
            m[6] * m[13] * m[11] + m[7] * m[9] * m[14] - m[7] * m[13] * m[10];

        matrix[1] = -m[1] * m[10] * m[15] + m[1] * m[14] * m[11] + m[2] * m[9] * m[15] -
            m[2] * m[13] * m[11] - m[3] * m[9] * m[14] + m[3] * m[13] * m[10];

        matrix[2] = m[1] * m[6] * m[15] - m[1] * m[14] * m[7] - m[2] * m[5] * m[15] +
            m[2] * m[13] * m[7] + m[3] * m[5] * m[14] - m[3] * m[13] * m[6];

        matrix[3] = -m[1] * m[6] * m[11] + m[1] * m[10] * m[7] + m[2] * m[5] * m[11] -
            m[2] * m[9] * m[7] - m[3] * m[5] * m[10] + m[3] * m[9] * m[6];

        matrix[4] = -m[4] * m[10] * m[15] + m[4] * m[14] * m[11] + m[6] * m[8] * m[15] -
            m[6] * m[12] * m[11] - m[7] * m[8] * m[14] + m[7] * m[12] * m[10];

        matrix[5] = m[0] * m[10] * m[15] - m[0] * m[14] * m[11] - m[2] * m[8] * m[15] +
            m[2] * m[12] * m[11] + m[3] * m[8] * m[14] - m[3] * m[12] * m[10];

        matrix[6] = -m[0] * m[6] * m[15] + m[0] * m[14] * m[7] + m[2] * m[4] * m[15] -
            m[2] * m[12] * m[7] - m[3] * m[4] * m[14] + m[3] * m[12] * m[6];

        matrix[7] = m[0] * m[6] * m[11] - m[0] * m[10] * m[7] - m[2] * m[4] * m[11] +
            m[2] * m[8] * m[7] + m[3] * m[4] * m[10] - m[3] * m[8] * m[6];

        matrix[8] = m[4] * m[9] * m[15] - m[4] * m[13] * m[11] - m[5] * m[8] * m[15] +
            m[5] * m[12] * m[11] + m[7] * m[8] * m[13] - m[7] * m[12] * m[9];

        matrix[9] = -m[0] * m[9] * m[15] + m[0] * m[13] * m[11] + m[1] * m[8] * m[15] -
            m[1] * m[12] * m[11] - m[3] * m[8] * m[13] + m[3] * m[12] * m[9];

        matrix[10] = m[0] * m[5] * m[15] - m[0] * m[13] * m[7] - m[1] * m[4] * m[15] +
            m[1] * m[12] * m[7] + m[3] * m[4] * m[13] - m[3] * m[12] * m[5];

        matrix[11] = -m[0] * m[5] * m[11] + m[0] * m[9] * m[7] + m[1] * m[4] * m[11] -
            m[1] * m[8] * m[7] - m[3] * m[4] * m[9] + m[3] * m[8] * m[5];

        matrix[12] = -m[4] * m[9] * m[14] + m[4] * m[13] * m[10] + m[5] * m[8] * m[14] -
            m[5] * m[12] * m[10] - m[6] * m[8] * m[13] + m[6] * m[12] * m[9];

        matrix[13] = m[0] * m[9] * m[14] - m[0] * m[13] * m[10] - m[1] * m[8] * m[14] +
            m[1] * m[12] * m[10] + m[2] * m[8] * m[13] - m[2] * m[12] * m[9];

        matrix[14] = -m[0] * m[5] * m[14] + m[0] * m[13] * m[6] + m[1] * m[4] * m[14] -
            m[1] * m[12] * m[6] - m[2] * m[4] * m[13] + m[2] * m[12] * m[5];

        matrix[15] = m[0] * m[5] * m[10] - m[0] * m[9] * m[6] - m[1] * m[4] * m[10] +
            m[1] * m[8] * m[6] + m[2] * m[4] * m[9] - m[2] * m[8] * m[5];

        let det = m[0] * matrix[0] + m[1] * matrix[4] + m[2] * matrix[8] + m[3] * matrix[12];
        for (let i = 0; i < 16; ++i) {
            matrix[i] /= det;
        }

        return matrix;
    }

    // endregion

    // region translate

    static translation(x, y, z) {
        return [
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            x, y, z, 1
        ];
    }

    static translate(matrix, x, y, z) {
        return this.multiply(matrix, this.translation(x, y, z));
    }

    // endregion

    // region rotate

    // region rotation

    static xRotation(angle) {
        const c = Math.cos(angle);
        const s = Math.sin(angle);

        return [
            1,  0,  0,  0,
            0,  c,  s,  0,
            0, -s,  c,  0,
            0,  0,  0,  1
        ];
    }

    static yRotation(angle) {
        const c = Math.cos(angle);
        const s = Math.sin(angle);

        return [
            c,  0, -s,  0,
            0,  1,  0,  0,
            s,  0,  c,  0,
            0,  0,  0,  1
        ];
    }


    static zRotation(angle) {
        const c = Math.cos(angle);
        const s = Math.sin(angle);

        return [
             c, s, 0, 0,
            -s, c, 0, 0,
             s, 0, 1, 0,
             0, 0, 0, 1
        ];
    }

    // endregion

    static xRotate(matrix, angle) {
        return this.multiply(matrix, this.xRotation(angle));
    }

    static yRotate(matrix, angle) {
        return this.multiply(matrix, this.yRotation(angle));
    }

    static zRotate(matrix, angle) {
        return this.multiply(matrix, this.zRotation(angle));
    }

    static rotate(matrix, x, y, z) {
        matrix = this.xRotate(matrix, x);
        matrix = this.yRotate(matrix, y);
        matrix = this.zRotate(matrix, z);

        return matrix;
    }

    // endregion

    // region scale

    static scaling(x, y, z) {
        return [
            x, 0, 0, 0,
            0, y, 0, 0,
            0, 0, z, 0,
            0, 0, 0, 1
        ];
    }

    static scale(matrix, x, y, z) {
        return this.multiply(matrix, this.scaling(x, y, z));
    }

    // endregion
}