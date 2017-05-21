/*
  Inflate.cs

  Copyright (c) 2017 Palmtree Software

  This software is released under the MIT License.
  https://opensource.org/licenses/MIT
*/

using System;

namespace MasterDataGenerator.ZIP
{
    // see http://www.futomi.com/lecture/japanese/rfc1951.html

    static class Inflate
    {
        static byte __CastAsUint8(long x)
        {
            if (x < 0 || x >= 0x100L)
                throw new Exception("Internal error(CastAsUint8): Too large byte: x=" + x.ToString());
            return ((byte)x);
        }

        static ushort __CastAsUint16(long x)
        {
            if (x < 0 || x >= 0x10000L)
                throw new Exception("Internal error(CastAsUint16): Too large ushort: x=" + x.ToString());
            return ((ushort)x);
        }

        static uint __CastAsUint32(long x)
        {
            if (x < 0 || x >= 0x100000000L)
                throw new Exception("Internal error(CastAsUint32): Too large uint: x=" + x.ToString());
            return ((uint)x);
        }

        private class HuffmanTable
        {
            public Uint32Array index0_table { get; set; }
            public int index1_maxCodeLength { get; set; }
            public int index2_minCodeLength { get; set; }
        }

        static Func<Uint8Array, HuffmanTable> buildHuffmanTable = (lengths) =>
        {
            /** @type {number} length list size. */
            var listSize = lengths.length;
            /** @type {number} max code length for table size. */
            var maxCodeLength = 0;
            /** @type {number} min code length for table size. */
            var minCodeLength = int.MaxValue;//Number.POSITIVE_INFINITY;
            /** @type {number} loop counter. */
            int i;
            /** @type {number} loop limit. */
            int il;
            /** @type {number} loop counter. */
            int j;

            // Math.max は遅いので最長の値は for-loop で取得する
            for (i = 0, il = listSize; i < il; ++i)
            {
                if (lengths[i] > maxCodeLength)
                    maxCodeLength = lengths[i];
                if (lengths[i] < minCodeLength)
                    minCodeLength = lengths[i];
            }

            /** @type {number} table size. */
            var size = 1 << maxCodeLength;
            /** @type {!(Array|Uint8Array)} huffman code table. */
            var table = new Uint32Array(size);

            /** @type {number} bit length. */
            int bitLength;
            /** @type {number} huffman code. */
            int code;
            /**
             * サイズが 2^maxlength 個のテーブルを埋めるためのスキップ長.
             * @type {number} skip length for table filling.
             */
            int skip;
            // ビット長の短い順からハフマン符号を割り当てる
            for (bitLength = 1, code = 0, skip = 2; bitLength <= maxCodeLength;)
            {
                for (i = 0; i < listSize; ++i)
                {
                    if (lengths[i] == bitLength)
                    {
                        /** @type {number} reversed code. */
                        int reversed;
                        /** @type {number} reverse temp. */
                        int rtemp;
                        // ビットオーダーが逆になるためビット長分並びを反転する
                        for (reversed = 0, rtemp = code, j = 0; j < bitLength; ++j)
                        {
                            reversed = (reversed << 1) | (rtemp & 1);
                            rtemp >>= 1;
                        }

                        // 最大ビット長をもとにテーブルを作るため、
                        // 最大ビット長以外では 0 / 1 どちらでも良い箇所ができる
                        // そのどちらでも良い場所は同じ値で埋めることで
                        // 本来のビット長以上のビット数取得しても問題が起こらないようにする
                        /** @type {number} table value. */
                        var value = (bitLength << 16) | i;
                        for (j = reversed; j < size; j += skip)
                            table[j] = (uint)value;
                        ++code;
                    }
                }

                // 次のビット長へ
                ++bitLength;
                code <<= 1;
                skip <<= 1;
            }

            return new HuffmanTable { index0_table = table, index1_maxCodeLength = maxCodeLength, index2_minCodeLength = minCodeLength };
        };

        static Uint16Array bitMasks = new Uint16Array(Array.from(
            0x0000,
            0x0001, 0x0003, 0x0007, 0x000f,
            0x001f, 0x003f, 0x007f, 0x00ff,
            0x01ff, 0x03ff, 0x07ff, 0x0fff,
            0x1fff, 0x3fff, 0x7fff, 0xffff));

        /**
         * @const
         * @type {number} max copy length for LZ77.
         */
        const int MaxCopyLength = 258;

        /**
         * huffman order
         * @const
         * @type {!(Array.<number>|Uint8Array)}
         */
        static Uint8Array Order = new Uint8Array(Array.from(
            16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15));

        /**
         * huffman dist code table.
         * @const
         * @type {!(Array.<number>|Uint16Array)}
         */
        static Uint16Array DistCodeTable = new Uint16Array(Array.from(
            0x0001, 0x0002, 0x0003, 0x0004, 0x0005, 0x0007, 0x0009, 0x000d,
            0x0011, 0x0019, 0x0021, 0x0031, 0x0041, 0x0061, 0x0081, 0x00c1,
            0x0101, 0x0181, 0x0201, 0x0301, 0x0401, 0x0601, 0x0801, 0x0c01,
            0x1001, 0x1801, 0x2001, 0x3001, 0x4001, 0x6001));

        /**
         * huffman length extra-bits table.
         * @const
         * @type {!(Array.<number>|Uint8Array)}
         */
        static Uint8Array LengthExtraTable = new Uint8Array(Array.from(
            0, 0, 0, 0, 0, 0, 0, 0,
            1, 1, 1, 1, 2, 2, 2, 2,
            3, 3, 3, 3, 4, 4, 4, 4,
            5, 5, 5, 5, 0, 0, 0));

        /**
         * huffman length code table.
         * @const
         * @type {!(Array.<number>|Uint16Array)}
         */
        static Uint16Array LengthCodeTable = new Uint16Array(Array.from(
            0x0003, 0x0004, 0x0005, 0x0006, 0x0007, 0x0008, 0x0009, 0x000a, 0x000b,
            0x000d, 0x000f, 0x0011, 0x0013, 0x0017, 0x001b, 0x001f, 0x0023, 0x002b,
            0x0033, 0x003b, 0x0043, 0x0053, 0x0063, 0x0073, 0x0083, 0x00a3, 0x00c3,
            0x00e3, 0x0102, 0x0102, 0x0102));

        /**
         * huffman dist extra-bits table.
         * @const
         * @type {!(Array.<number>|Uint8Array)}
         */
        static Uint8Array DistExtraTable = new Uint8Array(Array.from(
            0, 0, 0, 0, 1, 1, 2, 2,
            3, 3, 4, 4, 5, 5, 6, 6,
            7, 7, 8, 8, 9, 9, 10, 10,
            11, 11, 12, 12, 13, 13));

        static Func<HuffmanTable> FixedLiteralLengthTable_ctor = () =>
        {
            var lengths = new Uint8Array(288);
            var index = 0;
            var limit = lengths.length;
            while (index < limit)
            {
                lengths[index] =
                  (index <= 143) ? (byte)8 :
                  (index <= 255) ? (byte)9 :
                  (index <= 279) ? (byte)7 :
                  (byte)8;
                ++index;
            }
            return buildHuffmanTable(lengths);
        };

        static HuffmanTable FixedLiteralLengthTable = FixedLiteralLengthTable_ctor();

        /**
         * fixed huffman length code table
         * @const
         * @type {!Array}
         */
        static Func<HuffmanTable> FixedDistanceTable_ctor = () =>
        {
            var lengths = new Uint8Array(30);
            lengths.fill(5);
            return buildHuffmanTable(lengths);
        };

        /**
         * fixed huffman distance code table
         * @const
         * @type {!Array}
         */
        static HuffmanTable FixedDistanceTable = FixedDistanceTable_ctor();

        public static Uint8Array EntryPoint(Uint8Array sourceBuffer)
        {
            var sourceByteIndex = 0;
            var sourceBitIndex = 0;
            var destinationBuffer = new Uint8Array(sourceBuffer.length + 1024);
            var destinationIndex = 0;

            Action<int> _allocateBuffer = (size) =>
             {
                 while (destinationIndex + size > destinationBuffer.length)
                 {
                     var new_buffer = new Uint8Array(destinationBuffer.length + (size + 1023) / 1024 * 1024);
                     new_buffer.set(destinationBuffer);
                     destinationBuffer = new_buffer;
                 }
             };

            Action<byte> writeByte = (data) =>
            {
                _allocateBuffer(1);
                destinationBuffer[destinationIndex] = data;
                ++destinationIndex;
            };

            Action<Uint8Array> writeBytes = (array) =>
            {
                _allocateBuffer(array.length);
                destinationBuffer.set(array, destinationIndex);
                destinationIndex += array.length;
            };

            Action<int, int> rewriteBytes = (distance, length) =>
            {
                if (distance <= 0)
                    throw new Exception("Internal error(rewriteBytes): distance is zero or negative.");
                if (length <= 0)
                    throw new Exception("Internal error(rewriteBytes): distance is length or negative.");
                var pos_from = destinationIndex - distance;
                if (pos_from < 0)
                    throw new ArgumentException();
                var pos_to = destinationIndex;
                var count = length;
                _allocateBuffer(length);
                while (count-- > 0)
                    destinationBuffer[pos_to++] = destinationBuffer[pos_from++];
                destinationIndex += length;
            };

            Func<ushort> readWord = () =>
            {
                if (sourceBitIndex == 0)
                    throw new Exception("Internal error(readWord): must call readWord() after calling skipBitsUntilNextByte()");
                if (sourceByteIndex + 1 >= sourceBuffer.length)
                    throw new Exception("Unexpected EOF.");
                var data1 = sourceBuffer[sourceByteIndex++];
                var data2 = sourceBuffer[sourceByteIndex++];
                return (ushort)((data2 << 8) | data1);
            };

            Func<int, Uint8Array> readBytes = (length) =>
            {
                if (sourceBitIndex == 0)
                    throw new Exception("Internal error(readWord): must call readWord() after calling skipBitsUntilNextByte()");
                if (sourceByteIndex + length - 1 >= sourceBuffer.length)
                    throw new Exception("Unexpected EOF.");
                var result = sourceBuffer.subarray(sourceByteIndex, sourceByteIndex + length);
                sourceByteIndex += length;
                return result;
            };

            Func<int, bool, long> _readBitsImp = (bitLength, peek) =>
            {
                if (bitLength <= 0 || bitLength > 63)
                    throw new Exception("Internal error(readBits/peekBits): bitLength is out of range.");
                var bit_count = bitLength;
                var bit_index = sourceBitIndex;
                var byte_index = sourceByteIndex;
                var offset = bit_index;
                long value = 0;
                var value_shift_bits = 0;

                if (bit_index > 0)
                {
                    if (byte_index >= sourceBuffer.length)
                        throw new Exception("Unexpected EOF.");
                    var mask_bits = 8 - offset;
                    if (mask_bits > bit_count)
                        mask_bits = bit_count;
                    value = (long)sourceBuffer[byte_index] >> offset & bitMasks[mask_bits];
                    value_shift_bits = mask_bits;
                    bit_index += mask_bits;
                    if (bit_index >= 8)
                    {
                        bit_index -= 8;
                        ++byte_index;
                    }
                    bit_count -= mask_bits;
                }
                while (bit_count >= 8)
                {
                    if (byte_index >= sourceBuffer.length)
                        throw new Exception("Unexpected EOF.");
                    value |= (long)sourceBuffer[byte_index++] << value_shift_bits;
                    value_shift_bits += 8;
                    //source_bit_index += 8;
                    bit_count -= 8;
                }
                if (bit_count > 0)
                {
                    System.Diagnostics.Debug.Assert(bit_index == 0);
                    System.Diagnostics.Debug.Assert(bit_count < 8);
                    if (byte_index >= sourceBuffer.length)
                        throw new Exception("Unexpected EOF.");
                    value |= ((long)sourceBuffer[byte_index] & bitMasks[bit_count]) << value_shift_bits;
                    bit_index = bit_count;
                    System.Diagnostics.Debug.Assert(bit_index < 8);
                }
                if (value < 0)
                    throw new Exception("Internal error(readBits/peekBits): bad value: bitLength=" + bitLength.ToString() + ",value=" + value.ToString() + "(" + value.ToString("x") + ")");
                if (bitLength <= 8 && value >= 0x100)
                    throw new Exception("Internal error(readBits/peekBits): bad value: bitLength=" + bitLength.ToString() + ",value=" + value.ToString() + "(" + value.ToString("x") + ")");
                if (bitLength <= 16 && value >= 0x10000)
                    throw new Exception("Internal error(readBits/peekBits): bad value: bitLength=" + bitLength.ToString() + ",value=" + value.ToString() + "(" + value.ToString("x") + ")");
                if (bitLength <= 32 && value >= 0x100000000)
                    throw new Exception("Internal error(readBits/peekBits): bad value: bitLength=" + bitLength.ToString() + ",value=" + value.ToString() + "(" + value.ToString("x") + ")");
                if (!peek)
                {
                    sourceBitIndex = bit_index;
                    sourceByteIndex = byte_index;
                }
                return (value);
            };

            Func<int, long> readBits = (bitCount) =>
            {
                return (_readBitsImp(bitCount, false));
            };

            Func<int, long> peekBits = (bitCount) =>
            {
                return (_readBitsImp(bitCount, true));
            };

            Action skipBitsUntilNextByte = () =>
            {
                if (sourceByteIndex >= sourceBuffer.length)
                    return;
                if (sourceBitIndex == 0)
                    return;
                sourceBitIndex = 0;
                ++sourceByteIndex;
            };

            Func<HuffmanTable, long> readCodeByTable = (table) =>
            {
                /** @type {!(Array.<number>|Uint8Array)} huffman code table */
                var codeTable = table.index0_table;
                /** @type {number} */
                var maxCodeLength = table.index1_maxCodeLength;
                /** @type {number} code length & code (16bit, 16bit) */
                var codeWithLength = codeTable[__CastAsUint16(peekBits(maxCodeLength))];
                /** @type {number} code bits length */
                var codeLength = (int)(codeWithLength >> 16);// codeWithLength >>> 16;
                readBits(codeLength);
                return (codeWithLength & 0xffff);
            };

            /**
             * decode huffman code
             * @param {!Array} litlen literal and length code table.
             * @param {!Array} dist distination code table.
             */
            Action<HuffmanTable, HuffmanTable> decodeHuffman = (litlen, dist) =>
            {
                /** @type {number} huffman code. */
                ushort code;
                while ((code = __CastAsUint16(readCodeByTable(litlen))) != 256)
                {
                    // literal
                    if (code < 256)
                        writeByte((byte)code);
                    else
                    {

                        /** @type {number} table index. */
                        var ti = code - 257;
                        /** @type {number} huffman code length. */
                        var codeLength = LengthCodeTable[ti];
                        var extraLength = LengthExtraTable[ti];
                        if (extraLength > 0)
                            codeLength += __CastAsUint8(readBits(extraLength));

                        // dist code
                        code = __CastAsUint8(readCodeByTable(dist));
                        /** @type {number} huffman code distination. */
                        var codeDist = DistCodeTable[code];
                        var extraDist = DistExtraTable[code];
                        if (extraDist > 0)
                            codeDist += __CastAsUint16(readBits(extraDist));

                        // lz77 decode
                        rewriteBytes(codeDist, codeLength);
                    }
                }
            };

            Action parseUncompressedBlock = () =>
            {
                var len = readWord();
                var nlen = readWord();
                if (len != ~nlen)
                    throw new Exception("Bad LEN & NLEN field.");
                writeBytes(readBytes(len));
            };

            Action parseFixedHuffmanBlock = () =>
            {
                decodeHuffman(FixedLiteralLengthTable, FixedDistanceTable);
            };

            Action parseDynamicHuffmanBlock = () =>
            {
                /** @type {number} number of literal and length codes. */
                var hlit = __CastAsUint8(readBits(5)) + 257;
                /** @type {number} number of distance codes. */
                var hdist = __CastAsUint8(readBits(5)) + 1;
                /** @type {number} number of code lengths. */
                var hclen = __CastAsUint8(readBits(4)) + 4;
                /** @type {!(Uint8Array|Array.<number>)} code lengths. */
                var codeLengths = new Uint8Array(Order.length);
                /** @type {number} loop counter. */
                int index;
                /** @type {number} previous RLE value */
                byte prev = 0;

                // decode code lengths
                for (index = 0; index < hclen; ++index)
                    codeLengths[Order[index]] = __CastAsUint8(readBits(3));
                /** @type {!Array} code lengths table. */
                var codeLengthsTable = buildHuffmanTable(codeLengths);

                /**
                 * decode function
                 * @param {number} num number of lengths.
                 * @param {!Array} table code lengths table.
                 * @param {!(Uint8Array|Array.<number>)} lengths code lengths buffer.
                 * @return {!(Uint8Array|Array.<number>)} code lengths buffer.
                 */
                Func<int, HuffmanTable, Uint8Array, Uint8Array> decode = (num, table, lengths) =>
                {
                    for (index = 0; index < num;)
                    {
                        /** @type {number} */
                        var code = __CastAsUint8(readCodeByTable(table));
                        /** @type {number} */
                        int repeat;
                        switch (code)
                        {
                            case 16:
                                repeat = 3 + __CastAsUint8(readBits(2));
                                while (repeat-- > 0)
                                { lengths[index++] = prev; }
                                break;
                            case 17:
                                repeat = 3 + __CastAsUint8(readBits(3));
                                while (repeat-- > 0)
                                { lengths[index++] = 0; }
                                prev = 0;
                                break;
                            case 18:
                                repeat = 11 + __CastAsUint8(readBits(7));
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
                };

                /** @type {!(Uint8Array|Array.<number>)} literal and length code lengths. */
                var litlenLengths = new Uint8Array(hlit);

                /** @type {!(Uint8Array|Array.<number>)} distance code lengths. */
                var distLengths = new Uint8Array(hdist);

                decodeHuffman(
                  buildHuffmanTable(decode(hlit, codeLengthsTable, litlenLengths)),
                  buildHuffmanTable(decode(hdist, codeLengthsTable, distLengths))
                );
            };

            Func<bool> parseBlock = () =>
            {
                var header = readBits(3);
                var final = header & 0x01;
                var block_type = header >> 1;
                switch (block_type)
                {
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
                        throw new Exception("Unknown block type.: block_type=" + block_type.ToString());
                }
                return (final != 0);
            };

            while (!parseBlock())
                ;
            return destinationBuffer.slice(0, destinationIndex);
        }

    }
}