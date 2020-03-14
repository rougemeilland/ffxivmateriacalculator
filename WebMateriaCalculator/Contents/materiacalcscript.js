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
/*
  linqling.js

  Copyright (c) 2017 Palmtree Software

  This software is released under the MIT License.
  https://opensource.org/licenses/MIT
*/

(function () {
    Array.prototype.distinct = function (verb) {
        if (verb === undefined)
            return this.filter(function (element, index, source) {
                return source.indexOf(element) === index;
            });
        else {
            var array = [];
            for (var index1 = 0; index1 < this.length; ++index1) {
                var x = this[index1];
                var found = false;
                for (var index2 = index1 + 1; index2 < this.length; ++index2) {
                    var y = this[index2];
                    if (verb(x, y)) {
                        found = true;
                        break;
                    }
                }
                if (!found)
                    array.push(x);
            }
            return array;
        }
    };

    Array.prototype.where = function (verb) {
        return this.filter(function (element, index, source) {
            return verb(element, index);
        });
    };

    Array.prototype.select = function (selecter) {
        return this.map(function (element, index, array) {
            return selecter(element, index);
        });
    };

    Array.prototype.selectMany = function (selecter) {
        var array = [];
        for (var index = 0; index < this.length; ++index)
            array.push.apply(array, selecter(this[index], index));
        return array;
    };

    Array.prototype.union = function (collection, verb) {
        var array = this.concat();
        for (var index1 = 0; index1 < collection.length; ++index1) {
            var x = collection[index1];
            var found;
            if (verb === undefined)
                found = array.indexOf(x) >= 0;
            else {
                found = false;
                for (var index2 = 0; index2 < array.length; ++index2) {
                    var y = array[index2];
                    if (verb(x, y)) {
                        found = true;
                        break;
                    }
                }
            }
            if (!found)
                array.push(x);
        }
        return array;
    };

    Array.prototype.except = function (collection, verb) {
        var array = [];
        for (var index1 = 0; index1 < this.length; ++index1) {
            var x = this[index1];
            var found;
            if (verb === undefined)
                found = collection.indexOf(x) >= 0;
            else {
                found = false;
                for (var index2 = 0; index2 < collection.length; ++index2) {
                    var y = collection[index2];
                    if (verb(x, y)) {
                        found = true;
                        break;
                    }
                }
            }
            if (!found)
                array.push(x);
        }
        return array;
    };

    Array.prototype.equals = function (array, verb) {
        if (this.length !== array.length)
            return false;
        for (var index = 0; index < this.length; ++index) {
            var x = this[index],
                y = array[index];
            if (verb === undefined ? x !== y : !verb(x, y))
                return false;
        }
        return true;
    };

    Array.prototype.orderBy = function (selecter) {
        var array = this.concat();
        if (selecter === undefined)
            array.sort();
        else
            array.sort(function (x, y) {
                var vx = selecter(x),
                    vy = selecter(y);
                return vx > vy ? 1 : vx < vy ? -1 : 0;
            });
        return array;
    };

    Array.prototype.orderByDescending = function (selecter) {
        var array = this.concat();
        if (selecter === undefined)
            array.sort(function (x, y) {
                return x > y ? -1 : x < y ? 1 : 0;
            });
        else
            array.sort(function (x, y) {
                var vx = selecter(x),
                    vy = selecter(y);
                return vx > vy ? -1 : vx < vy ? 1 : 0;
            });
        return array;
    };

    Array.prototype.contains = function (x, verb) {
        if (verb === undefined)
            return this.indexOf(x) >= 0;
        else {
            var found = false;
            for (var index = 0; index < this.length; ++index) {
                if (verb(this[index], x)) {
                    found = true;
                    break;
                }
            }
            return found;
        }
    };

    Array.prototype.any = function (verb) {
        if (verb === undefined)
            return this.length > 0;
        else {
            var found_true = false;
            for (var index = 0; index < this.length; ++index) {
                if (verb(this[index])) {
                    found_true = true;
                    break;
                }
            }
            return found_true;
        }
    };

    Array.prototype.all = function (verb) {
        var found_false = false;
        for (var index = 0; index < this.length; ++index) {
            if (!verb(this[index])) {
                found_false = true;
                break;
            }
        }
        return !found_false;
    };

    Array.prototype.toObject = function (verb_key, verb_value) {
        var dic = {};
        for (var index = 0; index < this.length; ++index) {
            var element = this[index],
                key = verb_key(element),
                value = verb_value === undefined ? element : verb_value(element);
            if (key === undefined || key === null)
                throw new Error("key is undefined or null.");
            if (dic.hasOwnProperty(key)) {
                console.log("dic=" + JSON.stringify(dic) + ", key=" + key);
                throw new Error("An element with the same key already exists in the Object.");
            }
            dic[key] = value;
        }
        return dic;
    };

    Array.prototype.most = function (evaluator, verb) {
        var found_index = -1;
        var found_element = null;
        var found_score = NaN;
        for (var index = 0; index < this.length; ++index) {
            var element = this[index];
            if (verb === undefined || verb(element, index)) {
                var score = evaluator(element, index);
                if (found_index < 0 || found_score < score) {
                    found_index = index;
                    found_element = element;
                    found_score = score;
                }
            }
        }
        if (found_index < 0)
            return undefined;
        return found_element;
    };

    Array.prototype.least = function (evaluator, verb) {
        var found_index = -1;
        var found_element = null;
        var found_score = NaN;
        for (var index = 0; index < this.length; ++index) {
            var element = this[index];
            if (verb === undefined || verb(element, index)) {
                var score = evaluator(element, index);
                if (found_index < 0 || found_score > score) {
                    found_index = index;
                    found_element = element;
                    found_score = score;
                }
            }
        }
        if (found_index < 0)
            return undefined;
        return found_element;
    };

    /*
    function trace(x, color) {
        $("#tracetext").html($("#tracetext").html() + "<br /><span" + (color == undefined ? "" : " style=\"color:" + color + ";\"") + ">" + x + "</span>");
    }
    
    
    function assert(text, expression, expected_value, evaluator) {
        trace(text + " => " + JSON.stringify(expression),
              (evaluator === undefined ? expression === expected_value : evaluator(expression, expected_value)) ? "black" : "red");
    }
    
    $(function () {
        var source_array1 = [{ id: 1, name: "a" }, { id: 2, name: "b" }, { id: 3, name: "c" }];
        var source_array2 = [{ id: 1, name: "a" }, { id: 2, name: "b" }, { id: 4, name: "d" }];
        assert("[].equals([])", [].equals([]), true);
        assert("[1,2,3].equals([])", [1, 2, 3].equals([]), false);
        assert("[].equals([1,2,3])", [].equals([1, 2, 3]), false);
        assert("[1,2,3].equals([])", [1, 2, 3].equals([]), false);
        assert("[2].equals([1,2,3])", [2].equals([1, 2, 3]), false);
        assert("[1,2,3].equals([2])", [1, 2, 3].equals([2]), false);
        assert("[1,2,3].equals([2,3,4])", [1, 2, 3].equals([2, 3, 4]), false);
        assert("[1,2,3].equals([1,2,3])", [1, 2, 3].equals([1, 2, 3]), true);
        assert(JSON.stringify(source_array1) + ".equals(" + JSON.stringify(source_array1) + ", (x, y) => x.id === y.id)", source_array1.equals(source_array1, (x, y) => x.id === y.id), true);
        assert(JSON.stringify(source_array1) + ".equals(" + JSON.stringify(source_array2) + ", (x, y) => x.id === y.id)", source_array1.equals(source_array2, (x, y) => x.id === y.id), false);
        assert("[1,2,3].where(x => x == 10)", [1, 2, 3].where(x => x === 10), [], (x, y) => x.equals(y));
        assert("[1,2,3].where(x => x !== 2)", [1, 2, 3].where(x => x !== 2), [1, 3], (x, y) => x.equals(y));
        assert("[1,2,3].where(x => x !== 5)", [1, 2, 3].where(x => x !== 5), [1, 2, 3], (x, y) => x.equals(y));
        assert(JSON.stringify(source_array1) + ".where(x => x.id != 2)", source_array1.where(x => x.id != 2), [{ id: 1, name: "a" }, { id: 3, name: "c" }], (x, y) => x.equals(y, (x2, y2) => x2.id === y2.id));
        assert(JSON.stringify(source_array1) + ".where(x => x.id != 10)", source_array1.where(x => x.id != 10), [{ id: 1, name: "a" }, { id: 2, name: "10" }, { id: 3, name: "c" }], (x, y) => x.equals(y, (x2, y2) => x2.id === y2.id));
        assert("[1,2,3].select(x => x + 5)", [1, 2, 3].select(x => x + 5), [6, 7, 8], (x, y) => x.equals(y));
        assert(JSON.stringify(source_array1) + ".select(x => { return { id2: x.id, name2: \"_\" + x.name };})", source_array1.select(function (x) {
            return { id2: x.id, name2: "_" + x.name };
        }), [{ id2: 1, name2: "_a" }, { id2: 2, name2: "_b" }, { id2: 3, name2: "_c" }], function (x, y) {
            return x.equals(y, function (x2, y2) {
                return x2.id2 === y2.id2 && x2.name2 === y2.name2;
            });
        });
        assert("[1,2,3].selectMany(x => [x, x * 2, x * 3])", [1, 2, 3].selectMany(x =>[x * 1, x * 2, x * 3]), [1, 2, 3, 2, 4, 6, 3, 6, 9], (x, y) => x.equals(y));
        assert(JSON.stringify(source_array1) + ".selectMany(x =>[{ id: x.id * 1, name: x.name + \"1\" }, { id: x.id * 2, name: x.name + \"2\" }, { id: x.id * 3, name: x.name + \"3\" }])", source_array1.selectMany(x =>[{ id: x.id * 1, name: x.name + "1" }, { id: x.id * 2, name: x.name + "2" }, { id: x.id * 3, name: x.name + "3" }]), [{ id: 1, name: "a1" }, { id: 2, name: "a2" }, { id: 3, name: "a3" }, { id: 2, name: "b1" }, { id: 4, name: "b2" }, { id: 6, name: "b3" }, { id: 3, name: "c1" }, { id: 6, name: "c2" }, { id: 9, name: "c3" }], (x, y) => x.equals(y, (x2, y2) => x2.id === y2.id && x2.name === y2.name));
        assert("[1,2,3].union([2,3,3,4,4])", [1, 2, 3].union([2, 3, 3, 4, 4]), [1, 2, 3, 4], (x, y) => x.equals(y));
        assert(JSON.stringify([{ id: 1, name: "a" }, { id: 2, name: "b" }, { id: 3, name: "c" }, { id: 3, name: "c" }]) + ".union(" + JSON.stringify([{ id: 2, name: "b" }, { id: 2, name: "b" }, { id: 3, name: "c" }, { id: 4, name: "d" }]) + ")", [{ id: 1, name: "a" }, { id: 2, name: "b" }, { id: 3, name: "c" }, { id: 3, name: "c" }].union([{ id: 2, name: "b" }, { id: 2, name: "b" }, { id: 3, name: "c" }, { id: 4, name: "d" }], (x, y) => x.id === y.id), [{ id: 1, name: "a" }, { id: 2, name: "b" }, { id: 3, name: "c" }, { id: 3, name: "c" }, { id: 4, name: "d" }], (x, y) => x.equals(y, (x2, y2) => x2.id === y2.id));
        assert("[1,2,3].except([1,2])", [1, 2, 3].except([2, 3]), [1], (x, y) => x.equals(y));
        assert(JSON.stringify(source_array1) + ".except(" + JSON.stringify([{ id: 2, name: "b" }, { id: 3, name: "c" }]) + ")", source_array1.except([{ id: 2, name: "b" }, { id: 3, name: "c" }], (x, y) => x.id === y.id), [{ id: 1, name: "a" }], (x, y) => x.equals(y, (x2, y2) => x2.id === y2.id));
        assert("[2,3,1].orderBy()", [2, 3, 1].orderBy(), [1, 2, 3], (x, y) => x.equals(y));
        assert(JSON.stringify([{ id: 2, name: "b" }, { id: 3, name: "c" }, { id: 1, name: "a" }]) + ".orderBy()", [{ id: 2, name: "b" }, { id: 3, name: "c" }, { id: 1, name: "a" }].orderBy(x => x.id), [{ id: 1, name: "a" }, { id: 2, name: "b" }, { id: 3, name: "c" }], (x, y) => x.equals(y, (x2, y2) => x2.id === y2.id));
        assert("[2,3,1].orderByDescending()", [2, 3, 1].orderByDescending(), [3, 2, 1], (x, y) => x.equals(y));
        assert(JSON.stringify([{ id: 2, name: "b" }, { id: 3, name: "c" }, { id: 1, name: "a" }]) + ".orderByDescending()", [{ id: 2, name: "b" }, { id: 3, name: "c" }, { id: 1, name: "a" }].orderByDescending(x => x.id), [{ id: 3, name: "c" }, { id: 2, name: "b" }, { id: 1, name: "a" }], (x, y) => x.equals(y, (x2, y2) => x2.id === y2.id));
        assert("[].contains(1)", [].contains(1), false);
        assert("[1,2,3].contains(4)", [1,2,3].contains(4), false);
        assert("[1,2,3].contains(2)", [1,2,3].contains(2), true);
        assert("[].contains({ id: 1, name: \"a\" })", [].contains({ id: 1, name: "a" }, (x, y) => x.id === y.id), false);
        assert(JSON.stringify(source_array1) + ".contains({ id: 4, name: \"d\" }, (x, y) => x.id === y.id)", source_array1.contains({ id: 4, name: "d" }, (x, y) => x.id === y.id), false);
        assert(JSON.stringify(source_array1) + ".contains({ id: 2, name: \"b\" }, (x, y) => x.id === y.id)", source_array1.contains({ id: 2, name: "b" }, (x, y) => x.id === y.id), true);
        assert("[].any()", [].any(), false);
        assert("[1].any()", [1].any(), true);
        assert("[].any(x => x == 2)", [].any(x => x == 2), false);
        assert("[1].any(x => x == 2)", [1].any(x => x == 2), false);
        assert("[1,2].any(x => x == 2)", [1, 2].any(x => x == 2), true);
        assert("[].any(x => x.id == 2)", [].any(x => x.id === 2), false);
        assert(JSON.stringify(source_array1) + ".any(x => x.id == 5)", source_array1.any(x => x.id === 5), false);
        assert(JSON.stringify(source_array1) + ".any(x => x.id == 2)", source_array1.any(x => x.id === 2), true);
        assert("[].all(x => x > 0)", [].all(x => x == 2), true);
        assert("[1,2,3].all(x => x > 1)", [1].all(x => x > 1), false);
        assert("[1,2,3].all(x => x > 0)", [1].all(x => x > 0), true);
        assert("[].all(x => x.id > 0)", [].all(x => x.id > 0), true);
        assert(JSON.stringify(source_array1) + ".all(x => x.id > 1)", source_array1.all(x => x.id > 1), false);
        assert(JSON.stringify(source_array1) + ".all(x => x.id > 0)", source_array1.all(x => x.id > 0), true);
    });
    */
})();
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
/*
  materiacalc.js

  Copyright (c) 2017 Palmtree Software

  This software is released under the MIT License.
  https://opensource.org/licenses/MIT
*/

// jQueryのエントリポイントやjQueryオブジェクトへのハンドラの登録にアロー関数を指定すると正常に動作しないため、
// これらの個所では従来通りの function() {} の形式の匿名関数を使用すること。
// 追記：IEではアロー関数を認識せず構文エラーとなるため、基本的にアロー関数は使用しない方がいいらしい。なお、Edgeでは正常に認識される模様。
$(function () {
    var lang = $("#currentlanguage").val();
    switch (lang) {
        case "en":
        case "de":
        case "fr":
        case "ja":
            break;
        default:
            lang = "en";
            break;
    }

    /*
    {
        // 結論：カスタムデータ属性について、dataメソッドとattr/セレクタ参照の相性が悪い。
        // attr/セレクタ参照は互いに整合性がとれている。
        // dataメソッドは使わないのが吉。
        console.log(".data('test') => " + $("#tracetext").data('test'));
        console.log(".attr('data-test') => " + $("#tracetext").attr('data-test'));
        console.log(".data('test', '1') => " + $("#tracetext").data('test', '1'));
        console.log(".data('test') => " + $("#tracetext").data('test'));
        console.log(".attr('data-test') => " + $("#tracetext").attr('data-test'));
        console.log("data-test属性の値が1である要素のid => " + $("p[data-test='1']").attr("id"));
        console.log(".data('test', '2') => " + $("#tracetext").data('test', '2'));
        console.log(".data('test') => " + $("#tracetext").data('test'));
        console.log(".attr('data-test') => " + $("#tracetext").attr('data-test'));
        console.log("data-test属性の値が2である要素のid => " + $("p[data-test='2']").attr("id"));
        console.log(".attr('data-test', '3') => " + $("#tracetext").attr('data-test', '3'));
        console.log(".data('test') => " + $("#tracetext").data('test'));
        console.log(".attr('data-test') => " + $("#tracetext").attr('data-test'));
        console.log("data-test属性の値が3である要素のid => " + $("p[data-test='3']").attr("id"));
        console.log(".attr('data-test', '4') => " + $("#tracetext").attr('data-test', '4'));
        console.log(".data('test') => " + $("#tracetext").data('test'));
        console.log(".attr('data-test') => " + $("#tracetext").attr('data-test'));
        console.log("data-test属性の値が4である要素のid => " + $("p[data-test='4']").attr("id"));
    }
    */

    String.prototype.toHankakuAlphaNumericString = function () {
        return this.replace(/[Ａ-Ｚａ-ｚ０-９，．‐　]/g, function (s) {
            if (s >= "Ａ" && s <= "Ｚ")
                return String.fromCharCode(s.charCodeAt(0) - "Ａ".charCodeAt(0) + "A".charCodeAt(0));
            else if (s >= "ａ" && s <= "ｚ")
                return String.fromCharCode(s.charCodeAt(0) - "ａ".charCodeAt(0) + "a".charCodeAt(0));
            else if (s >= "０" && s <= "９")
                return String.fromCharCode(s.charCodeAt(0) - "０".charCodeAt(0) + "0".charCodeAt(0));
            else if (s === "，")
                return ",";
            else if (s === "．")
                return ".";
            else if (s === "‐")
                return "-";
            else if (s === "　")
                return " ";
            else
                return s;
        });
    };

    function ParseIDString(id_string) {
        //console.log("id_string=" + id_string);
        return id_string !== null && id_string.toString().match(/^[1-9][0-9]*$/) !== null ? parseInt(id_string) : -1;
    }

    function ParseNumberString(text) {
        return text !== null && text.match(/^0|([1-9][0-9]*)$/) !== null ? parseInt(text) : -1;
    }

    function ParsePriceNumberString(text) {
        switch (lang) {
            case "de":
                // ドイツ語の場合、3桁区切りは'.'(ピリオド)、小数点は','(カンマ)
                return text !== null && text.match(/^ *[0-9\.]+$ */) !== null ? parseInt(text.split('.').join('').trim()) : -1;
            case "fr":
                // フランス語の場合、3桁区切りは' '(スペース)、小数点は','(カンマ)
                return text !== null && text.match(/^[0-9 ]+$/) !== null ? parseInt(text.split(' ').join('').trim()) : -1;
            case "en":
            case "ja":
            default: // 既定は英語
                // 英語/日本語の場合、3桁区切りは','(カンマ)、小数点は'.'(ピリオド)
                //console.log("text=" + text);
                return text !== null && text.match(/^ *[0-9０-９,]+$ */) !== null ? parseInt(text.toHankakuAlphaNumericString().split(',').join('').trim()) : -1;
        }
    }

    Number.prototype.toPriceNumberString = function () {
        switch (lang) {
            case "de":
                // ドイツ語の場合、3桁区切りは'.'(ピリオド)、小数点は','(カンマ)
                return this.toString().replace(/([0-9])(?=([0-9]{3})+(?![0-9]))/g, "$1.");
            case "fr":
                // フランス語の場合、3桁区切りは' '(スペース)、小数点は','(カンマ)
                return this.toString().replace(/([0-9])(?=([0-9]{3})+(?![0-9]))/g, "$1 ");
            case "en":
            case "ja":
            default: // 既定は英語
                // 英語/日本語の場合、3桁区切りは','(カンマ)、小数点は'.'(ピリオド)
                return this.toString().replace(/([0-9])(?=([0-9]{3})+(?![0-9]))/g, "$1,");
        }
    };

    function showProgressBar(progress) {
        var progress_str = "";
        const delta = 10;
        var index = delta;
        for (; index <= progress; index += delta)
            progress_str += "■";
        for (; index <= 100; index += delta)
            progress_str += "□";
        $("#loadingprogress").text(progress_str);
    }

    function GetJSONObject(callback) {
        var loading_progress_percent = 0;
        var inflate_progress_percent = 0;

        function refreshProgressBar() {
            var progress = Math.floor((loading_progress_percent * 0.2 + inflate_progress_percent * 0.8) * 100);
            if (loading_progress_percent < 1.0) {
                console.log("progress: loading " + Math.floor(loading_progress_percent * 100) + "% (total " + progress + "%)");
            }
            else if (inflate_progress_percent < 1.0) {
                console.log("progress: inflate " + Math.floor(inflate_progress_percent * 100) + "% (total " + progress + "%)");
            }
            else {
                console.log("progress: complete");
            }
            $("#loadingprogresspercent").text(progress);

            // EdgeとIEでprogressが使い物にならないため、以下のコードで代用する。
            //$("#loadingprogress").val(progress);
            showProgressBar(progress);
        }

        function GetCompressedJSONFile(url, callback) {
            var xhr = new XMLHttpRequest();
            xhr.open("GET", url, true);
            xhr.responseType = "arraybuffer";
            xhr.onload = function (e) {
                if (xhr.response) {
                    loading_progress_percent = 1.0;
                    var compressed_data = new Uint8Array(xhr.response);
                    compressed_data.inflate({
                        useTypedArray: false, // ChromeとIEでは型付き配列を使用すると遅くなったので、明示的にArrayの使用指示をする(Edgeではあまり変わらず)
                        callback: function (id, p) {
                            if (id === "progress") {
                                inflate_progress_percent = p;
                                refreshProgressBar();
                            }
                            else if (id === "complete") {
                                var text = p.toStringByUTF8Encoding();
                                if (text !== undefined && text !== null) {
                                    callback(null, JSON.parse(text));
                                }
                            }
                            else {
                                // nop
                            }
                        }
                    });
                }
            };
            xhr.onprogress = function (e) {
                if (e.lengthComputable) {
                    var percent = e.loaded / e.total;
                    if (percent >= loading_progress_percent + 0.01) {
                        loading_progress_percent = percent;
                        refreshProgressBar();
                    }
                }
            };
            xhr.onerror = function (e) {
                callback(e);
            };
            refreshProgressBar();
            xhr.send();
        }

        /*
        // 非圧縮のJSONファイルを読み込む
        function GetJSONFile(url, callback) {
            sw1 = (new Date()).getTime();
            var xhr = new XMLHttpRequest();
            xhr.open("GET", url, true);
            xhr.responseType = "text";
            xhr.onload = function (e) {
                var text = xhr.responseText;
                if (text !== undefined && text !== null)
                    callback(null, JSON.parse(text));
            };
            xhr.progress = function (e) {
                if (e.lengthComputable) {

                }
            };
            xhr.onerror = function (e) {
                callback(e);
            };
            xhr.send();
        }
        */

        GetCompressedJSONFile("master_data.json.z", function (e1, data1) {
            if (e1 === null) {
                var sw1 = (new Date()).getTime();
                callback(data1);
            }
        });
    }

    GetJSONObject(function (master_data) {
        var master_items = master_data.items,
            master_grades = master_data.grades,
            master_status = master_data.status,
            master_materias = master_data.materias,
            master_materia_counts = master_data.materia_counts,
            master_permutation_table = master_data.permutation_table,
            master_storage_items = master_data.storage_items,
            master_gil_names = master_data.gil_names,
            master_max_status_values = master_data.max_status_values,
            master_initial_item_prices = master_data.initial_item_prices,
            master_exsample_item_prices = master_data.exsample_item_prices;
        master_data = null;//オブジェクトの解放

        function GetStatusSelectionItems() {
            var selection_items = "<option value=\"\" selected=\"selected\"></option>";
            $.each(master_status, function (index, status) {
                if (status !== null) {
                    selection_items += "<option value=\"" +
                        status.status_id +
                        "\">" +
                        status.name[lang] +
                        "<\/option>";
                }
            });
            return selection_items;
        }

        function GetValueSelectionItems(status_id, maximum_grade_id) {
            var selection_items = "";
            if (status_id > 0 && status_id < master_materia_counts.length && maximum_grade_id > 0 && maximum_grade_id < master_grades.length) {
                var max_status_value = master_max_status_values[status_id][maximum_grade_id];
                for (var status_value = 1; status_value <= max_status_value; ++status_value) {
                    selection_items += "<option value=\"" +
                        status_value +
                        "\"" +
                        (status_value === 1 ? " selected=\"selected\"" : "") +
                        ">+" +
                        status_value +
                        "<\/option>";
                }
            }
            return selection_items;
        }

        function GetItemPriceList() {
            var gil_name = master_gil_names[lang];
            var notusedmateriatext = $("#notusedmateriatext").val();
            function BuildGetItemPriceListRow(item_id, item_name, ex_name, ex_value, official_site_db_id) {
                return "<tr data-" +
                    ex_name +
                    "=\"" +
                    ex_value +
                    "\" data-itempriceavailable=\"false\" style=\"display:none;\"><td class=\"priceheaderstyle\"><a href=\"http://jp.finalfantasyxiv.com/lodestone/playguide/db/item/" +
                    official_site_db_id +
                    "/\" target=\"_blank\">" +
                    item_name +
                    "</a></td><td><input type=\"checkbox\" id=\"itemused" +
                    item_id +
                    "\" data-itemid=\"" +
                    item_id +
                    "\" data-itempriceid=\"itemprice" +
                    item_id +
                    "\" data-itemnotusedtextid=\"itemnotusedtext" +
                    item_id +
                    "\" data-itempriceerrormessageid=\"itempriceerrormessage" +
                    item_id +
                    "\"/><input type=\"text\" id=\"itemprice" +
                    item_id +
                    "\" class=\"priceboxstyle\" data-itemid=\"" +
                    item_id +
                    "\" data-itemusedid=\"itemused" +
                    item_id +
                    "\" data-itempriceerrormessageid=\"itempriceerrormessage" +
                    item_id +
                    "\"/>" +
                    gil_name +
                    "</td><td><span id=\"itemnotusedtext" +
                    item_id +
                    "\" class=\"itemnotusedtextstyle\" style=\"display:none;\"> " +
                    notusedmateriatext +
                    "</span><span id=\"itempriceerrormessage" +
                    item_id +
                    "\" data-text=\"\" class=\"errormessageiconstyle\" style=\"display:none;\">！</span></td></tr>";
            }
            var price_list = "";
            $.each(master_materias, function (index, materia) {
                if (materia !== null) {
                    var item_id = materia.item_id,
                        item = master_items[item_id];
                    price_list += BuildGetItemPriceListRow(item_id, item.name[lang], "materiaid", materia.materia_id, item.official_site_db_id);
                }
            });
            //console.log(price_list);
            return price_list;
        }

        function SwitchView(target_view_id) {
            $.each(["mainview", "resultview", "errorview", "generalsettingview", "outlineview"], function (index, view_id) {
                if (view_id === target_view_id)
                    $("#" + view_id).show();
                else
                    $("#" + view_id).hide();
            });
        }

        function RefreshStatusValueSelectionItems(status_type_control_id, maximum_grade_control_id) {
            var maximum_grade_id = ParseIDString($("#" + maximum_grade_control_id).val()),
                status_id = ParseIDString($("#" + status_type_control_id).val()),
                status_value_control_id = $("#" + status_type_control_id).data("statusvalueid"),
                value_selection_items = GetValueSelectionItems(status_id, maximum_grade_id);
            if (status_value_control_id !== undefined && status_id > 0 && value_selection_items.length > 0)
                $("#" + status_value_control_id).html(value_selection_items).show();
            else
                $("#" + status_value_control_id).html("").hide();
            if (["#statustype1", "#statustype2", "#statustype3", "#statustype4", "#statustype5"].any(function (selecter) {
                return ParseIDString($(selecter).val()) > 0;
            })) {
                $("#statusselectionerrormessage").hide();
                $("#itempricelistview").show();
            }
            else {
                $("#itempricelistview").hide();
                $("#statusselectionerrormessage").show();
            }
        }

        function GetVisibleItemPriceList() {
            // 相場が設定されているか、あるいはその相場を使用しない指定がされているアイテムの分のみ返す
            var price_list = {};
            $("#itempricelist tr[data-availableitemprice='true'] input[type='checkbox']").each(function (index, element) {
                var item_id = $(element).data("itemid"),
                    itemprice_id = $(element).data("itempriceid"),
                    itemprice = ParsePriceNumberString($("#" + itemprice_id).val());
                if (!$(element).prop("checked"))
                    price_list[item_id] = -1;
                else if (itemprice > 0)
                    price_list[item_id] = itemprice;
                else {
                    // nop
                }
            });
            return price_list;
        }

        function RefreshItemPriceVisibility() {
            var status_ids = ["statustype1", "statustype2", "statustype3", "statustype4", "statustype5"]
                .select(function (element_id) {
                    return ParseIDString($("#" + element_id).val());
                })
                .where(function (status_id) {
                    return status_id > 0;
                })
                .distinct();
            var maximum_grade_id = ParseIDString($("#maximumgradeid").val());
            //$("tr[data-itemid]").attr("xxx", "zzz");
            $("#itempricelist tr[data-itempriceavailable]").each(function (index, element) {
                // .each()での$(this)の挙動が変なので、$(this)は使わない
                // 'data-availableitemprice'属性は更新可能でありセレクタでも使用するのでdata()でアクセスしてはならない。
                var materia_id = $(element).data("materiaid");
                if (materia_id !== undefined) {
                    var materia = master_materias[materia_id];
                    //console.log(JSON.stringify(status_ids) + ".contains(" + materia.status_id + ")=" + status_ids.contains(materia.status_id));
                    if (materia.grade_id <= maximum_grade_id && status_ids.contains(materia.status_id))
                        $(element).attr("data-availableitemprice", "true").show();
                    else
                        $(element).removeAttr("data-availableitemprice").hide();
                }
                else {
                    // 予期しないtrが見つかった。
                    //nop
                }
            });
        }

        function RefreshCalculationButtonEnablement() {
            var ok = [
                { status_type_id: "statustype1", status_value_id: "statusvalue1" },
                { status_type_id: "statustype2", status_value_id: "statusvalue2" },
                { status_type_id: "statustype3", status_value_id: "statusvalue3" },
                { status_type_id: "statustype4", status_value_id: "statusvalue4" },
                { status_type_id: "statustype5", status_value_id: "statusvalue5" }
            ]
                .any(function (x) {
                    //console.log("x.status_type_id=" + x.status_type_id);
                    //console.log("x.status_value_id=" + x.status_value_id);
                    var status_id = ParseIDString($("#" + x.status_type_id).val()),
                        value = ParseNumberString($("#" + x.status_value_id).val());
                    return status_id > 0 && status_id < master_status.length && value > 0;
                });
            if (ok) {
                var maximum_grade_id = ParseIDString($("#maximumgradeid").val());
                if (maximum_grade_id <= 0 || maximum_grade_id >= master_grades.length)
                    ok = false;
            }
            if (ok) {
                $("#itempricelist tr[data-availableitemprice='true'] input[type='checkbox']").each(function (index, element) {
                    if ($(element).prop("checked") && ParsePriceNumberString($("#" + $(element).data("itempriceid")).val()) < 0) {
                        ok = false;
                        return false; // break
                    }
                });
            }
            $("#calculatebutton").prop("disabled", !ok);
        }

        function RefreshItemPriceControlStyle(item_id) {
            var itemprice = $("#itemprice" + item_id);
            if ($("#itemused" + item_id).prop("checked")) {
                $("#itemnotusedtext" + item_id).hide();
                if (ParsePriceNumberString(itemprice.val()) > 0) {
                    itemprice.removeClass("errortextcontrolstyle").prop('disabled', false);
                    $("#itempriceerrormessage" + item_id).hide();
                }
                else {
                    itemprice.removeClass("errortextcontrolstyle").addClass("errortextcontrolstyle").prop('disabled', false);
                    if (itemprice.val() === "") {
                        $("#itempriceerrormessage" + item_id).data("text", $("#itempriceerrormessage_empty").val()).show();
                    }
                    else {
                        $("#itempriceerrormessage" + item_id).data("text", $("#itempriceerrormessage_badformat").val()).show();
                    }
                }
            }
            else {
                $("#itemnotusedtext" + item_id).show();
                itemprice.removeClass("errortextcontrolstyle").val("").prop('disabled', true);
                $("#itempriceerrormessage" + item_id).hide();
            }
        }

        function LoadSettings() {
            // 相場の初期値の設定
            if (!localStorage.hasOwnProperty("item_prices"))
                localStorage.item_prices = master_exsample_item_prices;
            // 設定情報をフォームの値として埋め込む
            if (localStorage.hasOwnProperty("settings")) {
                var settings = JSON.parse(localStorage.settings);
                $.each(master_storage_items, function (element_id, setting_info) {
                    //console.log("begin loading(" + element_id + ")");
                    if (settings.hasOwnProperty(element_id)) {
                        var value = settings[element_id];
                        switch (setting_info.type) {
                            case "plane":
                                if (setting_info.fire_event)
                                    $("#" + element_id).val(value).change();
                                else
                                    $("#" + element_id).val(value);
                                break;
                            case "radio":
                                if (setting_info.fire_event)
                                    $("input[name='" + element_id + "']").val([value]).change();
                                else
                                    $("input[name='" + element_id + "']").val([value]);
                                break;
                            case "checkbox":
                                if (setting_info.fire_event)
                                    $("#" + element_id).prop("checked", value).change();
                                else
                                    $("#" + element_id).prop("checked", value);
                                break;
                            default:
                                break;
                        }
                    }
                    //console.log("end loading(" + element_id + ")");
                });
            }
            if (localStorage.hasOwnProperty("item_prices")) {
                var item_prices = JSON.parse(localStorage.item_prices);
                $.each(master_items, function (item_id, item) {
                    if (item !== null) {
                        var global_item_id = item.global_item_id;
                        if (item_prices.hasOwnProperty(global_item_id)) {
                            var price_string = item_prices[global_item_id];
                            //console.log("price_string=" + price_string);
                            if (price_string === "*") {
                                $("#itemused" + item_id).prop("checked", false).change();
                            }
                            else if (price_string.match(/[0-9]+/) !== null) {
                                var price = ParsePriceNumberString(price_string);
                                if (price > 0) {
                                    // 正しい価格が設定されている場合
                                    $("#itemused" + item_id).prop("checked", true).change();
                                    $("#itemprice" + item_id).val(price.toPriceNumberString()).change();
                                }
                                else {
                                    // 0または負の価格が設定されている場合
                                    $("#itemused" + item_id).prop("checked", true).change();
                                    $("#itemprice" + item_id).val("").change();
                                }
                            }
                            else {
                                // 形式が誤っている価格が設定されている場合
                                $("#itemused" + item_id).prop("checked", true).change();
                                $("#itemprice" + item_id).val("").change();
                            }
                        }
                    }
                });
            }
        }

        function SaveSettings() {
            var settings = {};
            $.each(master_storage_items, function (element_id, setting_info) {
                switch (setting_info.type) {
                    case "plane":
                        settings[element_id] = $("#" + element_id).val();
                        break;
                    case "radio":
                        settings[element_id] = $("input[name='" + element_id + "']:checked").val();
                        break;
                    case "checkbox":
                        settings[element_id] = $("#" + element_id).prop("checked");
                        break;
                    default:
                        break;
                }
            });
            localStorage.settings = JSON.stringify(settings);
            var item_prices = master_items
                .where(function (item) {
                    return item !== null;
                })
                .toObject(function (item) {
                    return item.global_item_id;
                }, function (item) {
                    var item_id = item.item_id;
                    if (!$("#itemused" + item_id).prop("checked"))
                        return "*";
                    else {
                        var price = ParsePriceNumberString($("#itemprice" + item_id).val());
                        return price > 0 ? price.toString() : "";
                    }
                });
            localStorage.item_prices = JSON.stringify(item_prices);
        }

        function Calculate(param) {
            function NormalizeStatus(status) {
                var collection = {};
                $.each(status, function (index, element) {
                    if (element.status_id > 0 && element.status_id < master_status.length && element.value > 0) {
                        var key = element.status_id;
                        if (collection.hasOwnProperty(key))
                            collection[key] = { status_id: element.status_id, value: collection[key].value + element.value };
                        else
                            collection[key] = element;
                    }
                });
                var new_array = [];
                $.each(collection, function (key, element) {
                    new_array.push(element);
                });
                return new_array;
            }

            function QueryComsumedItemIDs(desired_status, maximum_grade_id) {
                var materia_item_ids = [];
                $.each(desired_status, function (desierd_status_index, desired_status_element) {
                    var status_id = desired_status_element.status_id,
                        status = master_status[status_id];
                    $.each(status.materia_ids, function (grade_id, materia_id) {
                        if (grade_id > 0 && grade_id <= maximum_grade_id) {
                            materia_item_ids.push(master_materias[materia_id].item_id);
                        }
                    });
                });
                return materia_item_ids;
            }

            function CheckItemPriceList(item_price_list, desired_status, maximum_grade_id) {
                //console.log("item_price_list=" + JSON.stringify(item_price_list));
                var r = QueryComsumedItemIDs(desired_status, maximum_grade_id)
                    .all(function (item_id) {
                        return item_price_list.hasOwnProperty(item_id);
                    });
                //console.log("r=" + r);
                return r;
            }

            function BuildMateriaCombinations(desired_status) {
                var materia_combinations_by_status = [];
                $.each(desired_status, function (desired_status_index, desired_status_element) {
                    var value_array = master_materia_counts[desired_status_element.status_id];
                    if (value_array.length > desired_status_element.value) {
                        var combinations = value_array[desired_status_element.value],
                            materia_combination = [];
                        $.each(combinations, function (combination_index, combination) {
                            if (combination.maximum_grade_id <= maximum_grade_id) {
                                var materia_ids = combination.materia_ids;
                                if (materia_ids.length > 0 && materia_ids.length <= max_combination_array_length)
                                    materia_combination.push(materia_ids);
                            }
                        });
                        materia_combinations_by_status.push(materia_combination);
                    }
                });
                return materia_combinations_by_status;
            }

            function ConcatinateCombination(combinations, max_materia_count) {
                function ConcatinateCombination1(combination1, max_materia_count) {
                    var new_array_list = [];
                    $.each(combination1, function (index1, array1) {
                        var current_materia_count1 = array1.length;
                        if (current_materia_count1 <= max_materia_count)
                            new_array_list.push(array1);
                    });
                    return new_array_list;
                }

                function ConcatinateCombination2(combination1, combination2, max_materia_count) {
                    var new_array_list = [];
                    $.each(combination1, function (index1, array1) {
                        var current_materia_count1 = array1.length;
                        if (current_materia_count1 <= max_materia_count) {
                            $.each(combination2, function (index2, array2) {
                                var current_materia_count2 = current_materia_count1 + array2.length;
                                if (current_materia_count2 <= max_materia_count)
                                    new_array_list.push(array1.concat(array2));
                            });
                        }
                    });
                    return new_array_list;
                }

                function ConcatinateCombination3(combination1, combination2, combination3, max_materia_count) {
                    var new_array_list = [];
                    $.each(combination1, function (index1, array1) {
                        var current_materia_count1 = array1.length;
                        if (current_materia_count1 <= max_materia_count) {
                            $.each(combination2, function (index2, array2) {
                                var current_materia_count2 = current_materia_count1 + array2.length;
                                if (current_materia_count2 <= max_materia_count) {
                                    $.each(combination3, function (index3, array3) {
                                        var current_materia_count3 = current_materia_count2 + array3.length;
                                        if (current_materia_count3 <= max_materia_count)
                                            new_array_list.push(array1.concat(array2, array3));
                                    });
                                }
                            });
                        }
                    });
                    return new_array_list;
                }

                function ConcatinateCombination4(combination1, combination2, combination3, combination4, max_materia_count) {
                    var new_array_list = [];
                    $.each(combination1, function (index1, array1) {
                        var current_materia_count1 = array1.length;
                        if (current_materia_count1 <= max_materia_count) {
                            $.each(combination2, function (index2, array2) {
                                var current_materia_count2 = current_materia_count1 + array2.length;
                                if (current_materia_count2 <= max_materia_count) {
                                    $.each(combination3, function (index3, array3) {
                                        var current_materia_count3 = current_materia_count2 + array3.length;
                                        if (current_materia_count3 <= max_materia_count) {
                                            $.each(combination4, function (index4, array4) {
                                                var current_materia_count4 = current_materia_count3 + array4.length;
                                                if (current_materia_count4 <= max_materia_count)
                                                    new_array_list.push(array1.concat(array2, array3, array4));
                                            });
                                        }
                                    });
                                }
                            });
                        }
                    });
                    return new_array_list;
                }

                function ConcatinateCombination5(combination1, combination2, combination3, combination4, combination5, max_materia_count) {
                    var new_array_list = [];
                    $.each(combination1, function (index1, array1) {
                        var current_materia_count1 = array1.length;
                        if (current_materia_count1 <= max_materia_count) {
                            $.each(combination2, function (index2, array2) {
                                var current_materia_count2 = current_materia_count1 + array2.length;
                                if (current_materia_count2 <= max_materia_count) {
                                    $.each(combination3, function (index3, array3) {
                                        var current_materia_count3 = current_materia_count2 + array3.length;
                                        if (current_materia_count3 <= max_materia_count) {
                                            $.each(combination4, function (index4, array4) {
                                                var current_materia_count4 = current_materia_count3 + array4.length;
                                                if (current_materia_count4 <= max_materia_count) {
                                                    $.each(combination5, function (index5, array5) {
                                                        var current_materia_count5 = current_materia_count4 + array5.length;
                                                        if (current_materia_count5 <= max_materia_count)
                                                            new_array_list.push(array1.concat(array2, array3, array4, array5));
                                                    });
                                                }
                                            });
                                        }
                                    });
                                }
                            });
                        }
                    });
                    return new_array_list;
                }

                switch (combinations.length) {
                    case 1:
                        return ConcatinateCombination1(combinations[0], max_materia_count);
                    case 2:
                        return ConcatinateCombination2(combinations[0], combinations[1], max_materia_count);
                    case 3:
                        return ConcatinateCombination3(combinations[0], combinations[1], combinations[2], max_materia_count);
                    case 4:
                        return ConcatinateCombination4(combinations[0], combinations[1], combinations[2], combinations[3], max_materia_count);
                    case 5:
                        return ConcatinateCombination5(combinations[0], combinations[1], combinations[2], combinations[3], combinations[4], max_materia_count);
                    default:
                        return null;
                }
            }

            function GetLeastCostMaterias(combination, desired_status, item_price_list, is_high_quality, materia_slot_count, used_materia_count) {
                function GetMateriaIDsOrderByCombinationPattern(source_materia_ids, pattern) {
                    var materia_ids = [];
                    $.each(pattern, function (index, pattern_element) {
                        materia_ids.push(source_materia_ids[pattern_element]);
                    });
                    return materia_ids;
                }

                function CalculateCost(desired_status, materia_ids, item_price_list, is_high_quality, materia_slot_count, used_materia_count) {
                    var desired_status_values = {};
                    $.each(desired_status, function (index, desired_status_element) {
                        desired_status_values[desired_status_element.status_id] = desired_status_element.value;
                    });
                    var total_cost = 0.0,
                        materias = [],
                        status_values = {};
                    $.each(materia_ids, function (index, materia_id) {
                        var materia = master_materias[materia_id],
                            materia_item = master_items[materia.item_id],
                            materia_name = materia_item.name[lang],
                            materia_official_site_db_id = materia_item.official_site_db_id,
                            status = master_status[materia.status_id],
                            status_name = status.name[lang],
                            status_value = materia.value,
                            status_key = materia.status_id,
                            previous_total_status_value;
                        if (status_values.hasOwnProperty(status_key)) {
                            previous_total_status_value = status_values[status_key];
                            status_values[status_key] += status_value;
                        }
                        else {
                            previous_total_status_value = 0;
                            status_values[status_key] = status_value;
                        }
                        var total_status_value = status_values[status_key],
                            desired_status_value = desired_status_values[status_key],
                            is_too_large_value = status_values[status_key] > desired_status_values[status_key],
                            effective_status_value = (total_status_value > desired_status_value ? desired_status_value : total_status_value) - (previous_total_status_value > desired_status_value ? desired_status_value : previous_total_status_value),
                            grade = master_grades[materia.grade_id];
                        // 使用するマテリアの相場が未設定の場合は計算失敗
                        if (!item_price_list.hasOwnProperty(materia.item_id)) {
                            //console.log("Calculation faild.: " + "!item_price_list.hasOwnProperty(materia.item_id)");
                            total_cost = NaN;
                            return false; // break
                        }
                        var materia_price = item_price_list[materia.item_id];
                        // 使用するマテリアの相場が未設定の場合は計算失敗
                        if (materia_price <= 0) {
                            //console.log("Calculation faild.: " + "materia_price <= 0");
                            total_cost = NaN;
                            return false; // break
                        }
                        var success_rates = is_high_quality ? grade.success_rate_hq : grade.success_rate_nq,
                            count = used_materia_count + index,
                            cost;
                        if (count < materia_slot_count) {
                            // 禁断ではない場合 => 成功率100%
                            cost = materia_price;
                            materias.push({
                                index: count,
                                is_safety: true,
                                success_rate: 1.0,
                                materia_name: materia_name,
                                materia_official_site_db_id: materia_official_site_db_id,
                                materia_price: materia_price,
                                status_name: status_name,
                                status_value: status_value,
                                effective_status_value: effective_status_value,
                                is_too_large_value: is_too_large_value,
                                cost: materia_price
                            });
                        }
                        else if (count < 5) {
                            // 禁断の場合

                            if (!status.kindan_enabled) {
                                // 禁断に使用できないマテリアなら計算失敗
                                total_cost = NaN;
                                return false; // break
                            }
                            var success_rate = success_rates[count - materia_slot_count];
                            if (success_rate <= 0.0) {
                                // 禁断成功率が0なら計算失敗
                                total_cost = NaN;
                                return false; // break
                            }
                            cost = materia_price / success_rate;
                            materias.push({
                                index: count,
                                is_safety: false,
                                success_rate: success_rate,
                                materia_name: materia_name,
                                materia_official_site_db_id: materia_official_site_db_id,
                                materia_price: materia_price,
                                status_name: status_name,
                                status_value: status_value,
                                effective_status_value: effective_status_value,
                                is_too_large_value: is_too_large_value,
                                cost: materia_price
                            });
                        }
                        else {
                            throw new Error("コストの計算中にマテリアのインデックスが5以上であることを検出しました。");
                        }
                        total_cost += cost;
                    });
                    if (isNaN(total_cost))
                        return null;
                    return {
                        total_cost: Math.round(total_cost),
                        materias: materias
                    };
                }

                var minimum_cost = NaN,
                    minimum_cost_collection = null;
                $.each(combination, function (combination_index, combination_element) {
                    var pattern_array = master_permutation_table[combination_element.length];
                    $.each(pattern_array, function (pattern_index, pattern) {
                        var materia_ids = GetMateriaIDsOrderByCombinationPattern(combination_element, pattern),
                            current_cost = CalculateCost(desired_status, materia_ids, item_price_list, is_high_quality, materia_slot_count, used_materia_count);
                        if (current_cost === null) {
                            // 相場が未設定のアイテムが存在するためコストの計算ができなかった場合
                            // nop
                        }
                        else if (isNaN(minimum_cost) || current_cost.total_cost < minimum_cost) {
                            // 初回の計算成功、あるいは現在までの最低コストよりも安価な計算結果であった場合
                            minimum_cost = current_cost.total_cost;
                            minimum_cost_collection = {};
                            minimum_cost_collection[materia_ids] = current_cost;
                        }
                        else if (current_cost.total_cost === minimum_cost) {
                            // 現在までの最低コストと同じ計算結果であった場合
                            if (!minimum_cost_collection.hasOwnProperty(materia_ids))
                                minimum_cost_collection[materia_ids] = current_cost;
                        }
                        else {
                            // 現在までの最低コストより高価な計算結果であった場合
                            // nop
                        }
                    });
                });
                if (minimum_cost_collection === null)
                    return null;
                var minimum_cost_array = [];
                $.each(minimum_cost_collection, function (index, minimum_cost_collection_element) {
                    minimum_cost_array.push(minimum_cost_collection_element);
                });
                return minimum_cost_array;
            }

            function BuildCalculationResultObject(maximum_grade_id, is_high_quality, materia_slot_count, used_materia_count, desired_status, consider_kindan, item_price_list, least_cost_materias) {
                var result_desired_status = [];
                $.each(desired_status, function (status_index, status_element) {
                    result_desired_status.push({ status_name: master_status[status_element.status_id].name[lang], value_string: "+" + status_element.value });
                });
                var result_item_prices = [];
                $.each(QueryComsumedItemIDs(desired_status, maximum_grade_id), function (index, item_id) {
                    result_item_prices.push({ item_name: master_items[item_id].name[lang], price: item_price_list[item_id] });
                });
                return {
                    setting: {
                        maximum_grade_id: maximum_grade_id,
                        is_high_quality: is_high_quality,
                        materia_slot_count: materia_slot_count,
                        used_materia_count: used_materia_count,
                        desired_status: result_desired_status,
                        consider_kindan: consider_kindan,
                        item_prices: result_item_prices
                    },
                    total_cost: least_cost_materias.total_cost,
                    materias: least_cost_materias.materias
                };
            }

            var is_high_quality = param.is_high_quality,
                consider_kindan = param.consider_kindan,
                maximum_grade_id = param.maximum_grade_id;
            if (maximum_grade_id <= 0 || maximum_grade_id >= master_grades.length)
                return null;
            var materia_slot_count = param.materia_slot_count;
            if (materia_slot_count <= 0 || materia_slot_count > 5)
                return null;
            var used_materia_count = param.used_materia_count;
            if (used_materia_count < 0 || used_materia_count >= 5)
                return null;
            var desired_status = NormalizeStatus(param.desired_status);
            if (desired_status.length <= 0)
                return null;
            var max_materia_count = (consider_kindan ? 5 : materia_slot_count) - used_materia_count;
            if (max_materia_count < 1)
                return null;
            var price_list = param.price_list;
            if (!CheckItemPriceList(price_list, desired_status, maximum_grade_id))
                return null;
            var max_combination_array_length = max_materia_count + 1 - desired_status.length,
                materia_combinations_by_status = BuildMateriaCombinations(desired_status),
                materia_combinations = ConcatinateCombination(materia_combinations_by_status, max_materia_count),
                least_cost_materias = GetLeastCostMaterias(materia_combinations, desired_status, price_list, is_high_quality, materia_slot_count, used_materia_count);
            if (least_cost_materias === null || least_cost_materias.length <= 0)
                return null;
            return BuildCalculationResultObject(maximum_grade_id, is_high_quality, materia_slot_count, used_materia_count, desired_status, consider_kindan, price_list, least_cost_materias[0]);
        }

        function GetCalculationResultStatus(calc_result) {
            var text_desired_status = [];
            $.each(calc_result.setting.desired_status, function (index, desired_status_element) {
                text_desired_status.push(desired_status_element.status_name + desired_status_element.value_string);
            });
            return text_desired_status.toString();
        }

        function GetCalculationResultMaterias(calc_result) {
            var minimum_materia_index = 5,
                result_text_materias1 = "";
            $.each(calc_result.materias, function (index, materia) {
                if (materia.index < minimum_materia_index)
                    minimum_materia_index = materia.index;
                result_text_materias1 += "<tr" +
                    (materia.is_safety ? "" : " class=\"notsafetymateriastyle\"") +
                    "><td>" +
                    (materia.index + 1) +
                    "</td><td><a href=\"http://jp.finalfantasyxiv.com/lodestone/playguide/db/item/" +
                    materia.materia_official_site_db_id +
                    "/\" target=\"_blank\">" +
                    materia.materia_name +
                    "</a></td><td>" +
                    materia.status_name +
                    "<span" +
                    (materia.is_too_large_value ? " class=\"toolargestatusvaluestyle\"" : "") +
                    ">+" +
                    materia.effective_status_value +
                    "</span></td><td class=\"successratecolumnstyle\">" +
                    (materia.success_rate * 100).toFixed(0) +
                    "%</td></tr>";
            });
            var result_text_materias2 = "";
            if (minimum_materia_index > 0) {
                var used_materia_text = $("#usedslottext").val();
                for (var index = 0; index < minimum_materia_index; ++index) {
                    result_text_materias2 += "<tr class=\"usedmateriastyle\"><td>" +
                        (index + 1) +
                        "</td><td colspan=\"4\"><span>" +
                        used_materia_text +
                        "</span></tr>";
                }
            }
            return result_text_materias2 + result_text_materias1;
        }

        // htmlテキストを設定する。
        // 最初から直にhtmlテキストに書いておかない理由は、将来ゲームの仕様変更により変更があった場合にhtmlのメンテナンスが面倒なため。
        $("#statustype1,#statustype2,#statustype3,#statustype4,#statustype5").html(GetStatusSelectionItems());
        $("#itempricelist tbody").html(GetItemPriceList());

        $("#maximumgradeid").change(function () {
            var control_id = $(this).attr("id");
            RefreshStatusValueSelectionItems("statustype1", control_id);
            RefreshStatusValueSelectionItems("statustype2", control_id);
            RefreshStatusValueSelectionItems("statustype3", control_id);
            RefreshStatusValueSelectionItems("statustype4", control_id);
            RefreshStatusValueSelectionItems("statustype5", control_id);
            RefreshItemPriceVisibility();
            RefreshCalculationButtonEnablement();
        });
        $("#statustype1,#statustype2,#statustype3,#statustype4,#statustype5").change(function () {
            RefreshStatusValueSelectionItems($(this).attr("id"), "maximumgradeid");
            RefreshItemPriceVisibility();
            RefreshCalculationButtonEnablement();
        });
        $("#statusvalue1,#statusvalue2,#statusvalue3,#statusvalue4,#statusvalue5").change(function () {
            RefreshCalculationButtonEnablement();
        });
        $("#itempricelist input[type='checkbox']").change(function () {
            var item_id = $(this).data("itemid");
            if (item_id > 0) {
                RefreshItemPriceControlStyle(item_id);
                RefreshCalculationButtonEnablement();
            }
        });
        $("#itempricelist input[type='text']").change(function () {
            var item_id = $(this).data("itemid");
            if (item_id > 0) {
                RefreshItemPriceControlStyle(item_id);
                RefreshCalculationButtonEnablement();
            }
        });
        $("#itempricelist input[type='text']").keyup(function () {
            var item_id = $(this).data("itemid");
            if (item_id > 0) {
                RefreshItemPriceControlStyle(item_id);
                RefreshCalculationButtonEnablement();
            }
        });
        $(".errormessageiconstyle").on({
            'mouseenter': function () {
                var text = $(this).data("text");
                $(this).append('<div class="errormessagetooltipstyle">' + text + '</div>');
            },
            'mouseleave': function () {
                $(this).find(".errormessagetooltipstyle").remove();
            }
        });

        $("#itempriceclearbutton").on('click', function () {
            SaveSettings();
            localStorage.item_prices = master_initial_item_prices;
            LoadSettings();
        });

        $("#itempriceexsamplebutton").on('click', function () {
            SaveSettings();
            localStorage.item_prices = master_exsample_item_prices;
            LoadSettings();
        });

        $("#pagelayout").change(function () {
            SaveSettings();
            location.reload();
        });

        $("a[href='#mainview']").on('click', function () {
            SwitchView("mainview");
        });

        $("a[href='#outlineview']").on('click', function () {
            SwitchView("outlineview");
        });

        $("a[href='#generalsettingview']").on('click', function () {
            SwitchView("generalsettingview");
        });

        $("#calculatebutton").on('click', function () {
            SaveSettings();
            var param = {
                maximum_grade_id: ParseIDString($("#maximumgradeid").val()),
                is_high_quality: $("input[name='quality']:checked").val() === "hq",
                materia_slot_count: ParseNumberString($("#materiaslotcount").val()),
                used_materia_count: ParseNumberString($("#usedmateriacount").val()),
                desired_status: [
                    { status_id: ParseIDString($("#statustype1").val()), value: ParseNumberString($("#statusvalue1").val()) },
                    { status_id: ParseIDString($("#statustype2").val()), value: ParseNumberString($("#statusvalue2").val()) },
                    { status_id: ParseIDString($("#statustype3").val()), value: ParseNumberString($("#statusvalue3").val()) },
                    { status_id: ParseIDString($("#statustype4").val()), value: ParseNumberString($("#statusvalue4").val()) },
                    { status_id: ParseIDString($("#statustype5").val()), value: ParseNumberString($("#statusvalue5").val()) }
                ],
                consider_kindan: $("input[name='kindanallowed']:checked").val() === "enabled",
                price_list: GetVisibleItemPriceList()
            };
            var calc_result = Calculate(param);
            if (calc_result !== null) {
                $("#resultdesiredstatustable").text(GetCalculationResultStatus(calc_result));
                $("#resulttotalcostvalue").text(calc_result.total_cost <= 0 ? "" : calc_result.total_cost.toPriceNumberString());
                $("#resultmateriastable").html(GetCalculationResultMaterias(calc_result));
                SwitchView("resultview");
            }
            else {
                SwitchView("errorview");
            }
        });

        LoadSettings();

        // ここまで成功したらフッタ(メニューや著作権情報表示)を表示し、ローディング表示を非表示にする。    
        $("#loadingview").hide();
        $("footer").show();

        // 表示URLで指定されたハッシュに従ってビューを切り替える。既定はmainview。
        switch (location.hash) {
            case "#generalsettingview":
            case "#outlineview":
                SwitchView(location.hash.substring(1));
                break;
            default:
                SwitchView("mainview");
                break;
        }
    });
});