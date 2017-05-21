/*
  Grade.cs

  Copyright (c) 2017 Palmtree Software

  This software is released under the MIT License.
  https://opensource.org/licenses/MIT
*/

using System;
using System.Collections.Generic;
using System.Linq;

namespace MasterDataGenerator
{
    internal class Grade
    {
        #region コンストラクタ

        public Grade(GradeID grade_id, MultiLanguageString name/*, int minimum_item_level*/, CatalystID default_catalyst_id, IEnumerable<CatalystID> catalyst_ids, IEnumerable<double> success_rate_nq, IEnumerable<double> success_rate_hq)
        {
            if (grade_id == GradeID.None)
                throw new ArgumentException();
            if (default_catalyst_id == CatalystID.None)
                throw new ArgumentException();
            if (catalyst_ids == null)
                throw new ArgumentNullException();
            if (catalyst_ids.Any(id => id == CatalystID.None))
                throw new ArgumentException();
            if (success_rate_nq == null)
                throw new ArgumentNullException();
            if (success_rate_hq == null)
                throw new ArgumentNullException();
            GradeID = grade_id;
            Name = name;
            //MinimumItemLevel = minimum_item_level;
            DefaultCatalystID = default_catalyst_id;
            CatalystIDs = catalyst_ids.ToArray();
            SuccessRateNQ = success_rate_nq.ToArray();
            SuccessRateHQ = success_rate_hq.ToArray();
        }

        #endregion

        #region パブリックメソッド

        public object SerializeToObject()
        {
            var dic = new Dictionary<string, object>();
            dic["grade_id"] = (int)GradeID;
            //dic["name"] = Name.SerializeToObject();
            //dic["minimum_item_level"] = MinimumItemLevel;
            dic["default_catalyst_id"] = (int)DefaultCatalystID;
            dic["catalyst_ids"] = CatalystIDs.OrderBy(x => x).Select(x => (int)x).ToArray();
            dic["success_rate_nq"] = SuccessRateNQ;
            dic["success_rate_hq"] = SuccessRateHQ;
            return (dic);
        }

        #endregion

        #region パブリックプロパティ

        public GradeID GradeID { get; private set; }
        public MultiLanguageString Name { get; private set; }
        //public int MinimumItemLevel { get; private set; }
        public CatalystID DefaultCatalystID { get; private set; }
        public IEnumerable<CatalystID> CatalystIDs { get; private set; }
        public IEnumerable<double> SuccessRateNQ { get; private set; }
        public IEnumerable<double> SuccessRateHQ { get; private set; }

        #endregion
    }
}