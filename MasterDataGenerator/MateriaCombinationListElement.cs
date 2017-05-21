/*
  MateriaCombinationListElement.cs

  Copyright (c) 2017 Palmtree Software

  This software is released under the MIT License.
  https://opensource.org/licenses/MIT
*/

using System;
using System.Collections.Generic;
using System.Linq;
using Palmtree.Collection;

namespace MasterDataGenerator
{
    internal class MateriaCombinationListElement
    {
        #region MateriaCountCollection の定義

        private class MateriaCountCollection
            : IReadOnlyIndexer<GradeID, int>
        {
            #region プライベートフィールド

            private IDictionary<GradeID, int> _source;

            #endregion

            #region コンストラクタ

            public MateriaCountCollection(IDictionary<GradeID, int> source)
            {
                _source = source;
            }

            #endregion

            #region パブリックメソッド

            /// <summary>
            /// 与えられた<see cref="MateriaCountCollection"/>オブジェクトとマテリア数の比較を行い、無駄なマテリアを使っているかどうかを調べます。
            /// </summary>
            /// <param name="x">
            /// 比較対象の<see cref="MateriaCountCollection"/>オブジェクトです。
            /// </param>
            /// <returns>
            /// すべてのグレードにおいてこのオブジェクトのマテリア数がxのマテリア数と等しいならばfalse,
            /// それ以外で、すべてのグレードにおいてこのオブジェクトのマテリア数がxのマテリア数に比べて等しいか大きいならばtrue,
            /// それ以外ならfalseを返します。
            /// </returns>
            public bool IsBaseOf(MateriaCountCollection x)
            {
                if (_source.Count != x._source.Count)
                    throw new ArgumentException();
                if (_source.Keys.Except(x._source.Keys).Any())
                    throw new ArgumentException();
                var flag_すべて等しいか大きい = true;
                var flag_すべて等しい = true;
                foreach (var item in _source)
                {
                    var key = item.Key;
                    var value1 = item.Value;
                    var value2 = x._source[key];
                    if (value1 < value2)
                        flag_すべて等しいか大きい = false;
                    if (value1 != value2)
                        flag_すべて等しい = false;
                }
                return (!flag_すべて等しい && flag_すべて等しいか大きい);
            }

            #endregion

            #region IReadOnlyIndexer<GradeID, int> のメンバ

            int IReadOnlyIndexer<GradeID, int>.this[GradeID key]
            {
                get
                {
                    return (_source[key]);
                }
            }

            #endregion
        }

        #endregion

        #region プライベートフィールド

        private MateriaCountCollection _materia_counts;

        #endregion

        #region コンストラクタ

        public MateriaCombinationListElement(IEnumerable<MateriaCount> items, Func<MateriaID, Materia> materia_getter, Func<StatusID, Status> status_getter)
        {
            if (items == null)
                throw new ArgumentNullException();
            if (!items.Any())
                throw new ArgumentNullException();
            Items = items.ToArray();
            MateriaIDs = items
                         .SelectMany(item => Enumerable.Repeat(item.MateriaID, item.Count))
                         .OrderBy(item => materia_getter(item).GradeID)
                         .ToArray();
            var materia_count_collection = items
                                            .Select(item => new
                                            {
                                                materia = materia_getter(item.MateriaID),
                                                count = item.Count,
                                            })
                                            .ToArray();
            var status_id = materia_count_collection.Select(item => item.materia.StatusID).Distinct().Single();
            var status = status_getter(status_id);

            _materia_counts = new MateriaCountCollection(status.MateriaIDsIndexedByGradeID.Keys
                                                         .Select(grade_id =>
                                                         {
                                                             var found = items.Where(item => materia_getter(item.MateriaID).GradeID == grade_id).SingleOrDefault();
                                                             return (new { grade_id, count = found != null ? found.Count : 0 });
                                                         })
                                                         .ToDictionary(item => item.grade_id, item => item.count));
            TotalValue = materia_count_collection
                         .Sum(item => item.materia.Value * item.count);
            MaximumGradeID = materia_count_collection
                             .Max(item => item.materia.GradeID);
        }

        #endregion

        #region パブリックメソッド

        /// <summary>
        /// 与えられた<see cref="MateriaCombinationListElement"/>オブジェクトとマテリア数の比較を行い、無駄なマテリアを使っているかどうかを調べます。
        /// </summary>
        /// <param name="x">
        /// 比較対象の<see cref="MateriaCombinationListElement"/>オブジェクトです。
        /// </param>
        /// <returns>
        /// すべてのグレードにおいてこのオブジェクトのマテリア数がxのマテリア数と等しいならばfalse,
        /// それ以外で、すべてのグレードにおいてこのオブジェクトのマテリア数がxのマテリア数に比べて等しいか大きいならばtrue,
        /// それ以外ならfalseを返します。
        /// </returns>
        public bool IsBaseOf(MateriaCombinationListElement x)
        {
            return (_materia_counts.IsBaseOf(x._materia_counts));
        }

        public object SerializeToObject()
        {
            var dic = new Dictionary<string, object>();
            dic["total_value"] = TotalValue;
            dic["maximum_grade_id"] = (int)MaximumGradeID;
            dic["items"] = Items.OrderBy(x => x.MateriaID).Select(x => x.SerializeToObject()).ToArray();
            dic["materia_ids"] = MateriaIDs.OrderBy(x => x).Select(x => (int)x).ToArray();
            return (dic);
        }

        #endregion

        #region パブリックプロパティ

        public IEnumerable<MateriaCount> Items { get; private set; }
        public IEnumerable<MateriaID> MateriaIDs { get; private set; }

        public IReadOnlyIndexer<GradeID, int> MateriaCounts
        {
            get
            {
                return (_materia_counts);
            }
        }

        public int TotalValue { get; private set; }
        public GradeID MaximumGradeID { get; private set; }

        #endregion

    }
}