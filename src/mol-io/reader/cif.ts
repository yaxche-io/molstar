/**
 * Copyright (c) 2017-2018 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author David Sehnal <david.sehnal@gmail.com>
 * @author Alexander Rose <alexander.rose@weirdbyte.de>
 */

import parseText from './cif/text/parser'
import parseBinary from './cif/binary/parser'
import { Frame } from './cif/data-model'
import { toDatabaseCollection, toDatabase } from './cif/schema'
import { mmCIF_Schema, mmCIF_Database } from './cif/schema/mmcif'
import { CCD_Schema, CCD_Database } from './cif/schema/ccd'
import { BIRD_Schema, BIRD_Database } from './cif/schema/bird'

export default {
    parse: (data: string|Uint8Array) => typeof data === 'string' ? parseText(data) : parseBinary(data),
    parseText,
    parseBinary,
    toDatabaseCollection,
    toDatabase,
    schema: {
        mmCIF: (frame: Frame) => toDatabase<mmCIF_Schema, mmCIF_Database>(mmCIF_Schema, frame),
        CCD: (frame: Frame) => toDatabase<CCD_Schema, CCD_Database>(CCD_Schema, frame),
        BIRD: (frame: Frame) => toDatabase<BIRD_Schema, BIRD_Database>(BIRD_Schema, frame)
    }
}

export * from './cif/data-model'