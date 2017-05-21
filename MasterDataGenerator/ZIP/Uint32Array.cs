/*
  Uint32Array.cs

  Copyright (c) 2017 Palmtree Software

  This software is released under the MIT License.
  https://opensource.org/licenses/MIT
*/

using System.Collections;
using System.Collections.Generic;
using System.Linq;

namespace MasterDataGenerator.ZIP
{
    class Uint32Array
        : IEnumerable<uint>
    {
        private TypedArray<uint> _imp;

        private Uint32Array(TypedArray<uint> imp)
        {
            _imp = imp;
        }

        public Uint32Array(Array array)
            : this(new TypedArray<uint>(array.Select(item => (uint)item).ToArray()))
        {
        }

        public Uint32Array(int size)
            : this(new TypedArray<uint>(size))
        {
        }

        public int length
        {
            get
            {
                return (_imp.length);
            }
        }

        public uint this[int index]
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

        public void fill(uint value, int begin = 0, int end = int.MaxValue)
        {
            _imp.fill(value, begin, end);
        }

        public void set(Uint32Array array, int offset = 0)
        {
            _imp.set(array._imp, offset);
        }

        public Uint32Array slice(int begin, int end)
        {
            return (new Uint32Array(_imp.slice(begin, end)));
        }

        public Uint32Array subarray(int begin, int end)
        {
            return (new Uint32Array(_imp.subarray(begin, end)));
        }

        public IEnumerator<uint> GetEnumerator()
        {
            return (_imp.Cast<uint>().GetEnumerator());
        }

        IEnumerator IEnumerable.GetEnumerator()
        {
            return (GetEnumerator());
        }
    }
}