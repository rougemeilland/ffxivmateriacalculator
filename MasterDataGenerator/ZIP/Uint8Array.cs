/*
  Uint8Array.cs

  Copyright (c) 2017 Palmtree Software

  This software is released under the MIT License.
  https://opensource.org/licenses/MIT
*/

using System.Collections;
using System.Collections.Generic;
using System.Linq;

namespace MasterDataGenerator.ZIP
{
    class Uint8Array
        : IEnumerable<byte>
    {
        private TypedArray<byte> _imp;

        private Uint8Array(TypedArray<byte> imp)
        {
            _imp = imp;
        }

        public Uint8Array(Array array)
            : this(new TypedArray<byte>(array.Select(item => (byte)item).ToArray()))
        {
        }

        public Uint8Array(int size)
            : this(new TypedArray<byte>(size))
        {
        }

        public int length
        {
            get
            {
                return (_imp.length);
            }
        }

        public byte this[int index]
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

        public void fill(byte value, int begin = 0, int end = int.MaxValue)
        {
            _imp.fill(value, begin, end);
        }

        public void set(Uint8Array array, int offset = 0)
        {
            _imp.set(array._imp, offset);
        }

        public Uint8Array slice(int begin, int end)
        {
            return (new Uint8Array(_imp.slice(begin, end)));
        }

        public Uint8Array subarray(int begin, int end)
        {
            return (new Uint8Array(_imp.subarray(begin, end)));
        }

        public byte[] RawArray
        {
            get
            {
                return (_imp.RawArray);
            }
        }

        public IEnumerator<byte> GetEnumerator()
        {
            return (_imp.Cast<byte>().GetEnumerator());
        }

        IEnumerator IEnumerable.GetEnumerator()
        {
            return (GetEnumerator());
        }
    }
}