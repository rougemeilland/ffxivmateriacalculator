/*
  Array.cs

  Copyright (c) 2017 Palmtree Software

  This software is released under the MIT License.
  https://opensource.org/licenses/MIT
*/

using System.Collections;
using System.Collections.Generic;
using System.Linq;

namespace MasterDataGenerator.ZIP
{
    class Array
        : IEnumerable<int>
    {
        private int[] _imp;

        private Array(byte[] data)
        {
            _imp = data.Select(item => (int)item).ToArray();
        }

        private Array(int[] data)
        {
            _imp = data.ToArray();
        }

        public Array(int size)
            : this(new int[size])
        {
        }

        public static Array from(params int[] data)
        {
            return (new Array(data));
        }

        public static Array from(params byte[] data)
        {
            return (new Array(data));
        }

        public Array slice(int begin, int end)
        {
            return new Array(_imp.Skip(begin).Take(end - begin).ToArray());
        }

        public int length
        {
            get
            {
                return (_imp.Length);
            }
        }

        public int this[int index]
        {
            get
            {
                return (_imp[index]);
            }

            set
            {
                _imp[index] = value;
            }
        }

        public IEnumerator<int> GetEnumerator()
        {
            return (_imp.Cast<int>().GetEnumerator());
        }

        IEnumerator IEnumerable.GetEnumerator()
        {
            return (GetEnumerator());
        }
    }
}