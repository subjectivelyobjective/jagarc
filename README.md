# jagarc
Javascript library and front-end for reading from Jagex Ltd.'s proprietary jag archive format
for Runescape Classic.

## Front-end Usage
archiver.js is the front-end for extracting files from an archive.

Currently, the -i flag is required as only read-only functionality is
implemented. If the -e flag is omitted, then all of the entries
of the jag archive are dumped. Note that the filenames of entries cannot be 
known by just reading from the archive, so dumping all of the entries in an 
archive will write the entries with their respective index numbers as their 
file names. Specifically requested files are saved with their file name.
If the -d flag is omitted, then the entries will be extracted
to your current working directory.

To extract an entry:
```
$ node archiver.js -i path/to/archive.jag -e example.tga -d path/to/extract/to
```

To dump all of the entries in an archive:
```
$ node archiver.js -i path/to/archive.jag -d path/to/extract/to
```

## Example
This would extract the old Jagex logo from jagex.jag:
```
$ node archiver.js -i jagex.jag -e logo.tga
```

## Library Usage
```
const jagarc = require('jagarc');

const fonts = new jagarc.JagArchive();

// Note that the second argument could also be a UintArray8 buffer of the 
// archive.
jagarc.loadArchive(fonts, './cache/fonts1.jag', err => {
    if (err) {
        return console.error('Oopsies!');
    }

    const helvetica11Bitmap = fonts.get('h11p.jf');

    // Do awesome stuff with helvetica11Bitmap.
});
```

## Credits
Adapted from https://github.com/hikilaka/rs.c/.

## License
This program is free software: you can redistribute it and/or modify it 
under the terms of the GNU Affero General Public License as published by 
the Free Software Foundation, either version 3 of the License, or (at your 
option) any later version.

This program is distributed in the hope that it will be useful, but WITHOUT 
ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or 
FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License 
for more details.

You should have received a copy of the GNU Affero General Public License 
along with this program. If not, see http://www.gnu.org/licenses/.