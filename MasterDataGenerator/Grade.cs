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

        public Grade(GradeID grade_id, MultiLanguageString name, IEnumerable<double> success_rate_nq, IEnumerable<double> success_rate_hq)
        {
            if (grade_id == GradeID.None)
                throw new ArgumentException();
            if (success_rate_nq == null)
                throw new ArgumentNullException();
            if (success_rate_hq == null)
                throw new ArgumentNullException();
            GradeID = grade_id;
            Name = name;
            SuccessRateNQ = success_rate_nq.ToArray();
            SuccessRateHQ = success_rate_hq.ToArray();
        }

        #endregion

        #region パブリックメソッド

        public object SerializeToObject()
        {
            var dic = new Dictionary<string, object>();
            dic["grade_id"] = (int)GradeID;
            dic["success_rate_nq"] = SuccessRateNQ;
            dic["success_rate_hq"] = SuccessRateHQ;
            return (dic);
        }

        #endregion

        #region パブリックプロパティ

        public GradeID GradeID { get; private set; }
        public MultiLanguageString Name { get; private set; }
        public IEnumerable<double> SuccessRateNQ { get; private set; }
        public IEnumerable<double> SuccessRateHQ { get; private set; }

        #endregion
    }
}