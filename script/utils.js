class utils {

    //region createProgramInfo

    static createProgramInfo(gl, shaderSources, shaderSourceTypes) {
        shaderSources = shaderSources.map(function(source) {
            const script = document.getElementById(source);
            return script ? script.text : null;
        });

        const program = this.createProgramFromSources(
            gl, shaderSources, shaderSourceTypes
        );
        if (!program) {
            return null;
        }

        const uniformSetters = this.createUniformSetters(gl, program);
        const attribSetters = this.createAttributeSetters(gl, program);

        return {
            program: program,
            uniformSetters: uniformSetters,
            attribSetters: attribSetters,
        };
    }

    static createProgramFromSources(gl, shaderSources, shaderSourceTypes) {
        const shaders = [];
        for (let i = 0; i < shaderSources.length; i++) {
            shaders.push(
                this.loadShader(
                    gl,
                    shaderSources[i],
                    gl[shaderSourceTypes[i]]
                )
            );
        }

        return this.createProgram(gl, shaders);
    }

    static createProgram(gl, shaders) {
        const program = gl.createProgram();
        shaders.forEach(function(shader) {
            gl.attachShader(program, shader);
        });

        gl.linkProgram(program);

        const linked = gl.getProgramParameter(program, gl.LINK_STATUS);
        if (!linked) {
            gl.deleteProgram(program);
            return null;
        }

        return program;
    }

    static loadShader(gl, shaderSource, shaderType) {
        const shader = gl.createShader(shaderType);

        gl.shaderSource(shader, shaderSource);

        gl.compileShader(shader);

        const compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
        if (!compiled) {
            gl.deleteShader(shader);
            return null;
        }

        return shader;
    }

    static getBindPointForSamplerType(gl, type) {
        if (type === gl.SAMPLER_2D) {
            return gl.TEXTURE_2D;
        }

        if (type === gl.SAMPLER_CUBE) {
            return gl.TEXTURE_CUBE_MAP;
        }

        return undefined;
    }

    static createUniformSetter(gl, program, uniformInfo) {
        const location = gl.getUniformLocation(program, uniformInfo.name);
        const type = uniformInfo.type;
        let textureUnit = 0;

        const isArray = (uniformInfo.size > 1 && uniformInfo.name.substr(-3) === '[0]');
        if (type === gl.FLOAT && isArray) {
            return function(v) {
                gl.uniform1fv(location, v);
            };
        }
        if (type === gl.FLOAT) {
            return function(v) {
                gl.uniform1f(location, v);
            };
        }
        if (type === gl.FLOAT_VEC2) {
            return function(v) {
                gl.uniform2fv(location, v);
            };
        }
        if (type === gl.FLOAT_VEC3) {
            return function(v) {
                gl.uniform3fv(location, v);
            };
        }
        if (type === gl.FLOAT_VEC4) {
            return function(v) {
                gl.uniform4fv(location, v);
            };
        }
        if (type === gl.INT && isArray) {
            return function(v) {
                gl.uniform1iv(location, v);
            };
        }
        if (type === gl.INT) {
            return function(v) {
                gl.uniform1i(location, v);
            };
        }
        if (type === gl.INT_VEC2) {
            return function(v) {
                gl.uniform2iv(location, v);
            };
        }
        if (type === gl.INT_VEC3) {
            return function(v) {
                gl.uniform3iv(location, v);
            };
        }
        if (type === gl.INT_VEC4) {
            return function(v) {
                gl.uniform4iv(location, v);
            };
        }
        if (type === gl.BOOL) {
            return function(v) {
                gl.uniform1iv(location, v);
            };
        }
        if (type === gl.BOOL_VEC2) {
            return function(v) {
                gl.uniform2iv(location, v);
            };
        }
        if (type === gl.BOOL_VEC3) {
            return function(v) {
                gl.uniform3iv(location, v);
            };
        }
        if (type === gl.BOOL_VEC4) {
            return function(v) {
                gl.uniform4iv(location, v);
            };
        }
        if (type === gl.FLOAT_MAT2) {
            return function(v) {
                gl.uniformMatrix2fv(location, false, v);
            };
        }
        if (type === gl.FLOAT_MAT3) {
            return function(v) {
                gl.uniformMatrix3fv(location, false, v);
            };
        }
        if (type === gl.FLOAT_MAT4) {
            return function(v) {
                gl.uniformMatrix4fv(location, false, v);
            };
        }
        if ((type === gl.SAMPLER_2D || type === gl.SAMPLER_CUBE) && isArray) {
            const units = [];
            for (let ii = 0; ii < info.size; ++ii) {
                units.push(textureUnit++);
            }
            return function(bindPoint, units) {
                return function(textures) {
                    gl.uniform1iv(location, units);
                    textures.forEach(function(texture, index) {
                        gl.activeTexture(gl.TEXTURE0 + units[index]);
                        gl.bindTexture(bindPoint, texture);
                    });
                };
            }(this.getBindPointForSamplerType(gl, type), units);
        }
        if (type === gl.SAMPLER_2D || type === gl.SAMPLER_CUBE) {
            return function(bindPoint, unit) {
                return function(texture) {
                    gl.uniform1i(location, unit);
                    gl.activeTexture(gl.TEXTURE0 + unit);
                    gl.bindTexture(bindPoint, texture);
                };
            }(this.getBindPointForSamplerType(gl, type), textureUnit++);
        }

        throw ('Unknown type!!!');
    }

    static createUniformSetters(gl, program) {
        const uniformSetters = { };
        const numUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);

        for (let i = 0; i < numUniforms; i++) {
            const uniformInfo = gl.getActiveUniform(program, i);
            if (!uniformInfo) {
                break;
            }

            uniformSetters[uniformInfo.name] = this.createUniformSetter(
                gl, program, uniformInfo
            );
        }

        return uniformSetters;
    }

    static createAttributeSetters(gl, program) {
        const attribSetters = { };

        const numAttribs = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
        for (let i = 0; i < numAttribs; i++) {
            const attribInfo = gl.getActiveAttrib(program, i);
            if (!attribInfo) {
                break;
            }

            const index = gl.getAttribLocation(program, attribInfo.name);
            attribSetters[attribInfo.name] = function(v) {
                gl.bindBuffer(gl.ARRAY_BUFFER, v.buffer);
                gl.enableVertexAttribArray(index);
                gl.vertexAttribPointer(
                    index,
                    v.numComponents || v.size,
                    v.type || gl.FLOAT,
                    v.normalize || false,
                    v.stride || 0,
                    v.offset || 0
                );
            };
        }

        return attribSetters;
    }

    // endregion

    // region resizeCanvasToDisplaySize

    static resizeCanvasToDisplaySize(canvas, multiplier) {
        multiplier = multiplier || 1;
        const width  = canvas.clientWidth  * multiplier | 0;
        const height = canvas.clientHeight * multiplier | 0;

        if (canvas.width !== width ||  canvas.height !== height) {
            canvas.width  = width;
            canvas.height = height;
            return true;
        }

        return false;
    }

    // endregion

    // region setBuffersAndAttributes

    static setAttributes(setters, attribs) {
        setters = setters.attribSetters || setters;
        Object.keys(attribs).forEach(function(name) {
            const setter = setters[name];
            if (setter) {
                setter(attribs[name]);
            }
        });
    }

    static setBuffersAndAttributes(gl, setters, buffers) {
        this.setAttributes(setters, buffers.attribs);

        if (buffers.indices) {
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);
        }
    }

    // endregion

    // region setUniforms

    static setUniforms(setters, ...values) {
        setters = setters.uniformSetters || setters;
        for (let uniforms of values) {
            Object.keys(uniforms).forEach(function(name) {
                const setter = setters[name];
                if (setter) {
                    setter(uniforms[name]);
                }
            });
        }
    }

    // endregion

    // region createAugmentedTypedArray

    static augmentTypedArray(typedArray, numComponents) {
        let cursor = 0;

        typedArray.push = function() {
            for (let i = 0; i < arguments.length; i++) {
                const value = arguments[i];

                if ((value.buffer && value.buffer instanceof ArrayBuffer) ||
                    value instanceof Array) {
                    for (let j = 0; j < value.length; j++) {
                        typedArray[cursor++] = value[j];
                    }
                } else {
                    typedArray[cursor++] = value;
                }
            }
        };

        typedArray.reset = function(index) {
            cursor = index || 0;
        };

        typedArray.numComponents = numComponents;
        Object.defineProperty(typedArray, 'numElements', {
            get: function() {
                return typedArray.length / typedArray.numComponents | 0;
            },
        });

        return typedArray;
    }

    static createAugmentedTypedArray(numComponents, numElements, type) {
        const Type = type || Float32Array;
        return this.augmentTypedArray(
            new Type(numComponents * numElements),
            numComponents
        );
    }

    // endregion

    // region createBufferInfoFromArrays

    // region createAttribsFromArrays

    static createMapping(obj) {
        const mapping = {};

        function filter_handler(name) {
            return name !== 'indices';
        }

        Object.keys(obj).filter(filter_handler).forEach(function(key) {
            mapping['a_' + key] = key;
        });

        return mapping;
    }

    static createBufferFromTypedArray(gl, array, type, drawType) {
        type = type || gl.ARRAY_BUFFER;
        const buffer = gl.createBuffer();
        gl.bindBuffer(type, buffer);
        gl.bufferData(type, array, drawType || gl.STATIC_DRAW);

        return buffer;
    }

    static getGLTypeForTypedArray(gl, typedArray) {
        if (typedArray instanceof Int8Array) {
            return gl.BYTE;
        } else if (typedArray instanceof Uint8Array) {
            return gl.UNSIGNED_BYTE;
        } else if (typedArray instanceof Int16Array) {
            return gl.SHORT;
        } else if (typedArray instanceof Uint16Array) {
            return gl.UNSIGNED_SHORT;
        } else if (typedArray instanceof Int32Array) {
            return gl.INT;
        } else if (typedArray instanceof Uint32Array) {
            return gl.UNSIGNED_INT;
        } else if (typedArray instanceof Float32Array) {
            return gl.FLOAT;
        } else {
            throw new Error("WTF TYPE?");
        }
    }

    static getNormalizationForTypedArray(typedArray) {
        return typedArray instanceof Uint8Array || typedArray instanceof Int8Array;
    }

    static isArrayBuffer(a) {
        return a.buffer && a.buffer instanceof ArrayBuffer;
    }

    static guessNumComponentsFromName(name, length) {
        let numComponents;

        if (name.indexOf('coord') >= 0) {
            numComponents = 2;
        } else if (name.indexOf('color') >= 0) {
            numComponents = 4;
        } else {
            numComponents = 3;
        }

        if (length % numComponents > 0) {
            throw 'can not guess numComponents. You should specify it.';
        }

        return numComponents;
    }

    static makeTypedArray(array, name) {
        if (this.isArrayBuffer(array)) {
            return array;
        }

        if (array.data &&
            this.isArrayBuffer(array.data)) {
            return array.data;
        }

        if (Array.isArray(array)) {
            array = {
                data: array,
            };
        }

        if (!array.numComponents) {
            array.numComponents = this.guessNumComponentsFromName(
                name,
                array.length
            );
        }

        let type = array.type;
        if (!type) {
            if (name === 'indices') {
                type = Uint16Array;
            }
        }
        const typedArray = this.createAugmentedTypedArray(
            array.numComponents,
            array.data.length / array.numComponents | 0,
            type
        );

        typedArray.push(array.data);
        return typedArray;
    }

    static createAttribsFromArrays(gl, arrays) {
        const mapping = this.createMapping(arrays);
        const attribs = {};

        Object.keys(mapping).forEach(function (attribName) {
            const bufferName = mapping[attribName];
            let array = arrays[bufferName];

            if (array.value) {
                attribs[attribName] = {
                    value: array.value,
                };
            } else {
                array = utils.makeTypedArray(array, bufferName);
                attribs[attribName] = {
                    buffer: utils.createBufferFromTypedArray(gl, array),
                    numComponents: array.numComponents,
                    type: utils.getGLTypeForTypedArray(gl, array),
                    normalize: utils.getNormalizationForTypedArray(array),
                }
            }
        });

        return attribs;
    }

    // endregion

    static drawBufferInfo(gl, bufferInfo, primitiveType, count, offset) {
        const indices = bufferInfo.indices;
        primitiveType = primitiveType === undefined
            ? gl.TRIANGLES
            : primitiveType;
        const numElements = count === undefined
            ? bufferInfo.numElements
            : count;
        offset = offset === undefined
            ? 0
            : offset;

        if (indices) {
            gl.drawElements(primitiveType, numElements, gl.UNSIGNED_SHORT, offset);
        } else {
            gl.drawArrays(primitiveType, offset, numElements);
        }
    }

    static getArray(array) {
        return array.length
            ? array
            : array.data;
    }

    static getNumComponents(array, arrayName) {
        return array.numComponents ||
            array.size ||
            this.guessNumComponentsFromName(
                arrayName,
                this.getArray(array).length
            );
    }

    static getNumElementsFromNonIndexedArrays(arrays) {
        const positionKeys = [
            'position', 'positions', 'a_position'
        ];
        let key;

        for (const k of positionKeys) {
            if (k in arrays) {
                key = k;
                break;
            }
        }

        key = key || Object.keys(arrays)[0];
        const array = arrays[key];
        const length = this.getArray(array).length;
        const numComponents = this.getNumComponents(array, key);
        const numElements = length / numComponents;
        if (length % numComponents > 0) {
            throw new Error(
                `numComponents ${numComponents} not correct for length ${length}`
            );
        }

        return numElements;
    }

    static createBufferInfoFromArrays(gl, arrays) {
        const bufferInfo = {
            attribs: this.createAttribsFromArrays(gl, arrays),
        };



        bufferInfo.numElements = this.getNumElementsFromNonIndexedArrays(arrays);

        return bufferInfo;
    }

    // endregion

    // region rand

    static rand(min, max) {
        return Math.random() * (max - min) + min;
    }

    // endregion
}