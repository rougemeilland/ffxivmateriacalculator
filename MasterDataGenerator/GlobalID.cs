/*
  GlobalID.cs

  Copyright (c) 2017 Palmtree Software

  This software is released under the MIT License.
  https://opensource.org/licenses/MIT
*/

using System;
using System.Linq;
using System.Text;
using Palmtree;

namespace MasterDataGenerator
{
    internal class GlobalID
        : IEquatable<GlobalID>
    {
        #region プライベートフィールド

        private string _id;

        #endregion

        #region コンストラクタ

        public GlobalID(string seed_string)
        {
            _id = Encoding.UTF8.GetBytes(seed_string).ComputeHashBytes().Take(5).ToArray().ToBase32String();
        }

        #endregion

        #region パブリックメソッド

        public object SerializeToObject()
        {
            return (_id);
        }

        #endregion

        #region object から継承されたメンバ

        public override bool Equals(object o)
        {
            if (o == null || GetType() != o.GetType())
                return (false);
            return (Equals((GlobalID)o));
        }

        public override int GetHashCode()
        {
            return (_id.GetHashCode());
        }

        public override string ToString()
        {
            return (_id);
        }

        #endregion

        #region IEquatable<GlobalID> のメンバ

        public bool Equals(GlobalID o)
        {
            if (o == null || GetType() != o.GetType())
                return (false);
            if (!_id.Equals(o._id))
                return (false);
            return (true);
        }

        #endregion
    }
}