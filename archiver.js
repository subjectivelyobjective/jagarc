/**
 * @file Front-end for extracting from jag archives. 
 */

const argv = require('yargs')
    .option('d', {
       alias: 'destination',
       default: process.cwd,
       describe: 'Directory to extract the entries to.' 
    })
    .option('e', {
        alias: 'extract',
        default: '',
        describe: 'Entry to be extracted from the given archive.\n\
            If no arguments are given, all of the entries will be extracted.'
    })
    .option('i', {
        alias: 'input',
        demandOption: true,
        describe: 'Path to the archive to extract from.'
    })
    .parse();

const fs = require('fs');
const path = require('path');

const jagarc = require('./jagarc.js');

const archive = new jagarc.JagArchive();

if (typeof(argv.input) !== 'string') {
    return console.error('Input option must have an argument');
}

jagarc.loadArchive(archive, argv.input, err => {
    if (err) {
        return console.error(err);
    }

    let entriesRequested = [];
    if (argv.extract && typeof(argv.extract) === 'string') {
        entriesRequested = argv.extract.split(' ');
    } else {
        entriesRequested = 'all';
    }

    if (entriesRequested === 'all') {
        for (let entryIdx in archive.entries) {
            const entry = archive.entries[entryIdx];

            const fileName = entryIdx;
            const filePath = path.join(argv.destination, fileName);
            
            fs.writeFileSync(filePath, entry.data);
        }
    } else {
        for (let entryIdx in entriesRequested) {
            const entryName = entriesRequested[entryIdx];
            const entryData = archive.get(entryName);

            if (!entryData) {
                return console.error('Failed to find entry: ' + entryName + '.');
            }

            const filePath = path.join(argv.destination, entryName);
            fs.writeFileSync(filePath, entryData);
        }
    }
});