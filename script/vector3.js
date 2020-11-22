"use strict";

class vector3{

    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    static zero() {
        return new this(
            0, 0, 0
        );
    }

    static one() {
        return new this(
            1, 1, 1
        );
    }

    static copy(src) {
        return new vector3(
            src.x, src.y, src.z
        );
    }

    rotateAround(angle, thisA, thisB, originA, originB) {
        let s = Math.sin(angle);
        let c = Math.cos(angle);

        thisA -= originA;
        thisB -= originB;

        let aNew = thisA * c - thisB * s;
        let bNew = thisA * s + thisB * c;

        thisA = aNew + originA;
        thisB = bNew + originB;

        return {
            a: thisA,
            b: thisB
        }
    }

    xRotateAround(angle, origin) {
        let v2 = this.rotateAround(
            angle, this.x, this.z, origin.x, origin.z
        );

        this.x = v2.a;
        this.z = v2.b;

        return this;
    }

    yRotateAround(angle, origin) {
        let v2 = this.rotateAround(
            angle, this.y, this.z, origin.y, origin.z
        );

        this.y = v2.a;
        this.z = v2.b;

        return this;
    }


    zRotateAround(angle, origin) {
        let v2 = this.rotateAround(
            angle, this.x, this.y, origin.x, origin.y
        );

        this.x = v2.a;
        this.y = v2.b;

        return this;
    }

    toArray() {
        return [
            this.x, this.y, this.z
        ];
    }
}
