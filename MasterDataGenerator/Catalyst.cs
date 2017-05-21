/*
  Catalyst.cs

  Copyright (c) 2017 Palmtree Software

  This software is released under the MIT License.
  https://opensource.org/licenses/MIT
*/

using System;
using System.Collections.Generic;
using System.Linq;

namespace MasterDataGenerator
{
    internal class Catalyst
    {
        #region コンストラクタ

        public Catalyst(CatalystID catalyst_id, MultiLanguageString name, IEnumerable<GradeID> grade_ids, ItemID item_id)
        {
            if (catalyst_id == CatalystID.None)
                throw new ArgumentException();
            if (grade_ids == null)
                throw new ArgumentNullException();
            if (grade_ids.Any(id => id == GradeID.None))
                throw new ArgumentException();
            CatalystID = catalyst_id;
            Name = name;
            GradeIDs = grade_ids.ToArray();
            ItemID = item_id;
        }

        #endregion

        #region パブリックメソッド

        public object SerializeToObject()
        {
            var dic = new Dictionary<string, object>();
            dic["catalyst_id"] = (int)CatalystID;
            dic["name"] = Name.SerializeToObject();
            dic["grade_ids"] = GradeIDs.OrderBy(id => id).Select(id => (int)id).ToArray();
            dic["item_id"] = (int)ItemID;
            return (dic);
        }

        #endregion

        #region パブリックプロパティ

        public CatalystID CatalystID { get; private set; }
        public MultiLanguageString Name { get; private set; }
        public IEnumerable<GradeID> GradeIDs { get; private set; }
        public ItemID ItemID { get; private set; }

        #endregion
    }
}