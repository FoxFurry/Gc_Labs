"use strict";

class object {
    constructor(uniforms, position, rotation, scale, programInfo, bufferInfo, textureSrc, texture, lightMult) {
        this.uniforms    = uniforms;
        this.position    = position;
        this.rotation    = rotation;
        this.scale       = scale;

        this.programInfo = programInfo;
        this.bufferInfo  = bufferInfo;

        this.textureSrc  = textureSrc;
        this.texture     = texture;

        this.lightMult   = lightMult;
    }
}