/*
  TypedArray.cs

  Copyright (c) 2017 Palmtree Software

  This software is released under the MIT License.
  https://opensource.org/licenses/MIT
*/

using System.Collections;
using System.Collections.Generic;
using System.Linq;

namespace MasterDataGenerator.ZIP
{
    class TypedArray<ELEMENT_T>
        : IEnumerable<ELEMENT_T>
    {
        private ELEMENT_T[] _imp;
        private int _begin;
        private int _end;

        private TypedArray(ELEMENT_T[] array, int begin, int end)
        {
            _imp = array;
            _begin = begin;
            _end = end;
        }

        public TypedArray(ELEMENT_T[] array)
            : this(array, 0, array.Length)
        {
            _imp = array;
            _begin = 0;
            _end = array.Length;
        }

        public TypedArray(int size)
            : this(new ELEMENT_T[size])
        {
        }

        public int length
        {
            get
            {
                return (_end - _begin);
            }
        }

        public ELEMENT_T this[int index]
        {
            get
            {
                return (_imp[index + _begin]);
            }

            set

            {
                _imp[index + _begin] = value;
            }
        }

        public void fill(ELEMENT_T value, int begin = 0, int end = int.MaxValue)
        {
            if (end == int.MaxValue)
                end = _end - _begin;
            if (_begin + begin >= _end)
                throw new System.ArgumentException();
            if (_begin + end > _end)
                throw new System.ArgumentException();
            if (begin > end)
                throw new System.ArgumentException();
            for (var index = _begin + begin; index < _begin + end; ++index)
                _imp[index] = value;
        }

        public void set(TypedArray<ELEMENT_T> array, int offset = 0)
        {
            if (_begin + array.length >= _imp.Length)
                throw new System.ArgumentException();
            System.Array.Copy(array._imp, array._begin, _imp, _begin + offset, array._end - array._begin);
        }

        public TypedArray<ELEMENT_T> slice(int begin, int end)
        {
            if (_begin + begin >= _end)
                throw new System.ArgumentException();
            if (_begin + end > _end)
                throw new System.ArgumentException();
            if (begin > end)
                throw new System.ArgumentException();
            return new TypedArray<ELEMENT_T>(_imp.Skip(_begin + begin).Take(end - begin).ToArray());
        }

        public TypedArray<ELEMENT_T> subarray(int begin, int end)
        {
            if (_begin + begin >= _end)
                throw new System.ArgumentException();
            if (_begin + end > _end)
                throw new System.ArgumentException();
            if (begin > end)
                throw new System.ArgumentException();
            return new TypedArray<ELEMENT_T>(_imp, _begin + begin, _begin + end);
        }

        public ELEMENT_T[] RawArray
        {
            get
            {
                return (_imp.ToArray());
            }
        }

        public IEnumerator<ELEMENT_T> GetEnumerator()
        {
            return (_imp.Cast<ELEMENT_T>().GetEnumerator());
        }

        IEnumerator IEnumerable.GetEnumerator()
        {
            return (GetEnumerator());
        }

    }
}