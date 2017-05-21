/*
  MateriaCount.cs

  Copyright (c) 2017 Palmtree Software

  This software is released under the MIT License.
  https://opensource.org/licenses/MIT
*/

using System;
using System.Collections.Generic;

namespace MasterDataGenerator
{
    internal class MateriaCount
    {
        #region コンストラクタ

        public MateriaCount(MateriaID materia_id, int name)
        {
            if (materia_id == MateriaID.None)
                throw new ArgumentException();
            MateriaID = materia_id;
            Count = name;
        }

        #endregion

        #region パブリックメソッド

        public object SerializeToObject()
        {
            var dic = new Dictionary<string, object>();
            dic["materia_id"] = MateriaID;
            dic["count"] = Count;
            return (dic);
        }

        #endregion

        #region パブリックプロパティ

        public MateriaID MateriaID { get; private set; }
        public int Count { get; private set; }

        #endregion
    }
}