/**
 * @file    Wrapper for buffers that facilitate operations useful for
 *          interacting with RuneScape and its files.
 */

/**
 * A wrapper for buffers that keeps a caret of the next byte to read in
 * the buffer. It also has functions to get unsigned bytes, shorts, and ints
 * from the buffer beginning at the caret.
 * @param {Uint8Array} data The buffer to wrap.
 */
function JagBuffer(data) {
    this.caret = 0;
    this.data = data;

    /**
     * Gets an unsigned byte from where the caret is in the buffer, and
     * increments the caret by one.
     */
    this.getUByte = function () {
        if (this.caret + 1 >= this.size()) {
            return -1;
        }
    
        /// The >>> 0 part is to keep things unsigned.
        const out = this.data[this.caret] >>> 0;
    
        this.caret += 1;
        return out;
    };

    /**
     * Gets an unsigned short from two bytes in the buffer, starting at and
     * including the caret of the JagBuffer, and increments the caret by two.
     * @returns {number} The unsigned short.
     */
    this.getUShort = function () {
        if (this.caret + 2 >= this.size()) {
            return -1;
        }
    
        let out = ((this.data[this.caret] & 0xff) << 8) >>> 0;
        out = (out | (this.data[this.caret + 1] & 0xff)) >>> 0;
    
        this.caret += 2;
        return out;
    }

    /**
     * Gets an unsigned int from three bytes in the buffer, starting at and
     * including the caret of the JagBuffer, and increments the caret by three.
     * @returns {number} The unsigned int.
     */
    this.getUInt3 = function () {
        if (this.caret + 3 >= this.size()) {
            return -1;
        }
    
        let out = ((this.data[this.caret] & 0xff) << 16) >>> 0;
        out = (out | ((this.data[this.caret + 1] & 0xff) << 8)) >>> 0;
        out = (out | (this.data[this.caret + 2] & 0xff)) >>> 0;
    
        this.caret += 3;
        return out;
    };

    /**
     * Gets an unsigned int from four bytes in the buffer, starting at and
     * including the caret of the JagBuffer, and increments the caret by four.
     * @returns {number} The unsigned int.
     */
    this.getUInt4 = function () {
        if (this.caret + 4 >= this.size()) {
            return -1;
        }
    
        let out = ((this.data[this.caret] & 0xff) << 24) >>> 0;
        out = (out | ((this.data[this.caret + 1] & 0xff) << 16)) >>> 0;
        out = (out | ((this.data[this.caret + 2] & 0xff) << 8)) >>> 0;
        out = (out | (this.data[this.caret + 3] & 0xff)) >>> 0;
    
        this.caret += 4;
        return out;
    };

    this.size = function () {
        return this.data.byteLength
    };
}

module.exports.JagBuffer = JagBuffer;