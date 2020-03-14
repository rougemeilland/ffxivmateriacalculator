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
                    "\" disabled/>" +
                    gil_name +
                    "</td><td><span id=\"itemnotusedtext" +
                    item_id +
                    "\" class=\"itemnotusedtextstyle\"> " +
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
                        else {
                            // マスターデータがアップグレードしたなどの理由で相場情報が存在しないアイテムがあった場合
                            $("#itemused" + item_id).prop("checked", false).change();
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