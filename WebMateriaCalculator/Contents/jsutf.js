/*
  jsutf.js

  Copyright (c) 2017 Palmtree Software

  This software is released under the MIT License.
  https://opensource.org/licenses/MIT
*/

(function () {
    const fall_back_char = 0xfffd;
    const normal_bom_char = 0xfeff;
    const reverse_bom_char = 0xfffe;

    // ワード配列からUNICODEを得る
    //   src_getter: 引数なし、復帰値が入力ワード値である関数。EOFである場合はundefined、入力データがワードに満たない場合は-1。
    //   dst_setter: 引数が出力UNICODE、復帰値なしである関数。
    function InternalCodeDecoder(src_getter, dst_setter) {
        var eos = false;
        while (!eos) {
            var c1 = src_getter();
            if (c1 === undefined)
                eos = true;
            else {
                var exists_additional_word;
                var code;
                if (c1 < 0) {
                    code = fall_back_char;
                    exists_additional_word = false;
                }
                else if (c1 < 0xd800) {
                    code = c1;
                    exists_additional_word = false;
                }
                else if (c1 < 0xdc00) {
                    code = c1;
                    exists_additional_word = true;
                }
                else if (c1 < 0xe000) {
                    code = fall_back_char;
                    exists_additional_word = false;
                }
                else if (c1 < 0x10000) {
                    code = c1;
                    exists_additional_word = false;
                }
                else {
                    code = fall_back_char;
                    exists_additional_word = false;
                }
                if (exists_additional_word) {
                    var c2 = src_getter();
                    if (c2 === undefined) {
                        code = fall_back_char;
                        eos = true;
                    }
                    else if (c2 < 0xdc00 || c2 >= 0xe000)
                        code = fall_back_char;
                    else
                        code = ((code & 0x3ff) << 10 | c2 & 0x3ff) + 0x10000;
                }
                dst_setter(code);
            }
        }
    }

    // UICODEからワード値を得る
    //   unicode: 入力UNICODE。
    //   dst_setter: 引数が出力ワード値、復帰値なしである関数。
    function InternalCodeEncoder(unicode, dst_setter) {
        if (unicode < 0)
            unicode = fall_back_char;
        if (unicode < 0x10000)
            dst_setter(unicode);
        else {
            var code = unicode - 0x10000;
            var c1 = code >> 10;
            var c2 = code & 0x3ff;
            if (c1 >= 0x400)
                dst_setter(fall_back_char);
            else {
                dst_setter(c1 + 0xd800);
                dst_setter(c2 + 0xdc00);
            }
        }
    }

    // バイト配列からUNICODEを得る
    //   src_getter: 引数なし、復帰値が入力バイト値である関数。EOFである場合はundefined。
    //   dst_setter: 引数が出力UNICODE、復帰値なしである関数。
    function UTF8Decoder(src_getter, dst_setter) {
        var eos = false;
        while (!eos) {
            var c1 = src_getter();
            if (c1 === undefined)
                eos = true;
            else {
                var additional_byte_count;
                var code;
                if ((c1 & ~0xff) !== 0) {
                    code = fall_back_char;
                    additional_byte_count = 0;
                }
                else if ((c1 & 0x80) === 0x00) {
                    code = c1 & 0x7f;
                    additional_byte_count = 0;
                }
                else if ((c1 & 0xe0) === 0xc0) {
                    code = c1 & 0x1f;
                    additional_byte_count = 1;
                }
                else if ((c1 & 0xf0) === 0xe0) {
                    code = c1 & 0x0f;
                    additional_byte_count = 2;
                }
                else if ((c1 & 0xf8) === 0xf0) {
                    code = c1 & 0x07;
                    additional_byte_count = 3;
                }
                else if ((c1 & 0xfc) === 0xf8) {
                    code = c1 & 0x03;
                    additional_byte_count = 4;
                }
                else if ((c1 & 0xfe) === 0xfc) {
                    code = c1 & 0x01;
                    additional_byte_count = 5;
                }
                else {
                    code = fall_back_char;
                    additional_byte_count = 0;
                }
                for (var count = 0; count < additional_byte_count; ++count) {
                    var c = src_getter();
                    if (c < 0x80 || c > 0xbf) {
                        code = fall_back_char;
                        break;
                    }
                    code = code << 6 | c & 0x3f;
                }
                dst_setter(code);
            }
        }
    }

    // UICODEからバイト値を得る
    //   unicode: 入力UNICODE。
    //   dst_setter: 引数が出力バイト値、復帰値なしである関数。
    function UTF8Encoder(unicode, dst_setter) {
        if (unicode < 0 || unicode > 0x7fffffff)
            unicode = fall_back_char;
        if (unicode <= 0x0000007f)
            dst_setter(unicode & 0x7f);
        else if (unicode <= 0x000007ff) {
            dst_setter(unicode >> 6 & 0x1f | 0xc0);
            dst_setter(unicode & 0x3f | 0x80);
        }
        else if (unicode <= 0x0000ffff) {
            dst_setter(unicode >> 12 & 0x0f | 0xe0);
            dst_setter(unicode >> 6 & 0x3f | 0x80);
            dst_setter(unicode & 0x3f | 0x80);
        }
        else if (unicode <= 0x001fffff) {
            dst_setter(unicode >> 18 & 0x07 | 0xf0);
            dst_setter(unicode >> 12 & 0x3f | 0x80);
            dst_setter(unicode >> 6 & 0x3f | 0x80);
            dst_setter(unicode & 0x3f | 0x80);
        }
        else if (unicode <= 0x03ffffff) {
            dst_setter(unicode >> 24 & 0x03 | 0xf8);
            dst_setter(unicode >> 18 & 0x3f | 0x80);
            dst_setter(unicode >> 12 & 0x3f | 0x80);
            dst_setter(unicode >> 6 & 0x3f | 0x80);
            dst_setter(unicode & 0x3f | 0x80);
        }
        else {
            dst_setter(unicode >> 30 & 0x01 | 0xfc);
            dst_setter(unicode >> 24 & 0x3f | 0x80);
            dst_setter(unicode >> 18 & 0x3f | 0x80);
            dst_setter(unicode >> 12 & 0x3f | 0x80);
            dst_setter(unicode >> 6 & 0x3f | 0x80);
            dst_setter(unicode & 0x3f | 0x80);
        }
    }

    function internalToStringByUTF8Encoding() {
        var byte_array = this,
            text = "";
        if (byte_array.length <= 0)
            return text;

        function handle_word(word_value) {
            text += String.fromCharCode(word_value);
        }

        function handle_unicode(unicode) {
            if (unicode === normal_bom_char || unicode === reverse_bom_char) {
                /// BOMなので無視する
            }
            else {
                InternalCodeEncoder(unicode, handle_word);
            }
        }

        var source_index = 0;
        function read_byte() {
            return source_index >= byte_array.length ? undefined : byte_array[source_index++] & 0xff;
        }

        UTF8Decoder(read_byte, handle_unicode);
        return text;
    }

    Array.prototype.toStringByUTF8Encoding = internalToStringByUTF8Encoding;
    Uint8Array.prototype.toStringByUTF8Encoding = internalToStringByUTF8Encoding;

    function intenalToByteArrayByUTF8Encoding(byte_order_mark) {
        var text = this,
            byte_array = [];
        if (byte_order_mark === undefined)
            byte_order_mark = false;
        if (text.length <= 0)
            return byte_array;

        function handle_byte(byte_value) {
            byte_array.push(byte_value);
        }

        function handle_unicode(unicode) {
            //console.log("output 0x" + unicode.toString(16));
            UTF8Encoder(unicode, handle_byte);
        }

        var source_index = 0;
        function read_char() {
            return source_index >= text.length ? undefined : text.charCodeAt(source_index++);
        }

        if (byte_order_mark)
            UTF8Encoder(normal_bom_char, handle_byte);
        InternalCodeDecoder(read_char, handle_unicode);
        return new Uint8Array(byte_array);
    }

    String.prototype.toByteArrayByUTF8Encoding = intenalToByteArrayByUTF8Encoding;

    function internalToStringByUTF16Encoding(big_endian) {
        var byte_array = this,
            text = "";
        if (big_endian === undefined)
            big_endian = true;
        if (byte_array.length <= 0)
            return text;

        function handle_word(word_value) {
            text += String.fromCharCode(word_value);
        }

        var source_index = 0;
        function read_word() {
            if (source_index >= byte_array.length)
                return undefined;
            else if (source_index + 1 >= byte_array.length) {
                source_index = byte_array.length;
                return -1;
            }
            else {
                var c1 = byte_array[source_index];
                ++source_index;
                var c2 = byte_array[source_index];
                ++source_index;
                return ((c1 | c2) & ~0xff) !== 0 ? -1 : big_endian ? c1 << 8 | c2 : c2 << 8 | c1;
            }
        }

        var eos = false;
        while (!eos) {
            var c = read_word();
            var code;
            if (c === undefined) {
                code = -1;
                eos = true;
            }
            else if (c < 0)
                code = fall_back_char;
            else
                code = c;
            if (code >= 0) {
                if (code === normal_bom_char) {
                    // nop
                }
                else if (code === reverse_bom_char)
                    big_endian = !big_endian;
                else
                    handle_word(code);
            }
        }
        return text;
    }

    Array.prototype.toStringByUTF16Encoding = internalToStringByUTF16Encoding;
    Uint8Array.prototype.toStringByUTF16Encoding = internalToStringByUTF16Encoding;

    function internalToByteArrayByUTF16Encoding(big_endian, byte_order_mark) {
        var text = this,
            byte_array = [];
        if (big_endian === undefined)
            big_endian = true;
        if (byte_order_mark === undefined)
            byte_order_mark = true;
        if (text.length <= 0)
            return byte_array;

        function handle_word(word_value) {
            if (big_endian) {
                byte_array.push(word_value >> 8 & 0xff);
                byte_array.push(word_value & 0xff);
            }
            else {
                byte_array.push(word_value & 0xff);
                byte_array.push(word_value >> 8 & 0xff);
            }
        }

        var source_index = 0;
        function read_char() {
            return source_index >= text.length ? undefined : text.charCodeAt(source_index++);
        }

        if (byte_order_mark)
            handle_word(normal_bom_char);

        var eos = false;
        while (!eos) {
            var code = read_char();
            if (code === undefined)
                eos = true;
            else
                handle_word(code);
        }
        return new Uint8Array(byte_array);
    }

    String.prototype.toByteArrayByUTF16Encoding = internalToByteArrayByUTF16Encoding;

    function internalToStringByUTF32Encoding(big_endian) {
        var byte_array = this,
            text = "";
        if (big_endian === undefined)
            big_endian = true;
        if (byte_array.length <= 0)
            return text;

        function handle_word(word_value) {
            text += String.fromCharCode(word_value);
        }

        var source_index = 0;
        function read_unicode() {
            if (source_index >= byte_array.length)
                return undefined;
            else if (source_index + 3 >= byte_array.length) {
                source_index = byte_array.length;
                return -1;
            }
            else {
                var c1 = byte_array[source_index];
                ++source_index;
                var c2 = byte_array[source_index];
                ++source_index;
                var c3 = byte_array[source_index];
                ++source_index;
                var c4 = byte_array[source_index];
                ++source_index;
                return ((c1 | c2 | c3 | c4) & ~0xff) !== 0 ? -1 : big_endian ? c1 << 24 | c2 << 16 | c3 << 8 | c4 : c4 << 24 | c3 << 16 | c2 << 8 | c1 & 0xff;
            }
        }

        var eos = false;
        while (!eos) {
            var code = read_unicode();
            if (code === undefined) {
                eos = true;
                break;
            }
            if (code < 0)
                code = fall_back_char;
            else if (code === normal_bom_char) {
                // nop
            }
            else if (code === reverse_bom_char)
                big_endian = !big_endian;
            else
                InternalCodeEncoder(code, handle_word);
        }
        return text;
    }

    Array.prototype.toStringByUTF32Encoding = internalToStringByUTF32Encoding;
    Uint8Array.prototype.toStringByUTF32Encoding = internalToStringByUTF32Encoding;

    function internalToByteArrayByUTF32Encoding(big_endian, byte_order_mark) {
        var text = this,
            byte_array = [];
        if (big_endian === undefined)
            big_endian = true;
        if (byte_order_mark === undefined)
            byte_order_mark = true;
        if (text.length <= 0)
            return byte_array;

        function handle_unicode(unicode_value) {
            //console.log("output 0x"+ unicode_value.toString(16));
            if (big_endian) {
                byte_array.push(unicode_value >> 24 & 0xff);
                byte_array.push(unicode_value >> 16 & 0xff);
                byte_array.push(unicode_value >> 8 & 0xff);
                byte_array.push(unicode_value & 0xff);
            }
            else {
                byte_array.push(unicode_value & 0xff);
                byte_array.push(unicode_value >> 8 & 0xff);
                byte_array.push(unicode_value >> 16 & 0xff);
                byte_array.push(unicode_value >> 24 & 0xff);
            }
        }

        var source_index = 0;
        function read_char() {
            var code = source_index >= text.length ? undefined : text.charCodeAt(source_index++);
            //console.log(code !== undefined ? "input 0x" + code.toString(16) : "input undefined");
            return code;
        }

        if (byte_order_mark)
            handle_unicode(normal_bom_char);

        InternalCodeDecoder(read_char, handle_unicode);
        return new Uint8Array(byte_array);
    }

    String.prototype.toByteArrayByUTF32Encoding = internalToByteArrayByUTF32Encoding;

})();