/*
  Item.cs

  Copyright (c) 2017 Palmtree Software

  This software is released under the MIT License.
  https://opensource.org/licenses/MIT
*/

using System;
using System.Collections.Generic;

namespace MasterDataGenerator
{
    internal class Item
    {
        #region コンストラクタ

        public Item(ItemID item_id, MultiLanguageString name, GlobalID global_item_id, string official_site_db_id)
        {
            if (item_id == ItemID.None)
                throw new ArgumentException();
            if (name == null)
                throw new ArgumentNullException();
            if (global_item_id == null)
                throw new ArgumentNullException();
            ItemID = item_id;
            Name = name;
            GlobalItemID = global_item_id;
            OfficialSiteDatabaseID = official_site_db_id;
        }

        #endregion

        #region パブリックメソッド

        public object SerializeToObject()
        {
            var dic = new Dictionary<string, object>();
            dic["item_id"] = (int)ItemID;
            dic["name"] = Name.SerializeToObject();
            dic["global_item_id"] = GlobalItemID.SerializeToObject();
            dic["official_site_db_id"] = OfficialSiteDatabaseID;
            return (dic);
        }

        #endregion

        #region パブリックプロパティ

        public ItemID ItemID { get; private set; }
        public MultiLanguageString Name { get; private set; }
        public GlobalID GlobalItemID { get; private set; }
        public string OfficialSiteDatabaseID { get; private set; }

        #endregion
    }
}