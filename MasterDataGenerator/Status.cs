/*
  Status.cs

  Copyright (c) 2017 Palmtree Software

  This software is released under the MIT License.
  https://opensource.org/licenses/MIT
*/

using System;
using System.Collections.Generic;
using System.Linq;

namespace MasterDataGenerator
{
    internal class Status
    {
        #region プライベートフィールド

        private Func<StatusID, IDictionary<GradeID, MateriaID>> _materia_ids_getter;
        private IDictionary<GradeID, MateriaID> _materia_ids;

        #endregion

        #region コンストラクタ

        public Status(StatusID status_id, MultiLanguageString name, Func<StatusID, IDictionary<GradeID, MateriaID>> materia_ids_getter)
        {
            if (status_id == StatusID.None)
                throw new ArgumentException();
            if (materia_ids_getter == null)
                throw new ArgumentNullException();
            StatusID = status_id;
            Name = name;
            _materia_ids_getter = materia_ids_getter;
            _materia_ids = null;
        }

        #endregion

        #region パブリックメソッド

        public object SerializeToObject()
        {
            var dic = new Dictionary<string, object>();
            dic["status_id"] = (int)StatusID;
            dic["name"] = Name.SerializeToObject();
            var max_grade_id = MateriaIDsIndexedByGradeID.Keys.Max();
            var array = new int[max_grade_id - GradeID.None + 1];
            foreach (var grade_id in MateriaIDsIndexedByGradeID.Keys)
                array[grade_id - GradeID.None] = MateriaIDsIndexedByGradeID[grade_id] - MateriaID.None;
            dic["materia_ids"] = array;
            return (dic);
        }

        #endregion

        #region パブリックプロパティ

        public StatusID StatusID { get; private set; }
        public MultiLanguageString Name { get; private set; }
        public IDictionary<GradeID, MateriaID> MateriaIDsIndexedByGradeID
        {
            get
            {
                if (_materia_ids == null)
                {
                    _materia_ids = _materia_ids_getter(StatusID).ToDictionary(item => item.Key, item => item.Value);
                    if (_materia_ids == null)
                        throw new ApplicationException();
                    if (!_materia_ids.Any())
                        throw new ApplicationException();
                }
                return (_materia_ids);
            }
        }

        #endregion
    }
}