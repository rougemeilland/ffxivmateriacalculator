/*
  Materia.cs

  Copyright (c) 2017 Palmtree Software

  This software is released under the MIT License.
  https://opensource.org/licenses/MIT
*/

using System;
using System.Collections.Generic;

namespace MasterDataGenerator
{
    internal class Materia
    {
        #region コンストラクタ

        public Materia(MateriaID materia_id, ItemID item_id, StatusID status_id, GradeID grade_id, int value)
        {
            if (materia_id == MateriaID.None)
                throw new ArgumentException();
            if (item_id == ItemID.None)
                throw new ArgumentException();
            if (status_id == StatusID.None)
                throw new ArgumentException();
            if (grade_id == GradeID.None)
                throw new ArgumentException();
            if (value <= 0)
                throw new ArgumentException();
            MateriaID = materia_id;
            ItemID = item_id;
            StatusID = status_id;
            GradeID = grade_id;
            Value = value;
        }

        #endregion

        #region パブリックメソッド

        public object SerializeToObject()
        {
            var dic = new Dictionary<string, object>();
            dic["materia_id"] = (int)MateriaID;
            dic["item_id"] = (int)ItemID;
            dic["status_id"] = (int)StatusID;
            dic["grade_id"] = (int)GradeID;
            dic["value"] = Value;
            return (dic);
        }

        #endregion

        #region パブリックプロパティ

        public MateriaID MateriaID { get; private set; }
        public ItemID ItemID { get; private set; }
        public StatusID StatusID { get; private set; }
        public GradeID GradeID { get; private set; }
        public int Value { get; private set; }

        #endregion
    }
}