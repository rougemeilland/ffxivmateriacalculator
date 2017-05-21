/*
  Uint16Array.cs

  Copyright (c) 2017 Palmtree Software

  This software is released under the MIT License.
  https://opensource.org/licenses/MIT
*/

using System.Collections;
using System.Collections.Generic;
using System.Linq;

namespace MasterDataGenerator.ZIP
{
    class Uint16Array
        : IEnumerable<ushort>
    {
        private TypedArray<ushort> _imp;

        private Uint16Array(TypedArray<ushort> imp)
        {
            _imp = imp;
        }

        public Uint16Array(Array array)
            : this(new TypedArray<ushort>(array.Select(item => (ushort)item).ToArray()))
        {
        }

        public Uint16Array(int size)
            : this(new TypedArray<ushort>(size))
        {
        }

        public int length
        {
            get
            {
                return (_imp.length);
            }
        }

        public ushort this[int index]
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

        public void fill(ushort value, int begin = 0, int end = int.MaxValue)
        {
            _imp.fill(value, begin, end);
        }

        public void set(Uint16Array array, int offset = 0)
        {
            _imp.set(array._imp, offset);
        }

        public Uint16Array slice(int begin, int end)
        {
            return (new Uint16Array(_imp.slice(begin, end)));
        }

        public Uint16Array subarray(int begin, int end)
        {
            return (new Uint16Array(_imp.subarray(begin, end)));
        }

        public IEnumerator<ushort> GetEnumerator()
        {
            return (_imp.Cast<ushort>().GetEnumerator());
        }

        IEnumerator IEnumerable.GetEnumerator()
        {
            return (GetEnumerator());
        }
    }
}