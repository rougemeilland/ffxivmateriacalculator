/*
  rawinflate.js

  Copyright (c) 2017 Palmtree Software

  This software is released under the MIT License.
  https://opensource.org/licenses/MIT
*/

(function () {
    // 型付き配列にfillやset、subarrayがサポートされていないブラウザが存在するため、代替処理を以下に記述する。
    // Internet Explorerに災いあれ!!!
    var __Uint8Array = Uint8Array;
    var __Uint8ArrayFromSize = function (size) { return new Uint8Array(size); };
    var __Uint8ArrayFromArray = function (array) { return new Uint8Array(array); };
    var __Uint8Array_fill = function (array, value, begin, end) { array.fill(value, begin, end); };
    var __Uint16Array = Uint16Array;
    var __Uint16ArrayFromSize = function (size) { return new Uint16Array(size); };
    var __Uint16ArrayFromArray = function (array) { return new Uint16Array(array); };
    var __Uint16Array_fill = function (array, value, begin, end) { array.fill(value, begin, end); };
    var __Uint32Array = Uint32Array;
    var __Uint32ArrayFromSize = function (size) { return new Uint32Array(size); };
    var __Uint32ArrayFromArray = function (array) { return new Uint32Array(array); };
    var __Uint32Array_fill = function (array, value, begin, end) { array.fill(value, begin, end); };
    var __enabledTypedArray = true;
    function __alternativeXXArray_fill(array, value, begin, end) {
        if (begin === undefined)
            begin = 0;
        if (end === undefined)
            end = array.length;
        if (begin < 0)
            begin += array.length;
        if (end < 0)
            end += src_array.length;
        for (var index = begin; index < end; ++index)
            array[index] = value;
    }
    if (!Uint8Array.prototype.fill || !Uint8Array.prototype.slice) {
        __Uint8Array = Array;
        __Uint8ArrayFromSize = function (size) { return new Array(size); };
        __Uint8ArrayFromArray = function (array) { return array; };
        __Uint8Array_fill = function (array, value, begin, end) { __alternativeXXArray_fill(array, value, begin, end); };
        __enabledTypedArray = false;
        console.log("Uint8Arrayにサポートされていないメソッドがあるため、代わりにArrayを使用します。");
    }
    if (!Uint16Array.prototype.fill || !Uint16Array.prototype.slice) {
        __Uint16Array = Array;
        __Uint16ArrayFromSize = function (size) { return new Array(size); };
        __Uint16ArrayFromArray = function (array) { return array; };
        __Uint16Array_fill = function (array, value, begin, end) { __alternativeXXArray_fill(array, value, begin, end); };
        __enabledTypedArray = false;
        console.log("Uint16Arrayにサポートされていないメソッドがあるため、代わりにArrayを使用します。");
    }
    if (!Uint32Array.prototype.fill || !Uint32Array.prototype.slice) {
        __Uint32Array = Array;
        __Uint32ArrayFromSize = function (size) { return new Array(size); };
        __Uint32ArrayFromArray = function (array) { return array; };
        __Uint32Array_fill = function (array, value, begin, end) { __alternativeXXArray_fill(array, value, begin, end); };
        __enabledTypedArray = false;
        console.log("Uint32Arrayにサポートされていないメソッドがあるため、代わりにArrayを使用します。");
    }

    // Huffmanテーブルを構築する。
    function buildHuffmanTable(lengths) {
        /** @type {number} length list size. */
        var listSize = lengths.length;
        /** @type {number} max code length for table size. */
        var maxCodeLength = 0;
        /** @type {number} min code length for table size. */
        var minCodeLength = Number.POSITIVE_INFINITY;
        /** @type {number} loop counter. */
        var i;
        /** @type {number} loop limit. */
        var il;
        /** @type {number} loop counter. */
        var j;

        // Math.max は遅いので最長の値は for-loop で取得する
        for (i = 0, il = listSize; i < il; ++i) {
            if (lengths[i] > maxCodeLength)
                maxCodeLength = lengths[i];
            if (lengths[i] < minCodeLength)
                minCodeLength = lengths[i];
        }

        /** @type {number} table size. */
        var size = 1 << maxCodeLength;
        /** @type {!(Array|Uint8Array)} huffman code table. */
        var table = __Uint32ArrayFromSize(size);

        /** @type {number} bit length. */
        var bitLength;
        /** @type {number} huffman code. */
        var code;
        /**
         * サイズが 2^maxlength 個のテーブルを埋めるためのスキップ長.
         * @type {number} skip length for table filling.
         */
        var skip;
        // ビット長の短い順からハフマン符号を割り当てる
        for (bitLength = 1, code = 0, skip = 2; bitLength <= maxCodeLength;) {
            for (i = 0; i < listSize; ++i) {
                if (lengths[i] === bitLength) {
                    /** @type {number} reversed code. */
                    var reversed;
                    /** @type {number} reverse temp. */
                    var rtemp;
                    // ビットオーダーが逆になるためビット長分並びを反転する
                    for (reversed = 0, rtemp = code, j = 0; j < bitLength; ++j) {
                        reversed = reversed << 1 | rtemp & 1;
                        rtemp >>= 1;
                    }

                    // 最大ビット長をもとにテーブルを作るため、
                    // 最大ビット長以外では 0 / 1 どちらでも良い箇所ができる
                    // そのどちらでも良い場所は同じ値で埋めることで
                    // 本来のビット長以上のビット数取得しても問題が起こらないようにする
                    /** @type {number} table value. */
                    var value = bitLength << 16 | i;
                    for (j = reversed; j < size; j += skip)
                        table[j] = value;
                    ++code;
                }
            }

            // 次のビット長へ
            ++bitLength;
            code <<= 1;
            skip <<= 1;
        }

        return [table, maxCodeLength, minCodeLength];
    }

    // ビットマスクを示す配列。
    const bitMasks = __Uint16ArrayFromArray([
        0x0000,
        0x0001, 0x0003, 0x0007, 0x000f,
        0x001f, 0x003f, 0x007f, 0x00ff,
        0x01ff, 0x03ff, 0x07ff, 0x0fff,
        0x1fff, 0x3fff, 0x7fff, 0xffff]);

    /**
     * @const
     * @type {number} max copy length for LZ77.
     */
    const MaxCopyLength = 258;

    /**
     * huffman order
     * @const
     * @type {!(Array.<number>|Uint8Array)}
     */
    const Order = __Uint8ArrayFromArray([
        16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]);

    /**
     * huffman dist code table.
     * @const
     * @type {!(Array.<number>|Uint16Array)}
     */
    const DistCodeTable = __Uint16ArrayFromArray([
        0x0001, 0x0002, 0x0003, 0x0004, 0x0005, 0x0007, 0x0009, 0x000d,
        0x0011, 0x0019, 0x0021, 0x0031, 0x0041, 0x0061, 0x0081, 0x00c1,
        0x0101, 0x0181, 0x0201, 0x0301, 0x0401, 0x0601, 0x0801, 0x0c01,
        0x1001, 0x1801, 0x2001, 0x3001, 0x4001, 0x6001]);

    /**
     * huffman length extra-bits table.
     * @const
     * @type {!(Array.<number>|Uint8Array)}
     */
    const LengthExtraTable = __Uint8ArrayFromArray([
        0, 0, 0, 0, 0, 0, 0, 0,
        1, 1, 1, 1, 2, 2, 2, 2,
        3, 3, 3, 3, 4, 4, 4, 4,
        5, 5, 5, 5, 0, 0, 0]);

    /**
     * huffman length code table.
     * @const
     * @type {!(Array.<number>|Uint16Array)}
     */
    const LengthCodeTable = __Uint16ArrayFromArray([
        0x0003, 0x0004, 0x0005, 0x0006, 0x0007, 0x0008, 0x0009, 0x000a, 0x000b,
        0x000d, 0x000f, 0x0011, 0x0013, 0x0017, 0x001b, 0x001f, 0x0023, 0x002b,
        0x0033, 0x003b, 0x0043, 0x0053, 0x0063, 0x0073, 0x0083, 0x00a3, 0x00c3,
        0x00e3, 0x0102, 0x0102, 0x0102]);

    /**
     * huffman dist extra-bits table.
     * @const
     * @type {!(Array.<number>|Uint8Array)}
     */
    const DistExtraTable = __Uint8ArrayFromArray([
        0, 0, 0, 0, 1, 1, 2, 2,
        3, 3, 4, 4, 5, 5, 6, 6,
        7, 7, 8, 8, 9, 9, 10, 10,
        11, 11, 12, 12, 13, 13]);

    /**
     * fixed huffman length code table
     * @const
     * @type {!Array}
     */
    const FixedLiteralLengthTable = (function () {
        var lengths = __Uint8ArrayFromSize(288);
        var index = 0;
        var limit = lengths.length;
        while (index < limit) {
            lengths[index] =
                index <= 143 ? 8 :
                index <= 255 ? 9 :
                index <= 279 ? 7 :
                8;
            ++index;
        }
        return buildHuffmanTable(lengths);
    })();

    /**
     * fixed huffman distance code table
     * @const
     * @type {!Array}
     */
    const FixedDistanceTable = (function () {
        var lengths = __Uint8ArrayFromSize(30);
        __Uint8Array_fill(lengths, 5);
        return buildHuffmanTable(lengths);
    })();

    // inflateのメインルーチン。
    // sourceBuffer パラメタには圧縮済みデータのバイト配列(UintArrayまたはArray)が渡される。
    // 復帰値として sourceBuffer を伸長したデータが返る。
    // 復帰値の型は、sourceBuffer が Uint8Array でありかつ Uint8Array に特定のメソッドが実装されていれば Uint8Array、そうではないのなら Array が返る。
    // <<メモ>>
    // ブラウザによっては Uint8Array が実装されていてもメソッドが一部分しか実装されていなかったり、
    // Uint8Array のアクセスのパフォーマンスに問題があるように見えたりする。
    // そのために復帰値の型がこんなけったいな仕様になってしまった。Internet Explorerに災いあれ!!!
    function internalInflate(sourceBuffer, opt) {
        if (opt === undefined)
            opt = {};
        // destinationBuffer の型の決定
        if (sourceBuffer instanceof Array) {
            destinationIsTypeArray = false;
            sourceIsTypeArray = false;
        }
        else if (sourceBuffer instanceof Uint8Array) {
            if (opt.useTypedArray) {
                destinationIsTypeArray = __enabledTypedArray;
                sourceIsTypeArray = true;
            }
            else {
                destinationIsTypeArray = false;
                sourceIsTypeArray = false;
            }
        }
        else {
            console.log("sourceBuffer instanceof Array => " + (sourceBuffer instanceof Array));
            console.log("sourceBuffer instanceof Uint8Array => " + (sourceBuffer instanceof Uint8Array));
            console.log("Object.prototype.toString.call(sourceBuffer) => " + Object.prototype.toString.call(sourceBuffer));
            throw new TypeError("Not suppoered type.");
        }

        var ___getByte;
        if (sourceIsTypeArray) {
            ___getByte = function (index) {
                return sourceBuffer[index];
            };
        }
        else {
            ___getByte = function (index) {
                var data = sourceBuffer[index];
                if ((data & ~0xff) !== 0x00)
                    throw new Error("Found large byte data.");
                return data;
            };
        }

        var allocateInitialDestinationBuffer;
        var writeByte;
        var rewriteBytes;
        var trimDestinationBuffer;
        var copyBytes;
        if (destinationIsTypeArray) {
            // destinationBuffer が Uint8Array である場合
            var __allocateBuffer = function (size) {
                while (destinationIndex + size > destinationBuffer.length) {
                    var newdestinationBuffer = new Uint8Array(destinationBuffer.length + (size + 1023) / 1024 * 1024);
                    newdestinationBuffer.set(destinationBuffer);
                    destinationBuffer = newdestinationBuffer;
                }
            };
            allocateInitialDestinationBuffer = function () {
                return new Uint8Array(0);
            };
            writeByte = function (data) {
                if ((data & ~0xff) !== 0x00)
                    throw new Error("Internal error(writeByte): data is too large.");
                __allocateBuffer(1);
                destinationBuffer[destinationIndex] = data;
                ++destinationIndex;
            };
            rewriteBytes = function (distance, length) {
                if (distance <= 0)
                    throw new Error("Internal error(rewriteBytes): distance is zero or negative.");
                if (length <= 0)
                    throw new Error("Internal error(rewriteBytes): distance is length or negative.");
                var pos_from = destinationIndex - distance;
                if (pos_from < 0)
                    throw new ArgumentException();
                var pos_to = destinationIndex;
                var count = length;
                __allocateBuffer(length);
                while (count-- > 0)
                    destinationBuffer[pos_to++] = destinationBuffer[pos_from++];
                destinationIndex += length;
            };
            trimDestinationBuffer = function () {
                // 末尾に余分な領域があるかもしれないので、実データ長に切り詰める。
                destinationBuffer = destinationBuffer.slice(0, destinationIndex);
            };
            copyBytes = function (length) {
                if (sourceBitIndex === 0)
                    throw new Error("Internal error(copyBytes): must call copyBytes() after calling skipBitsUntilNextByte()");
                if (sourceByteIndex + length - 1 >= sourceBuffer.length)
                    throw new Error("Unexpected EOF.");
                __allocateBuffer(length);
                destinationBuffer.set(sourceBuffer.subarray(sourceByteIndex, sourceByteIndex + length), destinationIndex);
                sourceByteIndex += length;
                destinationIndex += length;
            };
        }
        else {
            // destinationBuffer が Array である場合
            allocateInitialDestinationBuffer = function () { return []; };
            writeByte = function (data) {
                if ((data & ~0xff) !== 0x00)
                    throw new Error("Internal error(writeByte): data is too large.");
                destinationBuffer.push(data);
                ++destinationIndex;
            };
            rewriteBytes = function (distance, length) {
                if (distance <= 0)
                    throw new Error("Internal error(rewriteBytes): distance is zero or negative.");
                if (length <= 0)
                    throw new Error("Internal error(rewriteBytes): distance is length or negative.");
                var pos_from = destinationIndex - distance;
                if (pos_from < 0)
                    throw new ArgumentException();
                var count = length;
                while (count-- > 0)
                    destinationBuffer.push(destinationBuffer[pos_from++]);
                destinationIndex += length;
            };
            trimDestinationBuffer = function () {
                // destinationBuffer が Array の場合には末尾に余分な領域はないので何もしない。
            };
            copyBytes = function (length) {
                if (sourceBitIndex === 0)
                    throw new Error("Internal error(copyBytes): must call copyBytes() after calling skipBitsUntilNextByte()");
                if (sourceByteIndex + length - 1 >= sourceBuffer.length)
                    throw new Error("Unexpected EOF.");
                _allocateBuffer(length);
                for (var index = 0; index < length; ++index) {
                    destinationBuffer.push(___getByte(sourceByteIndex++));
                    ++destinationIndex;
                }
            };
        }

        // 入出力状態の初期化
        var sourceByteIndex = 0;
        var sourceBitIndex = 0;
        var destinationBuffer = allocateInitialDestinationBuffer();
        var destinationIndex = 0;

        function readWord() {
            if (sourceBitIndex === 0)
                throw new Error("Internal error(readWord): must call readWord() after calling skipBitsUntilNextByte()");
            if (sourceByteIndex + 1 >= sourceBuffer.length)
                throw new Error("Unexpected EOF.");
            var data1 = ___getByte(sourceByteIndex++);
            var data2 = ___getByte(sourceByteIndex++);
            return data2 << 8 | data1;
        }

        function _readBitsImp(bitLength, peek) {
            if (bitLength <= 0 || bitLength > 63)
                throw new Error("Internal error(readBits/peekBits): bitLength is out of range.");
            var bit_count = bitLength;
            var bit_index = sourceBitIndex;
            var byte_index = sourceByteIndex;
            var offset = bit_index;
            var value = 0;
            var value_shift_bits = 0;

            if (bit_index > 0) {
                if (byte_index >= sourceBuffer.length)
                    throw new Error("Unexpected EOF.");
                var mask_bits = 8 - offset;
                if (mask_bits > bit_count)
                    mask_bits = bit_count;
                value = ___getByte(byte_index) >> offset & bitMasks[mask_bits];
                value_shift_bits = mask_bits;
                bit_index += mask_bits;
                if (bit_index >= 8) {
                    bit_index -= 8;
                    ++byte_index;
                }
                bit_count -= mask_bits;
            }
            while (bit_count >= 8) {
                if (byte_index >= sourceBuffer.length)
                    throw new Error("Unexpected EOF.");
                value |= ___getByte(byte_index++) << value_shift_bits;
                value_shift_bits += 8;
                //source_bit_index += 8;
                bit_count -= 8;
            }
            if (bit_count > 0) {
                //System.Diagnostics.Debug.Assert(bit_index === 0);
                //System.Diagnostics.Debug.Assert(bit_count < 8);
                if (byte_index >= sourceBuffer.length)
                    throw new Error("Unexpected EOF.");
                value |= (___getByte(byte_index) & bitMasks[bit_count]) << value_shift_bits;
                bit_index = bit_count;
                //System.Diagnostics.Debug.Assert(bit_index < 8);
            }
            if (value < 0)
                throw new Error("Internal error(readBits/peekBits): bad value: bitLength=" + bitLength.ToString() + ",value=" + value.ToString() + "(" + value.ToString("x") + ")");
            if (bitLength <= 8 && value >= 0x100)
                throw new Error("Internal error(readBits/peekBits): bad value: bitLength=" + bitLength.ToString() + ",value=" + value.ToString() + "(" + value.ToString("x") + ")");
            if (bitLength <= 16 && value >= 0x10000)
                throw new Error("Internal error(readBits/peekBits): bad value: bitLength=" + bitLength.ToString() + ",value=" + value.ToString() + "(" + value.ToString("x") + ")");
            if (bitLength <= 32 && value >= 0x100000000)
                throw new Error("Internal error(readBits/peekBits): bad value: bitLength=" + bitLength.ToString() + ",value=" + value.ToString() + "(" + value.ToString("x") + ")");
            if (!peek) {
                sourceBitIndex = bit_index;
                sourceByteIndex = byte_index;
            }
            return value;
        }

        function readBits(bitCount) {
            return _readBitsImp(bitCount, false);
        }

        function peekBits(bitCount) {
            return _readBitsImp(bitCount, true);
        }

        function skipBitsUntilNextByte() {
            if (sourceByteIndex >= sourceBuffer.length)
                return;
            if (sourceBitIndex === 0)
                return;
            sourceBitIndex = 0;
            ++sourceByteIndex;
        }

        function readCodeByTable(table) {
            /** @type {!(Array.<number>|Uint8Array)} huffman code table */
            var codeTable = table[0];
            /** @type {number} */
            var maxCodeLength = table[1];
            /** @type {number} code length & code (16bit, 16bit) */
            var codeWithLength = codeTable[peekBits(maxCodeLength)];
            /** @type {number} code bits length */
            var codeLength = codeWithLength >> 16;// codeWithLength >>> 16;
            readBits(codeLength);
            return codeWithLength & 0xffff;
        }

        /**
         * decode huffman code
         * @param {!Array} litlen literal and length code table.
         * @param {!Array} dist distination code table.
         */
        function decodeHuffman(litlen, dist) {
            /** @type {number} huffman code. */
            var code;
            while ((code = readCodeByTable(litlen)) !== 256) {
                // literal
                if (code < 256)
                    writeByte(code);
                else {

                    /** @type {number} table index. */
                    var ti = code - 257;
                    /** @type {number} huffman code length. */
                    var codeLength = LengthCodeTable[ti];
                    var extraLength = LengthExtraTable[ti];
                    if (extraLength > 0)
                        codeLength += readBits(extraLength);

                    // dist code
                    code = readCodeByTable(dist);
                    /** @type {number} huffman code distination. */
                    var codeDist = DistCodeTable[code];
                    var extraDist = DistExtraTable[code];
                    if (extraDist > 0)
                        codeDist += readBits(extraDist);

                    // lz77 decode
                    rewriteBytes(codeDist, codeLength);
                }
            }
        }

        function parseUncompressedBlock() {
            var len = readWord();
            var nlen = readWord();
            if (len !== ~nlen)
                throw new Error("Bad LEN & NLEN field.");
            copyBytes(len);
        }

        function parseFixedHuffmanBlock() {
            decodeHuffman(FixedLiteralLengthTable, FixedDistanceTable);
        }

        function parseDynamicHuffmanBlock() {
            /** @type {number} number of literal and length codes. */
            var hlit = readBits(5) + 257;
            /** @type {number} number of distance codes. */
            var hdist = readBits(5) + 1;
            /** @type {number} number of code lengths. */
            var hclen = readBits(4) + 4;
            /** @type {!(Uint8Array|Array.<number>)} code lengths. */
            var codeLengths = __Uint8ArrayFromSize(Order.length);
            /** @type {number} loop counter. */
            var index;
            /** @type {number} previous RLE value */
            var prev = 0;

            // decode code lengths
            for (index = 0; index < hclen; ++index)
                codeLengths[Order[index]] = readBits(3);
            /** @type {!Array} code lengths table. */
            var codeLengthsTable = buildHuffmanTable(codeLengths);

            /**
             * decode function
             * @param {number} num number of lengths.
             * @param {!Array} table code lengths table.
             * @param {!(Uint8Array|Array.<number>)} lengths code lengths buffer.
             * @return {!(Uint8Array|Array.<number>)} code lengths buffer.
             */
            function decode(num, table, lengths) {
                for (index = 0; index < num;) {
                    /** @type {number} */
                    var code = readCodeByTable(table);
                    /** @type {number} */
                    var repeat;
                    switch (code) {
                        case 16:
                            repeat = 3 + readBits(2);
                            while (repeat-- > 0)
                            { lengths[index++] = prev; }
                            break;
                        case 17:
                            repeat = 3 + readBits(3);
                            while (repeat-- > 0)
                            { lengths[index++] = 0; }
                            prev = 0;
                            break;
                        case 18:
                            repeat = 11 + readBits(7);
                            while (repeat-- > 0)
                            { lengths[index++] = 0; }
                            prev = 0;
                            break;
                        default:
                            lengths[index++] = code;
                            prev = code;
                            break;
                    }
                }
                return lengths;
            }

            /** @type {!(Uint8Array|Array.<number>)} literal and length code lengths. */
            var litlenLengths = __Uint8ArrayFromSize(hlit);

            /** @type {!(Uint8Array|Array.<number>)} distance code lengths. */
            var distLengths = __Uint8ArrayFromSize(hdist);

            decodeHuffman(
              buildHuffmanTable(decode(hlit, codeLengthsTable, litlenLengths)),
              buildHuffmanTable(decode(hdist, codeLengthsTable, distLengths))
            );
        }

        var progressCount = 0;
        var progressCountDelta = Math.floor(sourceBuffer.length / 100);

        function parseBlock() {
            var header = readBits(3);
            var final = header & 0x01;
            var block_type = header >> 1;
            switch (block_type) {
                case 0: // STORED BLOCK
                    parseUncompressedBlock();
                    break;
                case 1: // STATIC TREES
                    parseFixedHuffmanBlock();
                    break;
                case 2: // DYNAMIC TREES
                    parseDynamicHuffmanBlock();
                    break;
                case 3: // RESERVED(error)
                default:
                    throw new Error("Unknown block type.: block_type=" + block_type.ToString());
            }
            return final !== 0;
        }

        function doAsyncLoop(callback) {
            while (!parseBlock()) {
                if (sourceByteIndex >= progressCount + progressCountDelta) {
                    progressCount = sourceByteIndex;
                    callback("progress", sourceByteIndex / sourceBuffer.length);
                    setTimeout(function () {
                        doAsyncLoop(callback);
                    }, 10);
                    return;
                }
            }
            //console.log("sourceByteIndex + sourceBitIndex / 8 === " + (sourceByteIndex + sourceBitIndex / 8));
            // sourceBufferの最終バイトは途中のビットで終わっている可能性もあるため、正常に終わった場合でもsourceByteIndexの値はsourceBuffer-1であることがある。
            if (sourceByteIndex + sourceBitIndex / 8 <= sourceBuffer.length - 1)
                throw new Error("Unexpected data after FINAL");
            trimDestinationBuffer();
            callback("progress", 1.0);
            callback("complete", destinationBuffer);
        }

        if (opt.callback === undefined) {
            while (!parseBlock())
                ;
            //console.log("sourceByteIndex + sourceBitIndex / 8 === " + (sourceByteIndex + sourceBitIndex / 8));
            // sourceBufferの最終バイトは途中のビットで終わっている可能性もあるため、正常に終わった場合でもsourceByteIndexの値はsourceBuffer-1であることがある。
            if (sourceByteIndex + sourceBitIndex / 8 <= sourceBuffer.length - 1)
                throw new Error("Unexpected data after FINAL");
            trimDestinationBuffer();
            return destinationBuffer;
        }
        else {
            doAsyncLoop(opt.callback);
        }

    }

    Array.prototype.inflate = function (callback) { return internalInflate(this, callback); };
    Uint8Array.prototype.inflate = function (callback) { return internalInflate(this, callback); };
})();