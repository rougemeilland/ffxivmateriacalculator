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