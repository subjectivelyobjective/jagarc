/**
 * @file Library for working with jag archives.
 */

const bzip2 = require('compressjs').Bzip2;
const Uint = require('overflow-js').Overflow.uint;

const jagBuf = require('./jagbuf.js');

/**
 * Node.js's fs if we're in node.
 */
let fs;

/**
 * Instance of FileReader if we're in a browser.
 */
let reader;

/**
 * 'Bzip2' magic, with level 1 compression specified.
 */
const bzHeader = new Uint8Array([66, 90, 104, 49])

/**
 * Represents a jag archive.
 * @param {JagEntry[]} [entries]
 */
function JagArchive(entries = null) {
    if (entries) {
        this.entries = entries;
        this.numEntries = entries.length;
    } else {
        this.entries = [];
        this.numEntries = 0;
    }

    this.get = function (entryName) {
        let hash = new Uint();

        const chars = entryName.toUpperCase().split('');
        for (let ch in chars) {
            hash = (hash.times(61)).plus(chars[ch].charCodeAt(0) - 32);
        }

        hash = hash.value;

        // console.log('Calculated hash for requested entry: ' + hash);

        for (let entryIdx in this.entries) {
            const entry = this.entries[entryIdx];
            if (entry.hash === hash) {
                return entry.data;
            }
        }

        return null; // We couldn't find the entry with the given name.
    };
}

/**
 * Represents an entry in a jag archive.
 * @param {Uint8Array} [data]
 * @param {number|Uint} [hash]
 */
function JagEntry(data, hash) {
    if (data) {
        this.data = data;
    } else {
        this.data = new Uint8Array();
    }

    if (hash) {
        this.hash = hash;
    } else {
        this.hash = -1;
    }

    this.size = () => {return this.data.length};
}

/**
 * Adds the bzip2 magic with level 1 compression specified to the buffer.
 * @param {Uint8Array} data
 * @returns {Uint8Array} The newly headered data.
*/
function addBzipHeader(data) {
    const bzFile = new Uint8Array(bzHeader.length + data.length);
    bzFile.set(bzHeader);
    bzFile.set(data, bzHeader.length);
    return bzFile;
}

/**
 * Determines if we're running in a browser, assuming "window" isn't defined
 * somehow outside of a browser.
 * @returns {boolean} true if we're in a browser, and false if we're not.
 */
function isInBrowser() {
    return !(typeof(window) === 'undefined');
}

/**
 * Takes a path to a jag archive, or the blob of it, and puts it into
 * the JagArchive instance.
 * @callback done
 * @param {JagArchive} archive 
 * @param {(string|Uint8Array)} file  
 */
function loadArchive(archive, file, done) {
    if (!archive || !file) {
        return done(new Error('Invalid JagArchive instance or archive file.'));
    }

    if (isInBrowser()) {
        // TODO
        return done(new Error('wait pls'));
    } else {
        if (!fs) {
            fs = require('fs');
        }

        if (typeof(file) === 'string') {
            file = fs.readFileSync(file)
        }

        loadArchiveFromBlob(archive, file, err => {
            return done(err, archive);
        });
    }
}

/**
 * Takes the blob of a jag archive and puts it into the JagArchive instance.
 * @callback done
 * @param {JagArchive} archive 
 * @param {Uint8Array} blob
 */
function loadArchiveFromBlob(archive, blob, done) {
    // The header that comes with a jag archive specifies the decompressed and
    // compressed size of the archive in bytes.
    let headerBuf = new Uint8Array(blob.slice(0, 7));
    headerBuf = new jagBuf.JagBuffer(headerBuf);

    let decompressedSize = headerBuf.getUInt3();
    let compressedSize = headerBuf.getUInt3();

    if (decompressedSize === -1 || compressedSize === -1) {
        return done(new Error('Failed to read header.'));
    }

    let archiveData =
        blob.slice(headerBuf.caret, compressedSize + headerBuf.caret + 1);

    if (decompressedSize !== compressedSize) {
        if (!fs) {
            fs = require('fs');
        }

        // Jagex left out the Bzip header
        const bzFile = addBzipHeader(archiveData);

        let decompressedData;
        try {
            decompressedData = bzip2.decompressFile(bzFile);
            if (!decompressedData) {
                throw new Error('Failed to decompress archive.');
            }
        } catch (err) {
            return done(err);
        }
        
        archiveData = decompressedData;
    }

    readEntries(archive, archiveData, (err, archive) => {
        if (err) {
            return done(err);
        }

        done(err, archive);
    });
}

/**
 * Reads the decompressed archive blob into JagEntries and puts them into
 * the archive instance, decompressing any compressed entries as needed.
 * @callback done
 * @param {JagArchive} archive 
 * @param {Uint8Array} archiveData 
 */
function readEntries(archive, archiveData, done) {
    const archiveBuf = new jagBuf.JagBuffer(archiveData);

    const numEntries = archiveBuf.getUShort();
    if (numEntries === -1) {
        return done(new Error('Failed to read number of entries.'));
    }
    archive.numEntries = numEntries;

    // console.log('Reading ' + numEntries + ' entries...\n');

    let dataPtr = archiveBuf.caret + (archive.numEntries * 10);

    for (let i = 0; i < archive.numEntries; i++) {
        const hash = archiveBuf.getUInt4();

        if (hash === -1) {
            return done(new Error('Failed to get hash for entry: ' + i));
        }

        const decompressedSize = archiveBuf.getUInt3();
        if (decompressedSize === -1) {
            return done(
                new Error('Failed to get decompressed size for entry: ' + i));
        }

        const compressedSize = archiveBuf.getUInt3();
        if (compressedSize === -1) {
            return done(
                new Error('Failed to get compressed size for entry: ' + i));
        }

        let data =
            archiveBuf.data.slice(dataPtr, dataPtr + compressedSize + 1);

        // If this entry is compressed, add the header and decompress it.
        if (decompressedSize !== compressedSize) {
            try {
                data = addBzipHeader(data);
                data = bzip2.decompressFile(data);
            } catch (err) {
                return done(err);
            }
        }
        
        archive.entries[i] = new JagEntry(data, hash);

        // console.log('Read entry with hash ' + hash +
        //     ' of size ' + data.length + ' bytes.\n');

        dataPtr += compressedSize;
    }

    done(false, archive);
}

module.exports.JagArchive = JagArchive;
module.exports.loadArchive = loadArchive;