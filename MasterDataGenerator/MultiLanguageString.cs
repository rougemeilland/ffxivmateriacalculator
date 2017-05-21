/*
  MultiLanguageString.cs

  Copyright (c) 2017 Palmtree Software

  This software is released under the MIT License.
  https://opensource.org/licenses/MIT
*/

using System;
using System.Collections.Generic;

namespace MasterDataGenerator
{
    internal class MultiLanguageString
    {
        #region プライベートフィールド

        private string _ja;
        private string _en;
        private string _de;
        private string _fr;

        #endregion

        #region コンストラクタ

        public MultiLanguageString(string en, string de, string fr, string ja)
        {
            if (en == null)
                throw new ArgumentNullException();
            if (de == null)
                throw new ArgumentNullException();
            if (fr == null)
                throw new ArgumentNullException();
            if (ja == null)
                throw new ArgumentNullException();
            _en = en;
            _de = de;
            _fr = fr;
            _ja = ja;
        }

        #endregion

        #region パブリックメソッド

        public object SerializeToObject()
        {
            var dic = new Dictionary<string, object>();
            dic["en"] = _en;
            dic["de"] = _de;
            dic["fr"] = _fr;
            dic["ja"] = _ja;
            return (dic);
        }

        #endregion

        #region パブリックプロパティ

        public string this[string lang]
        {
            get
            {
                switch (lang)
                {
                    case "en":
                        return (_en);
                    case "de":
                        return (_de);
                    case "fr":
                        return (_fr);
                    case "ja":
                        return (_ja);
                    default:
                        throw new ArgumentException();
                }
            }
        }

        #endregion
    }
}