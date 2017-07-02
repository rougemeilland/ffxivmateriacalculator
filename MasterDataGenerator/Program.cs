/*
  Program.cs

  Copyright (c) 2017 Palmtree Software

  This software is released under the MIT License.
  https://opensource.org/licenses/MIT
*/

using System;
using System.IO;
using System.IO.Compression;
using System.Text;
using System.Collections.Generic;
using System.Linq;
using Palmtree;
using Palmtree.Collection;

namespace MasterDataGenerator
{
    class Program
    {
        static void Main(string[] args)
        {
            //InflateTest();
            GenerateMasterData();

            Console.WriteLine("OK");
            Console.ReadLine();
        }

        private static void InflateTest()
        {
            var path_list = new[]
            {
                @"..\..\html\master_data.json",// 高圧縮率が期待できるテキストファイル
                @"..\..\html\master_data.json.z",// 既にDeflate圧縮がされていてほとんど圧縮が期待できないファイル
            };
            foreach (var path in path_list)
                InflateTestFile(path);
        }

        static void InflateTestFile(string path)
        {
            var source = File.ReadAllBytes(path);
            Console.WriteLine(string.Format("{0}: source size={1}", path, source.Length));
            var d1 = Deflate(source);
            Console.WriteLine(string.Format("{0}: compressed data size={1}({2:P0})", path, d1.Length, (double)d1.Length / source.Length));
            var d2 = Inflate(d1);
            if (d2.Length != source.Length)
                throw new ApplicationException();
            if (!d2.Zip(source, (x, y) => new {x, y }).All(item => item.x == item.y))
                throw new ApplicationException();
            Console.WriteLine(string.Format("{0}: uncompressed data size={1}(Ok)", path, d2.Length));
        }

        static string DumpByteArray(byte[] array)
        {
            return string.Format("[{0}]", string.Join(",", array.Select(b => string.Format("0x{0:x2}", b))));
        }

        static byte[] Deflate(byte[] source)
        {
            using (var mds = new MemoryStream())
            {
                using (var cs = new DeflateStream(mds, CompressionMode.Compress, true))
                {
                    cs.Write(source, 0, source.Length);
                    cs.Flush();
                }
                return (mds.ToArray());
            }
        }

        static byte[] Inflate(byte[] source)
        {
            return (ZIP.Inflate.EntryPoint(new ZIP.Uint8Array(ZIP.Array.from(source))).RawArray);
        }

        private static void GenerateMasterData()
        {
            var grades_source = new[]
            {
                new { success_rates_nq = new[] { 40, 20, 10, 5 }, success_rates_hq = new[] { 45, 24, 14, 8 }, name_ja = "マテリア", name_en = "I", name_de = "I", name_fr = "I" },
                new { success_rates_nq = new[] { 36, 18, 9, 5 }, success_rates_hq = new[] { 41, 22, 13, 8 }, name_ja = "マテリラ", name_en = "II", name_de = "II", name_fr = "II" },
                new { success_rates_nq = new[] { 30, 15, 8, 4 }, success_rates_hq = new[] { 35, 19, 11, 7 }, name_ja = "マテリダ", name_en = "III", name_de = "III", name_fr = "III" },
                new { success_rates_nq = new[] { 24, 12, 6, 3 }, success_rates_hq = new[] { 29, 16, 10, 6 }, name_ja = "マテリガ", name_en = "IV", name_de = "IV", name_fr = "IV" },
                new { success_rates_nq = new[] { 12, 6, 3, 2 }, success_rates_hq = new[] { 17, 10, 7, 5 }, name_ja = "マテリジャ", name_en = "V", name_de = "V", name_fr = "V" },
                new { success_rates_nq = new[] { 12, 0, 0, 0 }, success_rates_hq = new[] { 17, 0, 0, 0 }, name_ja = "ハイマテリジャ", name_en = "VI", name_de = "VI", name_fr = "VI" },
            };
            var status_source = new[]
            {
                new { grades = new[] { "マテリア","マテリラ","マテリダ","マテリガ","マテリジャ","ハイマテリジャ"}, kindan_enabled = false, name_ja = "STR", materia_name_ja = "剛力の{0}", name_en = "Strength", materia_name_en = "Strength Materia {0}", name_de = "Stärke", materia_name_de = "Stärke-Materia {0}", name_fr = "Force", materia_name_fr = "Matéria de force {0}" },
                new { grades = new[] { "マテリア","マテリラ","マテリダ","マテリガ","マテリジャ","ハイマテリジャ"}, kindan_enabled = false, name_ja = "VIT", materia_name_ja = "活力の{0}", name_en = "Vitality", materia_name_en = "Vitality Materia {0}", name_de = "Konstitution", materia_name_de = "Konstitutions-Materia {0}", name_fr = "Vitalité", materia_name_fr = "Matéria de vitalité {0}" },
                new { grades = new[] { "マテリア","マテリラ","マテリダ","マテリガ","マテリジャ","ハイマテリジャ"}, kindan_enabled = false, name_ja = "DEX", materia_name_ja = "眼力の{0}", name_en = "Dexterity", materia_name_en = "Dexterity Materia {0}", name_de = "Geschick", materia_name_de = "Geschicklichkeits-Materia {0}", name_fr = "Dextérité", materia_name_fr = "Matéria de dextérité {0}"  },
                new { grades = new[] { "マテリア","マテリラ","マテリダ","マテリガ","マテリジャ","ハイマテリジャ"}, kindan_enabled = false, name_ja = "INT", materia_name_ja = "知力の{0}", name_en = "Intelligence", materia_name_en = "Intelligence Materia {0}", name_de = "Intelligenz", materia_name_de = "Intelligenz-Materia {0}", name_fr = "Intelligence", materia_name_fr = "Matéria d'intelligence {0}"  },
                new { grades = new[] { "マテリア","マテリラ","マテリダ","マテリガ","マテリジャ","ハイマテリジャ"}, kindan_enabled = false, name_ja = "MND", materia_name_ja = "心力の{0}", name_en = "Mind", materia_name_en = "Mind Materia {0}", name_de = "Willenskraft", materia_name_de = "Willenskraft-Materia {0}", name_fr = "Esprit", materia_name_fr = "Matéria d'esprit {0}"  },
                new { grades = new[] { "マテリア","マテリラ","マテリダ","マテリガ","マテリジャ","ハイマテリジャ"}, kindan_enabled = true, name_ja = "火", materia_name_ja = "防火の{0}", name_en = "Fire Resistance", materia_name_en = "Fire Materia {0}", name_de = "Feuerresistenz", materia_name_de = "Feuer-Materia {0}", name_fr = "Résistance au feu", materia_name_fr = "Matéria pyrovoile {0}" },
                new { grades = new[] { "マテリア","マテリラ","マテリダ","マテリガ","マテリジャ","ハイマテリジャ"}, kindan_enabled = true, name_ja = "氷", materia_name_ja = "防氷の{0}", name_en = "Ice Resistance", materia_name_en = "Ice Materia {0}", name_de = "Eisresistenz", materia_name_de = "Eis-Materia {0}", name_fr = "Résistance à la glace", materia_name_fr = "Matéria cryovoile {0}"  },
                new { grades = new[] { "マテリア","マテリラ","マテリダ","マテリガ","マテリジャ","ハイマテリジャ"}, kindan_enabled = true, name_ja = "風", materia_name_ja = "防風の{0}", name_en = "Wind Resistance", materia_name_en = "Wind Materia {0}", name_de = "Windresistenz", materia_name_de = "Wind-Materia {0}", name_fr = "Résistance au vent", materia_name_fr = "Matéria aérovoile {0}"  },
                new { grades = new[] { "マテリア","マテリラ","マテリダ","マテリガ","マテリジャ","ハイマテリジャ"}, kindan_enabled = true, name_ja = "土", materia_name_ja = "防土の{0}", name_en = "Earth Resistance", materia_name_en = "Earth Materia {0}", name_de = "Erdresistenz", materia_name_de = "Erd-Materia {0}", name_fr = "Résistance à la terre", materia_name_fr = "Matéria géovoile {0}"  },
                new { grades = new[] { "マテリア","マテリラ","マテリダ","マテリガ","マテリジャ","ハイマテリジャ"}, kindan_enabled = true, name_ja = "雷", materia_name_ja = "防雷の{0}", name_en = "Lightning Resistance", materia_name_en = "Lightning Materia {0}", name_de = "Blitzresistenz", materia_name_de = "Blitz-Materia {0}", name_fr = "Résistance à la foudre", materia_name_fr = "Matéria électrovoile {0}"  },
                new { grades = new[] { "マテリア","マテリラ","マテリダ","マテリガ","マテリジャ","ハイマテリジャ"}, kindan_enabled = true, name_ja = "水", materia_name_ja = "防水の{0}", name_en = "Water Resistance", materia_name_en = "Water Materia {0}", name_de = "Wasserresistenz", materia_name_de = "Wasser-Materia {0}", name_fr = "Résistance à l'eau", materia_name_fr = "Matéria hydrovoile {0}"  },
                new { grades = new[] { "マテリア","マテリラ","マテリダ","マテリガ","マテリジャ","ハイマテリジャ"}, kindan_enabled = true, name_ja = "ダイレクトヒット", materia_name_ja = "天眼の{0}", name_en = "Direct Hit Rate", materia_name_en = "Heavens' Eye Materia {0}", name_de = "Direkter Treffer", materia_name_de = "Hellseher-Materia {0}", name_fr = "Coups nets", materia_name_fr = "Matéria du regard divin {0}"  },
                new { grades = new[] { "マテリア","マテリラ","マテリダ","マテリガ","マテリジャ","ハイマテリジャ"}, kindan_enabled = true, name_ja = "クリティカル", materia_name_ja = "武略の{0}", name_en = "Critical Hit Rate", materia_name_en = "Savage Aim Materia {0}", name_de = "Kritische Treffer", materia_name_de = "Strategen-Materia {0}", name_fr = "Critique", materia_name_fr = "Matéria de la barbarie maîtrisée {0}"  },
                new { grades = new[] { "マテリア","マテリラ","マテリダ","マテリガ","マテリジャ","ハイマテリジャ"}, kindan_enabled = true, name_ja = "意志力", materia_name_ja = "雄略の{0}", name_en = "Determination", materia_name_en = "Savage Might Materia {0}", name_de = "Entschlossenheit", materia_name_de = "Assassinen-Materia {0}", name_fr = "Détermination", materia_name_fr = "Matéria de la barbarie percutante {0}"  },
                new { grades = new[] { "マテリア","マテリラ","マテリダ","マテリガ","マテリジャ","ハイマテリジャ"}, kindan_enabled = true, name_ja = "不屈", materia_name_ja = "剛柔の{0}", name_en = "Tenacity", materia_name_en = "Battledance Materia {0}", name_de = "Unbeugsamkeit", materia_name_de = "Fechtkunst-Materia {0}", name_fr = "Ténacité", materia_name_fr = "Matéria de la parade stratégique {0}"  },
                new { grades = new[] { "マテリア","マテリラ","マテリダ","マテリガ","マテリジャ","ハイマテリジャ"}, kindan_enabled = true, name_ja = "信仰", materia_name_ja = "信力の{0}", name_en = "Piety", materia_name_en = "Piety Materia {0}", name_de = "Frömmigkeit", materia_name_de = "Frömmigkeits-Materia {0}", name_fr = "Piété", materia_name_fr = "Matéria de piété {0}"  },
                new { grades = new[] { "マテリア","マテリラ","マテリダ","マテリガ","マテリジャ","ハイマテリジャ"}, kindan_enabled = true, name_ja = "獲得力", materia_name_ja = "達識の{0}", name_en = "Gathering", materia_name_en = "Gatherer's Guerdon Materia {0}", name_de = "Sammelgeschick", materia_name_de = "Sammlersold-Materia {0}", name_fr = "Collecte", materia_name_fr = "Matéria de la collecte {0}"  },
                new { grades = new[] { "マテリア","マテリラ","マテリダ","マテリガ","マテリジャ","ハイマテリジャ"}, kindan_enabled = true, name_ja = "識質力", materia_name_ja = "博識の{0}", name_en = "Perception", materia_name_en = "Gatherer's Guile Materia {0}", name_de = "Wahrnehmung", materia_name_de = "Sammlerschlich-Materia {0}", name_fr = "Discernement", materia_name_fr = "Matéria du discernement {0}"  },
                new { grades = new[] { "マテリア","マテリラ","マテリダ","マテリガ","マテリジャ","ハイマテリジャ"}, kindan_enabled = true, name_ja = "GP", materia_name_ja = "器識の{0}", name_en = "GP", materia_name_en = "Gatherer's Grasp Materia {0}", name_de = "SP", materia_name_de = "Sammlersinn-Materia {0}", name_fr = "PR", materia_name_fr = "Matéria du rendement {0}"  },
                new { grades = new[] { "マテリア","マテリラ","マテリダ","マテリガ","マテリジャ","ハイマテリジャ"}, kindan_enabled = true, name_ja = "作業精度", materia_name_ja = "名匠の{0}", name_en = "Craftsmanship", materia_name_en = "Craftsman's Competence Materia {0}", name_de = "Kunstfertigkeit", materia_name_de = "Facharbeiter-Materia {0}", name_fr = "Habileté", materia_name_fr = "Matéria de l'art physique {0}"  },
                new { grades = new[] { "マテリア","マテリラ","マテリダ","マテリガ","マテリジャ","ハイマテリジャ"}, kindan_enabled = true, name_ja = "CP", materia_name_ja = "魔匠の{0}", name_en = "CP", materia_name_en = "Craftsman's Cunning Materia {0}", name_de = "HP", materia_name_de = "Fachwissen-Materia {0}", name_fr = "PS", materia_name_fr = "Matéria de l'art magique {0}"  },
                new { grades = new[] { "マテリア","マテリラ","マテリダ","マテリガ","マテリジャ","ハイマテリジャ"}, kindan_enabled = true, name_ja = "加工精度", materia_name_ja = "巨匠の{0}", name_en = "Control", materia_name_en = "Craftsman's Command Materia {0}", name_de = "Kontrolle", materia_name_de = "Fachkenntnis-Materia {0}", name_fr = "Contrôle", materia_name_fr = "Matéria du contrôle {0}"  },
                new { grades = new[] { "マテリア","マテリラ","マテリダ","マテリガ","マテリジャ","ハイマテリジャ"}, kindan_enabled = true, name_ja = "スキルスピード", materia_name_ja = "戦技の{0}", name_en = "Skill Speed", materia_name_en = "Quickarm Materia {0}", name_de = "Schnelligkeit", materia_name_de = "Kampf-Materia {0}", name_fr = "Vivacité", materia_name_fr = "Matéria de la vivacité {0}"  },
                new { grades = new[] { "マテリア","マテリラ","マテリダ","マテリガ","マテリジャ","ハイマテリジャ"}, kindan_enabled = true, name_ja = "スペルスピード", materia_name_ja = "詠唱の{0}", name_en = "Spell Speed", materia_name_en = "Quicktongue Materia {0}", name_de = "Zaubertempo", materia_name_de = "Zauber-Materia {0}", name_fr = "Célérité", materia_name_fr = "Matéria de la célérité {0}"  },
            };
            var materias_source = new[]
            {
                new { name_ja = "剛力のマテリア", value = 1 },
                new { name_ja = "剛力のマテリラ", value = 2 },
                new { name_ja = "剛力のマテリダ", value = 4 },
                new { name_ja = "剛力のマテリガ", value = 7 },
                new { name_ja = "剛力のマテリジャ", value = 15 },
                new { name_ja = "剛力のハイマテリジャ", value = 25 },

                new { name_ja = "活力のマテリア", value = 1 },
                new { name_ja = "活力のマテリラ", value = 2 },
                new { name_ja = "活力のマテリダ", value = 4 },
                new { name_ja = "活力のマテリガ", value = 8 },
                new { name_ja = "活力のマテリジャ", value = 15 },
                new { name_ja = "活力のハイマテリジャ", value = 25 },

                new { name_ja = "眼力のマテリア", value = 1 },
                new { name_ja = "眼力のマテリラ", value = 2 },
                new { name_ja = "眼力のマテリダ", value = 4 },
                new { name_ja = "眼力のマテリガ", value = 7 },
                new { name_ja = "眼力のマテリジャ", value = 15 },
                new { name_ja = "眼力のハイマテリジャ", value = 25 },

                new { name_ja = "知力のマテリア", value = 1 },
                new { name_ja = "知力のマテリラ", value = 2 },
                new { name_ja = "知力のマテリダ", value = 4 },
                new { name_ja = "知力のマテリガ", value = 7 },
                new { name_ja = "知力のマテリジャ", value = 15 },
                new { name_ja = "知力のハイマテリジャ", value = 25 },

                new { name_ja = "心力のマテリア", value = 1 },
                new { name_ja = "心力のマテリラ", value = 2 },
                new { name_ja = "心力のマテリダ", value = 4 },
                new { name_ja = "心力のマテリガ", value = 7 },
                new { name_ja = "心力のマテリジャ", value = 15 },
                new { name_ja = "心力のハイマテリジャ", value = 25 },

                new { name_ja = "防火のマテリア", value = 1 },
                new { name_ja = "防火のマテリラ", value = 2 },
                new { name_ja = "防火のマテリダ", value = 4 },
                new { name_ja = "防火のマテリガ", value = 6 },
                new { name_ja = "防火のマテリジャ", value = 9 },
                new { name_ja = "防火のハイマテリジャ", value = 12 },

                new { name_ja = "防氷のマテリア", value = 1 },
                new { name_ja = "防氷のマテリラ", value = 2 },
                new { name_ja = "防氷のマテリダ", value = 4 },
                new { name_ja = "防氷のマテリガ", value = 6 },
                new { name_ja = "防氷のマテリジャ", value = 9 },
                new { name_ja = "防氷のハイマテリジャ", value = 12 },

                new { name_ja = "防風のマテリア", value = 1 },
                new { name_ja = "防風のマテリラ", value = 2 },
                new { name_ja = "防風のマテリダ", value = 4 },
                new { name_ja = "防風のマテリガ", value = 6 },
                new { name_ja = "防風のマテリジャ", value = 9 },
                new { name_ja = "防風のハイマテリジャ", value = 12 },

                new { name_ja = "防土のマテリア", value = 1 },
                new { name_ja = "防土のマテリラ", value = 2 },
                new { name_ja = "防土のマテリダ", value = 4 },
                new { name_ja = "防土のマテリガ", value = 6 },
                new { name_ja = "防土のマテリジャ", value = 9 },
                new { name_ja = "防土のハイマテリジャ", value = 12 },

                new { name_ja = "防雷のマテリア", value = 1 },
                new { name_ja = "防雷のマテリラ", value = 2 },
                new { name_ja = "防雷のマテリダ", value = 4 },
                new { name_ja = "防雷のマテリガ", value = 6 },
                new { name_ja = "防雷のマテリジャ", value = 9 },
                new { name_ja = "防雷のハイマテリジャ", value = 12 },

                new { name_ja = "防水のマテリア", value = 1 },
                new { name_ja = "防水のマテリラ", value = 2 },
                new { name_ja = "防水のマテリダ", value = 4 },
                new { name_ja = "防水のマテリガ", value = 6 },
                new { name_ja = "防水のマテリジャ", value = 9 },
                new { name_ja = "防水のハイマテリジャ", value = 12 },

                new { name_ja = "天眼のマテリア", value = 2 },
                new { name_ja = "天眼のマテリラ", value = 4 },
                new { name_ja = "天眼のマテリダ", value = 6 },
                new { name_ja = "天眼のマテリガ", value = 9 },
                new { name_ja = "天眼のマテリジャ", value = 12 },
                new { name_ja = "天眼のハイマテリジャ", value = 40 },

                new { name_ja = "武略のマテリア", value = 2 },
                new { name_ja = "武略のマテリラ", value = 4 },
                new { name_ja = "武略のマテリダ", value = 6 },
                new { name_ja = "武略のマテリガ", value = 9 },
                new { name_ja = "武略のマテリジャ", value = 12 },
                new { name_ja = "武略のハイマテリジャ", value = 40 },

                new { name_ja = "雄略のマテリア", value = 1 },
                new { name_ja = "雄略のマテリラ", value = 3 },
                new { name_ja = "雄略のマテリダ", value = 4 },
                new { name_ja = "雄略のマテリガ", value = 6 },
                new { name_ja = "雄略のマテリジャ", value = 12 },
                new { name_ja = "雄略のハイマテリジャ", value = 40 },

                new { name_ja = "剛柔のマテリア", value = 2 },
                new { name_ja = "剛柔のマテリラ", value = 4 },
                new { name_ja = "剛柔のマテリダ", value = 6 },
                new { name_ja = "剛柔のマテリガ", value = 9 },
                new { name_ja = "剛柔のマテリジャ", value = 12 },
                new { name_ja = "剛柔のハイマテリジャ", value = 40 },

                new { name_ja = "信力のマテリア", value = 1 },
                new { name_ja = "信力のマテリラ", value = 2 },
                new { name_ja = "信力のマテリダ", value = 3 },
                new { name_ja = "信力のマテリガ", value = 6 },
                new { name_ja = "信力のマテリジャ", value = 11 },
                new { name_ja = "信力のハイマテリジャ", value = 40 },

                new { name_ja = "達識のマテリア", value = 3 },
                new { name_ja = "達識のマテリラ", value = 4 },
                new { name_ja = "達識のマテリダ", value = 5 },
                new { name_ja = "達識のマテリガ", value = 6 },
                new { name_ja = "達識のマテリジャ", value = 10 },
                new { name_ja = "達識のハイマテリジャ", value = 15 },

                new { name_ja = "博識のマテリア", value = 3 },
                new { name_ja = "博識のマテリラ", value = 4 },
                new { name_ja = "博識のマテリダ", value = 5 },
                new { name_ja = "博識のマテリガ", value = 6 },
                new { name_ja = "博識のマテリジャ", value = 10 },
                new { name_ja = "博識のハイマテリジャ", value = 15 },

                new { name_ja = "器識のマテリア", value = 1 },
                new { name_ja = "器識のマテリラ", value = 2 },
                new { name_ja = "器識のマテリダ", value = 3 },
                new { name_ja = "器識のマテリガ", value = 4 },
                new { name_ja = "器識のマテリジャ", value = 6 },
                new { name_ja = "器識のハイマテリジャ", value = 8 },

                new { name_ja = "名匠のマテリア", value = 3 },
                new { name_ja = "名匠のマテリラ", value = 4 },
                new { name_ja = "名匠のマテリダ", value = 5 },
                new { name_ja = "名匠のマテリガ", value = 6 },
                new { name_ja = "名匠のマテリジャ", value = 11 },
                new { name_ja = "名匠のハイマテリジャ", value = 16 },

                new { name_ja = "魔匠のマテリア", value = 1 },
                new { name_ja = "魔匠のマテリラ", value = 2 },
                new { name_ja = "魔匠のマテリダ", value = 3 },
                new { name_ja = "魔匠のマテリガ", value = 4 },
                new { name_ja = "魔匠のマテリジャ", value = 6 },
                new { name_ja = "魔匠のハイマテリジャ", value = 8 },

                new { name_ja = "巨匠のマテリア", value = 1 },
                new { name_ja = "巨匠のマテリラ", value = 2 },
                new { name_ja = "巨匠のマテリダ", value = 3 },
                new { name_ja = "巨匠のマテリガ", value = 4 },
                new { name_ja = "巨匠のマテリジャ", value = 7 },
                new { name_ja = "巨匠のハイマテリジャ", value = 10 },

                new { name_ja = "戦技のマテリア", value = 2 },
                new { name_ja = "戦技のマテリラ", value = 4 },
                new { name_ja = "戦技のマテリダ", value = 6 },
                new { name_ja = "戦技のマテリガ", value = 9 },
                new { name_ja = "戦技のマテリジャ", value = 12 },
                new { name_ja = "戦技のハイマテリジャ", value = 40 },

                new { name_ja = "詠唱のマテリア", value = 2 },
                new { name_ja = "詠唱のマテリラ", value = 4 },
                new { name_ja = "詠唱のマテリダ", value = 6 },
                new { name_ja = "詠唱のマテリガ", value = 9 },
                new { name_ja = "詠唱のマテリジャ", value = 12 },
                new { name_ja = "詠唱のハイマテリジャ", value = 40 },
            };
            var default_item_prices_source = new[]
            {
                new { name_ja = "剛力のマテリア", price = 500 },
                new { name_ja = "剛力のマテリラ", price = 500 },
                new { name_ja = "剛力のマテリダ", price = 600 },
                new { name_ja = "剛力のマテリガ", price = 1000 },
                new { name_ja = "剛力のマテリジャ", price = 19980 },
                new { name_ja = "剛力のハイマテリジャ", price = int.MaxValue },

                new { name_ja = "活力のマテリア", price = 350 },
                new { name_ja = "活力のマテリラ", price = int.MaxValue },
                new { name_ja = "活力のマテリダ", price = 600 },
                new { name_ja = "活力のマテリガ", price = 1000 },
                new { name_ja = "活力のマテリジャ", price = 33990 },
                new { name_ja = "活力のハイマテリジャ", price = int.MaxValue },

                new { name_ja = "眼力のマテリア", price = 1000 },
                new { name_ja = "眼力のマテリラ", price = 426 },
                new { name_ja = "眼力のマテリダ", price = 594 },
                new { name_ja = "眼力のマテリガ", price = 792 },
                new { name_ja = "眼力のマテリジャ", price = 4000 },
                new { name_ja = "眼力のハイマテリジャ", price = int.MaxValue },

                new { name_ja = "知力のマテリア", price = int.MaxValue },
                new { name_ja = "知力のマテリラ", price = 1000 },
                new { name_ja = "知力のマテリダ", price = 594 },
                new { name_ja = "知力のマテリガ", price = 800 },
                new { name_ja = "知力のマテリジャ", price = 3000 },
                new { name_ja = "知力のハイマテリジャ", price = int.MaxValue },

                new { name_ja = "心力のマテリア", price = int.MaxValue },
                new { name_ja = "心力のマテリラ", price = 500 },
                new { name_ja = "心力のマテリダ", price = 584 },
                new { name_ja = "心力のマテリガ", price = 800 },
                new { name_ja = "心力のマテリジャ", price = 5000 },
                new { name_ja = "心力のハイマテリジャ", price = int.MaxValue },

                new { name_ja = "防火のマテリア", price = 999 },
                new { name_ja = "防火のマテリラ", price = int.MaxValue },
                new { name_ja = "防火のマテリダ", price = int.MaxValue },
                new { name_ja = "防火のマテリガ", price = 9000 },
                new { name_ja = "防火のマテリジャ", price = 4495 },
                new { name_ja = "防火のハイマテリジャ", price = int.MaxValue },

                new { name_ja = "防氷のマテリア", price = 251 },
                new { name_ja = "防氷のマテリラ", price = 248 },
                new { name_ja = "防氷のマテリダ", price = 500 },
                new { name_ja = "防氷のマテリガ", price = 8000 },
                new { name_ja = "防氷のマテリジャ", price = 3500 },
                new { name_ja = "防氷のハイマテリジャ", price = int.MaxValue },

                new { name_ja = "防風のマテリア", price = 270 },
                new { name_ja = "防風のマテリラ", price = 298 },
                new { name_ja = "防風のマテリダ", price = 500 },
                new { name_ja = "防風のマテリガ", price = 4396 },
                new { name_ja = "防風のマテリジャ", price = 3495 },
                new { name_ja = "防風のハイマテリジャ", price = int.MaxValue },

                new { name_ja = "防土のマテリア", price = 239 },
                new { name_ja = "防土のマテリラ", price = 250 },
                new { name_ja = "防土のマテリダ", price = int.MaxValue },
                new { name_ja = "防土のマテリガ", price = 10396 },
                new { name_ja = "防土のマテリジャ", price = 3495 },
                new { name_ja = "防土のハイマテリジャ", price = int.MaxValue },

                new { name_ja = "防雷のマテリア", price = 250 },
                new { name_ja = "防雷のマテリラ", price = 298 },
                new { name_ja = "防雷のマテリダ", price = 550 },
                new { name_ja = "防雷のマテリガ", price = 30000 },
                new { name_ja = "防雷のマテリジャ", price = 4495 },
                new { name_ja = "防雷のハイマテリジャ", price = int.MaxValue },

                new { name_ja = "防水のマテリア", price = 290 },
                new { name_ja = "防水のマテリラ", price = 250 },
                new { name_ja = "防水のマテリダ", price = 300 },
                new { name_ja = "防水のマテリガ", price = int.MaxValue },
                new { name_ja = "防水のマテリジャ", price = 3895 },
                new { name_ja = "防水のハイマテリジャ", price = int.MaxValue },

                new { name_ja = "天眼のマテリア", price = 500 },
                new { name_ja = "天眼のマテリラ", price = 1350 },
                new { name_ja = "天眼のマテリダ", price = 800 },
                new { name_ja = "天眼のマテリガ", price = 1800 },
                new { name_ja = "天眼のマテリジャ", price = 39500 },
                new { name_ja = "天眼のハイマテリジャ", price = int.MaxValue },

                new { name_ja = "武略のマテリア", price = int.MaxValue },
                new { name_ja = "武略のマテリラ", price = 3980 },
                new { name_ja = "武略のマテリダ", price = 700 },
                new { name_ja = "武略のマテリガ", price = 1992 },
                new { name_ja = "武略のマテリジャ", price = 43800 },
                new { name_ja = "武略のハイマテリジャ", price = int.MaxValue },

                new { name_ja = "雄略のマテリア", price = 230 },
                new { name_ja = "雄略のマテリラ", price = 888 },
                new { name_ja = "雄略のマテリダ", price = 800 },
                new { name_ja = "雄略のマテリガ", price = 1000 },
                new { name_ja = "雄略のマテリジャ", price = 45900 },
                new { name_ja = "雄略のハイマテリジャ", price = int.MaxValue },

                new { name_ja = "剛柔のマテリア", price = 500 },
                new { name_ja = "剛柔のマテリラ", price = 3000 },
                new { name_ja = "剛柔のマテリダ", price = 694 },
                new { name_ja = "剛柔のマテリガ", price = 950 },
                new { name_ja = "剛柔のマテリジャ", price = 26800 },
                new { name_ja = "剛柔のハイマテリジャ", price = int.MaxValue },

                new { name_ja = "信力のマテリア", price = 500 },
                new { name_ja = "信力のマテリラ", price = 496 },
                new { name_ja = "信力のマテリダ", price = 584 },
                new { name_ja = "信力のマテリガ", price = 800 },
                new { name_ja = "信力のマテリジャ", price = 3990 },
                new { name_ja = "信力のハイマテリジャ", price = 50000 },

                new { name_ja = "達識のマテリア", price = 1000 },
                new { name_ja = "達識のマテリラ", price = 1000 },
                new { name_ja = "達識のマテリダ", price = 1300 },
                new { name_ja = "達識のマテリガ", price = 3792 },
                new { name_ja = "達識のマテリジャ", price = 98500 },
                new { name_ja = "達識のハイマテリジャ", price = int.MaxValue },

                new { name_ja = "博識のマテリア", price = 1980 },
                new { name_ja = "博識のマテリラ", price = 1796 },
                new { name_ja = "博識のマテリダ", price = 794 },
                new { name_ja = "博識のマテリガ", price = 4600 },
                new { name_ja = "博識のマテリジャ", price = 60000 },
                new { name_ja = "博識のハイマテリジャ", price = int.MaxValue },

                new { name_ja = "器識のマテリア", price = 1990 },
                new { name_ja = "器識のマテリラ", price = 620 },
                new { name_ja = "器識のマテリダ", price = 580 },
                new { name_ja = "器識のマテリガ", price = 4792 },
                new { name_ja = "器識のマテリジャ", price = 40000 },
                new { name_ja = "器識のハイマテリジャ", price = int.MaxValue },

                new { name_ja = "名匠のマテリア", price = 1000 },
                new { name_ja = "名匠のマテリラ", price = 10000 },
                new { name_ja = "名匠のマテリダ", price = 3594 },
                new { name_ja = "名匠のマテリガ", price = 4400 },
                new { name_ja = "名匠のマテリジャ", price = 200000 },
                new { name_ja = "名匠のハイマテリジャ", price = int.MaxValue },

                new { name_ja = "魔匠のマテリア", price = 300 },
                new { name_ja = "魔匠のマテリラ", price = 3801 },
                new { name_ja = "魔匠のマテリダ", price = 1000 },
                new { name_ja = "魔匠のマテリガ", price = 8400 },
                new { name_ja = "魔匠のマテリジャ", price = 37990 },
                new { name_ja = "魔匠のハイマテリジャ", price = int.MaxValue },

                new { name_ja = "巨匠のマテリア", price = 798 },
                new { name_ja = "巨匠のマテリラ", price = 2999 },
                new { name_ja = "巨匠のマテリダ", price = 2400 },
                new { name_ja = "巨匠のマテリガ", price = 9200 },
                new { name_ja = "巨匠のマテリジャ", price = 170000 },
                new { name_ja = "巨匠のハイマテリジャ", price = int.MaxValue },

                new { name_ja = "戦技のマテリア", price = 600 },
                new { name_ja = "戦技のマテリラ", price = 1200 },
                new { name_ja = "戦技のマテリダ", price = 594 },
                new { name_ja = "戦技のマテリガ", price = 1000 },
                new { name_ja = "戦技のマテリジャ", price = 80000 },
                new { name_ja = "戦技のハイマテリジャ", price = int.MaxValue },

                new { name_ja = "詠唱のマテリア", price = 1000 },
                new { name_ja = "詠唱のマテリラ", price = 2500 },
                new { name_ja = "詠唱のマテリダ", price = 700 },
                new { name_ja = "詠唱のマテリガ", price = 1000 },
                new { name_ja = "詠唱のマテリジャ", price = 59500 },
                new { name_ja = "詠唱のハイマテリジャ", price = int.MaxValue },
            };
            var official_site_item_ids_source = new[]
            {
                new { db_id = "ad5b04c453d", name_ja = "剛力のマテリア" },
                new { db_id = "babec0dab28", name_ja = "剛力のマテリラ" },
                new { db_id = "472e1fa3810", name_ja = "剛力のマテリダ" },
                new { db_id = "8bae2eca67b", name_ja = "剛力のマテリガ" },
                new { db_id = "13b227da8e4", name_ja = "剛力のマテリジャ" },
                new { db_id = "f88a76149d3", name_ja = "剛力のハイマテリジャ" },
                new { db_id = "ed7e24a80d3", name_ja = "活力のマテリア" },
                new { db_id = "ed040121e18", name_ja = "活力のマテリラ" },
                new { db_id = "05af5a9c796", name_ja = "活力のマテリダ" },
                new { db_id = "95bb1a54add", name_ja = "活力のマテリガ" },
                new { db_id = "f7af438994f", name_ja = "活力のマテリジャ" },
                new { db_id = "5569c5102fb", name_ja = "活力のハイマテリジャ" },
                new { db_id = "042a22d9618", name_ja = "眼力のマテリア" },
                new { db_id = "8ebde7e82e1", name_ja = "眼力のマテリラ" },
                new { db_id = "1f59353aa23", name_ja = "眼力のマテリダ" },
                new { db_id = "2018335c922", name_ja = "眼力のマテリガ" },
                new { db_id = "686d37e0b36", name_ja = "眼力のマテリジャ" },
                new { db_id = "49aeca074e0", name_ja = "眼力のハイマテリジャ" },
                new { db_id = "a28c86b8282", name_ja = "知力のマテリア" },
                new { db_id = "aeacda55d30", name_ja = "知力のマテリラ" },
                new { db_id = "7b58f16a85a", name_ja = "知力のマテリダ" },
                new { db_id = "78439c2ddf2", name_ja = "知力のマテリガ" },
                new { db_id = "cd4e6549970", name_ja = "知力のマテリジャ" },
                new { db_id = "1501915957a", name_ja = "知力のハイマテリジャ" },
                new { db_id = "a78818eff3e", name_ja = "心力のマテリア" },
                new { db_id = "b2990d15ee7", name_ja = "心力のマテリラ" },
                new { db_id = "c625696a819", name_ja = "心力のマテリダ" },
                new { db_id = "36e0d58cdce", name_ja = "心力のマテリガ" },
                new { db_id = "8cd24c349f4", name_ja = "心力のマテリジャ" },
                new { db_id = "a8e109be44b", name_ja = "心力のハイマテリジャ" },
                new { db_id = "35bc643419b", name_ja = "防火のマテリア" },
                new { db_id = "4a20d57fc51", name_ja = "防火のマテリラ" },
                new { db_id = "0fb85b52946", name_ja = "防火のマテリダ" },
                new { db_id = "dd4b0b23d09", name_ja = "防火のマテリガ" },
                new { db_id = "be80f45099c", name_ja = "防火のマテリジャ" },
                new { db_id = "2f627dda006", name_ja = "防火のハイマテリジャ" },
                new { db_id = "d7b1e75edb3", name_ja = "防氷のマテリア" },
                new { db_id = "84895651aea", name_ja = "防氷のマテリラ" },
                new { db_id = "cdd8715c5b1", name_ja = "防氷のマテリダ" },
                new { db_id = "618f27cb51a", name_ja = "防氷のマテリガ" },
                new { db_id = "acc8d4d66b1", name_ja = "防氷のマテリジャ" },
                new { db_id = "8f34cd41ab2", name_ja = "防氷のハイマテリジャ" },
                new { db_id = "1f2f2887540", name_ja = "防風のマテリア" },
                new { db_id = "e46673a0d86", name_ja = "防風のマテリラ" },
                new { db_id = "0873a3c196e", name_ja = "防風のマテリダ" },
                new { db_id = "694533c7ca3", name_ja = "防風のマテリガ" },
                new { db_id = "e165af2717d", name_ja = "防風のマテリジャ" },
                new { db_id = "a3c3a710736", name_ja = "防風のハイマテリジャ" },
                new { db_id = "3d035d27ad4", name_ja = "防土のマテリア" },
                new { db_id = "349d2580712", name_ja = "防土のマテリラ" },
                new { db_id = "59fc3104551", name_ja = "防土のマテリダ" },
                new { db_id = "0e3a207d75b", name_ja = "防土のマテリガ" },
                new { db_id = "bac56c86f52", name_ja = "防土のマテリジャ" },
                new { db_id = "64e2a67bb0c", name_ja = "防土のハイマテリジャ" },
                new { db_id = "8becf336e7a", name_ja = "防雷のマテリア" },
                new { db_id = "cbf78b30f91", name_ja = "防雷のマテリラ" },
                new { db_id = "a0440ded3ab", name_ja = "防雷のマテリダ" },
                new { db_id = "c323ad40213", name_ja = "防雷のマテリガ" },
                new { db_id = "0444a0d6f35", name_ja = "防雷のマテリジャ" },
                new { db_id = "908b8b8390f", name_ja = "防雷のハイマテリジャ" },
                new { db_id = "ffa84141658", name_ja = "防水のマテリア" },
                new { db_id = "b2f6260d19c", name_ja = "防水のマテリラ" },
                new { db_id = "6a83c32b69d", name_ja = "防水のマテリダ" },
                new { db_id = "81aa4808ed2", name_ja = "防水のマテリガ" },
                new { db_id = "eff83ab94a4", name_ja = "防水のマテリジャ" },
                new { db_id = "1776143d302", name_ja = "防水のハイマテリジャ" },
                new { db_id = "5d1b6abe064", name_ja = "天眼のマテリア" },
                new { db_id = "e19cc5717ed", name_ja = "天眼のマテリラ" },
                new { db_id = "20c2c8929f0", name_ja = "天眼のマテリダ" },
                new { db_id = "93fe1786b70", name_ja = "天眼のマテリガ" },
                new { db_id = "6911895ae52", name_ja = "天眼のマテリジャ" },
                new { db_id = "b641d5c698d", name_ja = "天眼のハイマテリジャ" },
                new { db_id = "12b7556e76d", name_ja = "武略のマテリア" },
                new { db_id = "b9b219ced71", name_ja = "武略のマテリラ" },
                new { db_id = "82c6eb433f2", name_ja = "武略のマテリダ" },
                new { db_id = "dce3a5f3467", name_ja = "武略のマテリガ" },
                new { db_id = "97e7ab90473", name_ja = "武略のマテリジャ" },
                new { db_id = "018ad2b9fef", name_ja = "武略のハイマテリジャ" },
                new { db_id = "3e90f2d80a3", name_ja = "雄略のマテリア" },
                new { db_id = "56a1148b3a5", name_ja = "雄略のマテリラ" },
                new { db_id = "6d65a73f718", name_ja = "雄略のマテリダ" },
                new { db_id = "1bc25f58180", name_ja = "雄略のマテリガ" },
                new { db_id = "cceb50d392c", name_ja = "雄略のマテリジャ" },
                new { db_id = "5fe3fcf7d80", name_ja = "雄略のハイマテリジャ" },
                new { db_id = "2d83c5705c0", name_ja = "剛柔のマテリア" },
                new { db_id = "b42cbba3411", name_ja = "剛柔のマテリラ" },
                new { db_id = "82b80f823c3", name_ja = "剛柔のマテリダ" },
                new { db_id = "37f25043bf3", name_ja = "剛柔のマテリガ" },
                new { db_id = "a09b07df8eb", name_ja = "剛柔のマテリジャ" },
                new { db_id = "5896bf4e85f", name_ja = "剛柔のハイマテリジャ" },
                new { db_id = "5e724db1269", name_ja = "信力のマテリア" },
                new { db_id = "c774ffce892", name_ja = "信力のマテリラ" },
                new { db_id = "8810a774ee4", name_ja = "信力のマテリダ" },
                new { db_id = "905d47601dd", name_ja = "信力のマテリガ" },
                new { db_id = "9ef5708917c", name_ja = "信力のマテリジャ" },
                new { db_id = "d11f98863fd", name_ja = "信力のハイマテリジャ" },
                new { db_id = "35d90916853", name_ja = "達識のマテリア" },
                new { db_id = "a29d97c9218", name_ja = "達識のマテリラ" },
                new { db_id = "3a8dd03a36d", name_ja = "達識のマテリダ" },
                new { db_id = "8b1d678f751", name_ja = "達識のマテリガ" },
                new { db_id = "b3fa9f1136c", name_ja = "達識のマテリジャ" },
                new { db_id = "58b8073b1c5", name_ja = "達識のハイマテリジャ" },
                new { db_id = "33caea31e44", name_ja = "博識のマテリア" },
                new { db_id = "4e91cc3d138", name_ja = "博識のマテリラ" },
                new { db_id = "69ffe3b47bf", name_ja = "博識のマテリダ" },
                new { db_id = "23a75b80dac", name_ja = "博識のマテリガ" },
                new { db_id = "495ec449b8e", name_ja = "博識のマテリジャ" },
                new { db_id = "79104b54e2b", name_ja = "博識のハイマテリジャ" },
                new { db_id = "b0e39513b87", name_ja = "器識のマテリア" },
                new { db_id = "f0f1ecfed2c", name_ja = "器識のマテリラ" },
                new { db_id = "a3ca25c80f6", name_ja = "器識のマテリダ" },
                new { db_id = "143c7ec25ce", name_ja = "器識のマテリガ" },
                new { db_id = "aaf024009df", name_ja = "器識のマテリジャ" },
                new { db_id = "3e7ec58f07a", name_ja = "器識のハイマテリジャ" },
                new { db_id = "d79c5fd38b4", name_ja = "名匠のマテリア" },
                new { db_id = "0a131f67d38", name_ja = "名匠のマテリラ" },
                new { db_id = "f85876b56ef", name_ja = "名匠のマテリダ" },
                new { db_id = "1ec7fa0ef9d", name_ja = "名匠のマテリガ" },
                new { db_id = "341799aa68e", name_ja = "名匠のマテリジャ" },
                new { db_id = "782c2924c59", name_ja = "名匠のハイマテリジャ" },
                new { db_id = "1c1eb439594", name_ja = "魔匠のマテリア" },
                new { db_id = "246f7107aa3", name_ja = "魔匠のマテリラ" },
                new { db_id = "ea33c6df35a", name_ja = "魔匠のマテリダ" },
                new { db_id = "caa6eaeeb0e", name_ja = "魔匠のマテリガ" },
                new { db_id = "1c7d17024e6", name_ja = "魔匠のマテリジャ" },
                new { db_id = "c9c82ae1948", name_ja = "魔匠のハイマテリジャ" },
                new { db_id = "87a53e74f36", name_ja = "巨匠のマテリア" },
                new { db_id = "5b108f25b80", name_ja = "巨匠のマテリラ" },
                new { db_id = "0108271036d", name_ja = "巨匠のマテリダ" },
                new { db_id = "d41572dcfd9", name_ja = "巨匠のマテリガ" },
                new { db_id = "5275c679fe1", name_ja = "巨匠のマテリジャ" },
                new { db_id = "c61ed952535", name_ja = "巨匠のハイマテリジャ" },
                new { db_id = "f263398f3a3", name_ja = "戦技のマテリア" },
                new { db_id = "cce7492f1f2", name_ja = "戦技のマテリラ" },
                new { db_id = "6a09a5de628", name_ja = "戦技のマテリダ" },
                new { db_id = "1162b3fcc58", name_ja = "戦技のマテリガ" },
                new { db_id = "5d07b094415", name_ja = "戦技のマテリジャ" },
                new { db_id = "3395012ceae", name_ja = "戦技のハイマテリジャ" },
                new { db_id = "187397de322", name_ja = "詠唱のマテリア" },
                new { db_id = "560f2c1edf8", name_ja = "詠唱のマテリラ" },
                new { db_id = "2d1f76cc7bc", name_ja = "詠唱のマテリダ" },
                new { db_id = "5bbb25ff7dd", name_ja = "詠唱のマテリガ" },
                new { db_id = "b138df92e02", name_ja = "詠唱のマテリジャ" },
                new { db_id = "ab2a609e8b3", name_ja = "詠唱のハイマテリジャ" },
            };
            var gil_names = new[]
            {
                new { lang = "de", name = "Gil" },
                new { lang = "en", name = "gil" },
                new { lang = "fr", name = "gils" },
                new { lang = "ja", name = "Gil" },
            }
            .ToDictionary(item => item.lang, item => item.name);

            var storage_ids_source = new[]
            {
                new { id= "maximumgradeid", type = "plane", fire_event = true },
                new { id= "materiaslotcount", type = "plane", fire_event = true },
                new { id= "usedmateriacount", type = "plane", fire_event = true },
                new { id= "statustype1", type = "plane", fire_event = true },
                new { id= "statustype2", type = "plane", fire_event = true },
                new { id= "statustype3", type = "plane", fire_event = true },
                new { id= "statustype4", type = "plane", fire_event = true },
                new { id= "statustype5", type = "plane", fire_event = true },
                new { id= "statusvalue1", type = "plane", fire_event = true },
                new { id= "statusvalue2", type = "plane", fire_event = true },
                new { id= "statusvalue3", type = "plane", fire_event = true },
                new { id= "statusvalue4", type = "plane", fire_event = true },
                new { id= "statusvalue5", type = "plane", fire_event = true },
                new { id= "pagelayout", type = "plane", fire_event = false },
                new { id= "quality", type = "radio", fire_event = true },
                new { id= "kindanallowed", type = "radio", fire_event = true },
            };

            var items = status_source
                        .Where(s => s.name_ja != null)
                        .SelectMany(s => grades_source
                                         .Where(g => g.name_ja != null)
                                         .Select(g => new { s, g })
                                         .Select(item =>
                                         {
                                             var ja = string.Format(item.s.materia_name_ja, item.g.name_ja);
                                             var en = string.Format(item.s.materia_name_en, item.g.name_en);
                                             var de = string.Format(item.s.materia_name_de, item.g.name_de);
                                             var fr = string.Format(item.s.materia_name_fr, item.g.name_fr);
                                             var id = new GlobalID(en);
                                             return (new
                                             {
                                                 id,
                                                 name = new MultiLanguageString(ja: ja, en: en, de: de, fr: fr),
                                             });
                                         }))
                        .Select((item, index) => new Item((ItemID)(index + 1), item.name, item.id, official_site_item_ids_source.Where(x => x.name_ja == item.name["ja"]).Single().db_id))
                        .ToDictionary(item => item.ItemID, item => item);

            var items_indexed_by_name = items.Values
                                        .SelectMany(item => new[]
                                                            {
                                                                item.Name["en"],
                                                                item.Name["de"],
                                                                item.Name["fr"],
                                                                item.Name["ja"],
                                                            }
                                                            .Distinct()
                                                            .Select(name => new { key = name, value = item }))
                                        .ToDictionary(item => item.key, item => item.value);
            var items_indexed_by_global_id = items.Values
                                                .ToDictionary(item => item.GlobalItemID, item => item);
            var grades = grades_source
                         .Select((gs, index) =>
                         {
                             return (new Grade((GradeID)(index + 1),
                                               new MultiLanguageString(ja: gs.name_ja, en: gs.name_en, de: gs.name_de, fr: gs.name_fr),
                                               gs.success_rates_nq.Select(n => n / 100.0).ToArray(),
                                               gs.success_rates_hq.Select(n => n / 100.0).ToArray()));
                         })
                         .ToDictionary(item => item.GradeID, item => item);
            var grades_indexed_by_name = grades.Values
                                         .SelectMany(item => new[]
                                                             {
                                                                 item.Name["en"],
                                                                 item.Name["de"],
                                                                 item.Name["fr"],
                                                                 item.Name["ja"],
                                                             }
                                                             .Distinct()
                                                             .Select(name => new { key = name, value = item }))
                                         .ToDictionary(item => item.key, item => item.value);

            IDictionary<MateriaID, Materia> materias = null;
            var status = status_source
                         .Select((s, index) => new Status((StatusID)(index + 1),
                                                          new MultiLanguageString(ja: s.name_ja, en: s.name_en, de: s.name_de, fr: s.name_fr),
                                                          s.kindan_enabled,
                                                          status_id => materias.Values
                                                                       .Where(m => m.StatusID == status_id)
                                                                       .GroupBy(m => m.GradeID)
                                                                       .Select(g => new { grade_id = g.Key, materia_ids = g.Select(x => x.MateriaID).Single() })
                                                                       .ToDictionary(x => x.grade_id, x => x.materia_ids) as IDictionary<GradeID, MateriaID>))
                         .Where(item => item != null)
                         .ToDictionary(item => item.StatusID, item => item);
            var status_indexed_by_name = status.Values
                                         .SelectMany(item => new[]
                                                             {
                                                                 item.Name["en"],
                                                                 item.Name["de"],
                                                                 item.Name["fr"],
                                                                 item.Name["ja"],
                                                             }
                                                             .Distinct()
                                                             .Select(name => new { key = name, value = item }))
                                         .ToDictionary(item => item.key, item => item.value);

            materias = status_source
                       .Where(s => s.name_ja != null)
                       .SelectMany(s => grades_source
                                       .Where(g => g.name_ja != null)
                                       .Select(g => new { s, g })
                                       .Select(item =>
                                       {
                                           var item_name = string.Format(item.s.materia_name_ja, item.g.name_ja);
                                           var item_id = items_indexed_by_name[item_name].ItemID;
                                           var status_id = status_indexed_by_name[item.s.name_ja].StatusID;
                                           var grade_id = grades_indexed_by_name[item.g.name_ja].GradeID;
                                           var value = materias_source.Where(x => x.name_ja == item_name).Single().value;
                                           return (new
                                           {
                                               item_id,
                                               status_id,
                                               grade_id,
                                               value,
                                           });
                                       }))
                       .Select((item, index) => new Materia((MateriaID)(index + 1), item.item_id, item.status_id, item.grade_id, item.value))
                       .ToDictionary(item => item.MateriaID, item => item);

            var storage_items = storage_ids_source
                                .Select(item => new
                                {
                                    item.id,
                                    item.type,
                                    item.fire_event,
                                })
                                .ToDictionary(item => item.id,
                                              item =>
                                              {
                                                  var dic = new Dictionary<string, object>();
                                                  dic["type"] = item.type;
                                                  dic["fire_event"] = item.fire_event;
                                                  return ((object)dic);
                                              });
            /*
            var storage_ids_indexed_by_id = storage_ids
                                            .ToDictionary(item => item.id, item =>
                                            {
                                                var dic = new Dictionary<string, object>();
                                                dic["global_id"] = item.global_id.SerializeToObject();
                                                dic["type"] = item.type;
                                                dic["fire_event"] = item.fire_event;
                                                return ((object)dic);
                                            });
            var storage_ids_indexed_by_global_id = storage_ids
                                                   .ToDictionary(item => item.global_id, item =>
                                                   {
                                                       var dic = new Dictionary<string, object>();
                                                       dic["element_id"] = item.id;
                                                       dic["type"] = item.type;
                                                       dic["fire_event"] = item.fire_event;
                                                       return ((object)dic);
                                                   });
            */
            var default_item_prices = default_item_prices_source
                                      .Select(item => new { global_id = new GlobalID(items_indexed_by_name[item.name_ja].Name["en"]), item.price })
                                      .ToDictionary(item => item.global_id,
                                                    item =>
                                                    {
                                                        if (item.price == int.MaxValue)
                                                            return ("*");
                                                        else if (item.price <= 0)
                                                            return ("");
                                                        else
                                                            return (item.price.ToString());
                                                    });
            WriteToJSONFile(items,
                            grades,
                            status,
                            materias,
                            storage_items,
                            new MultiLanguageString(en: gil_names["en"], de: gil_names["de"], fr: gil_names["fr"], ja: gil_names["ja"]),
                            default_item_prices);
            WriteToJSONGzipFile(items,
                                grades,
                                status,
                                materias,
                                storage_items,
                                new MultiLanguageString(en: gil_names["en"], de: gil_names["de"], fr: gil_names["fr"], ja: gil_names["ja"]),
                                default_item_prices);
        }

        private static IDictionary<StatusID, IDictionary<int, IEnumerable<MateriaCombinationListElement>>> CreateCombinationTable(IDictionary<GradeID, Grade> grades, IDictionary<StatusID, Status> status, IDictionary<MateriaID, Materia> materias)
        {
            // 各ステータスの、ある合計値を満たすマテリアの組み合わせ
            var materia_counts = materias.Values
                    .GroupBy(m => m.StatusID)
                    .Select(g => new { status_id = g.Key, materias = g.ToDictionary(m => m.GradeID, m => m) })
                    .Select(item =>
                    {
                        // StatusIDがすべて同一であることの確認
                        var test1 = item.materias.Values.Select(m => m.StatusID).Distinct().Single();
                        // GradeIDがすべて異なることの確認
                        var test2 = item.materias.Values.Select(m => m.GradeID).ToDictionary(x => x, x => x);

                        var collection = new List<MateriaCount[]>();
                        collection.Add(new MateriaCount[0]);
                        foreach (var materia in item.materias.Values)
                        {
                            var new_collection = new List<MateriaCount[]>();
                            foreach (var collection_item in collection)
                            {
                                var total_count = collection_item.Sum(x => x.Count);
                                var max_count = 5 - total_count;
                                for (int count = 0; count <= max_count; ++count)
                                {
                                    new_collection.Add(count > 0 ? collection_item.Concat(new[] { new MateriaCount(materia.MateriaID, count) }).ToArray() : collection_item);
                                }

                            }
                            collection = new_collection;
                        }
                        return (new
                        {
                            status_id = item.status_id,
                            items = collection
                                    .Where(col => col.Length > 0)
                                    .Select(col => new MateriaCombinationListElement(col, id => materias[id], id => status[id]))
                                    //.Where(x => x.TotalValue > 0)
                                    .GroupBy(x => x.TotalValue)
                                    .ToDictionary(g => g.Key,
                                                  g => g
                                                       .ExpectToExist()
                                                       .OrderBy(x => x.MaximumGradeID)
                                                       .ThenBy(x => x.MateriaIDs.Count())
                                                       .ToArray()),
                        });
                    })
                    .ToDictionary(x => x.status_id, x => x.items.ExpectToExist());
            return (materia_counts
                   .Select(mc =>
                   {
                       var result = mc.Value
                                   .SelectMany(item =>
                                   {
                                       var collection = mc.Value
                                                        .Where(mci => mci.Key >= item.Key)
                                                        .SelectMany(mci => mci.Value);
                                       return (collection
                                               .Where(col1 => collection.All(col2 => !col1.IsBaseOf(col2)))
                                               .Select(col => new { total_value = item.Key, collection = col })
                                               .ToArray());
                                   })
                                   .GroupBy(item => item.total_value)
                                   .ExpectToExist()
                                   .ToDictionary(item => item.Key, item => item.Select(x => x.collection));
                       var max_value = result.Max(x => x.Key);
                       for (int v = max_value; v >= 2; --v)
                       {
                           if (result.ContainsKey(v) && !result.ContainsKey(v - 1))
                               result[v - 1] = result[v];
                       }
                       return (new
                       {
                           status_id = mc.Key,
                           items = (IDictionary<int, IEnumerable<MateriaCombinationListElement>>)result,
                       });
                   })
                   .ToDictionary(item => item.status_id, item => item.items));
        }

        private static object SerializeToObject(IDictionary<GradeID, Grade> o)
        {
            var max = o.Keys.Max();
            var array_size = max - GradeID.None + 1;
            var array = new object[array_size];
            foreach (var item in o)
                array[item.Key - GradeID.None] = item.Value.SerializeToObject();
            return (array);
        }

        private static object SerializeToObject(IDictionary<StatusID, Status> o)
        {
            var max = o.Keys.Max();
            var array_size = max - StatusID.None + 1;
            var array = new object[array_size];
            foreach (var item in o)
                array[item.Key - StatusID.None] = item.Value.SerializeToObject();
            return (array);
        }

        private static object SerializeToObject(IDictionary<MateriaID, Materia> o)
        {
            var max = o.Keys.Max();
            var array_size = max - MateriaID.None + 1;
            var array = new object[array_size];
            foreach (var item in o)
                array[item.Key - MateriaID.None] = item.Value.SerializeToObject();
            return (array);
        }

        private static object SerializeToObject(IDictionary<ItemID, Item> o)
        {
            var max = o.Keys.Max();
            var array_size = max - ItemID.None + 1;
            var array = new object[array_size];
            foreach (var item in o)
                array[item.Key - ItemID.None] = item.Value.SerializeToObject();
            return (array);
        }

        private static object SerializeToObject(IDictionary<StatusID, IDictionary<int, IEnumerable<MateriaCombinationListElement>>> o)
        {
            var max_status = o.Keys.Max();
            var status_array_size = max_status - StatusID.None + 1;
            var status_array = new object[status_array_size];
            foreach (var item in o)
            {
                var max_value = item.Value.Keys.Max();
                var value_array_size = max_value + 1;
                var value_array = new object[value_array_size];
                foreach (var item2 in item.Value)
                    value_array[item2.Key] = item2.Value
                                             .OrderBy(item3 => item3.MaximumGradeID)
                                             .ThenBy(item3 => item3.MateriaIDs.Count())
                                             .ThenBy(item3 => item3.TotalValue)
                                             .Select(item3 => item3.SerializeToObject())
                                             .ToArray();
                status_array[item.Key - StatusID.None] = value_array;
            }
            return (status_array);
        }

        /*
        private static object RenderStatusSelectionItems(IDictionary<StatusID, Status> status)
        {
            var dic = new[] { "en", "de", "fr", "ja" }
                      .Select(lang => new
                      {
                          lang,
                          text = string.Concat(new[] { "<option value=\"0\" selected=\"selected\"></option>" }
                                 .Concat(status.Values
                                 .Where(s => s != null)
                                 .OrderBy(s => s.StatusID)
                                 .Select(s => string.Format("<option value=\"{0}\">{1}</option>", (int)s.StatusID, s.Name[lang])))),
                      })
                      .ToDictionary(item => item.lang, item => item.text);
            return (new MultiLanguageString(en: dic["en"], de: dic["de"], fr: dic["fr"], ja: dic["ja"]).SerializeToObject());
        }
        */

        /*
        private static object RenderValueSelectionItems(IDictionary<MateriaID, Materia> materia_collection)
        {
            var selection_items = materia_collection.Values
                                  .GroupBy(materia => materia.StatusID)
                                  .Select(g => new { status_id = g.Key, materias = g.ToArray() })
                                  .Select(item =>
                                  {
                                      var materia = item.materias
                                                    .OrderByDescending(m => m.Value)
                                                    .First();
                                      var text = string.Concat(Enumerable.Range(1, materia.Value * 5)
                                                               .Select(value => string.Format("<option value=\"{0}\"{1}>+{0}</option>", value, value == 1 ? " selected=\"selected\"" : "")));
                                      return (new { item.status_id, text });
                                  })
                                  .ToDictionary(item => item.status_id, item => item.text);
            var max = selection_items.Keys.Max();
            var array_size = max - StatusID.None + 1;
            var array = new string[array_size];
            foreach (var item in selection_items)
                array[item.Key - StatusID.None] = item.Value;
            return (array);
        }
        */

        /*
        private static object RenderGlobalItemIDIndices(IDictionary<ItemID, Item> items)
        {
            return (items.Values
                    .Select(item => new { key = item.GlobalItemID.ToString(), value = (object)(int)item.ItemID })
                    .ToDictionary(item => item.key, item => item.value));
        }
        */

        /*
        private static object RenderInitialItemPriceList(IDictionary<ItemID, Item> items)
        {
            return (Enumerable.Repeat(-1, items.Keys.Max() - ItemID.None + 1).ToArray());
        }
        */

        /*
        private static string RenderPriceItemListBuilder(string lang, IDictionary<ItemID, Item> items, IDictionary<string, string> gil_names)
        {
            return ("private static function BildPriceItemList_" +
                    lang +
                    "(price_list:Array):String { " +
                    "return (" +
                    string.Join(" + ",
                                items.Values
                                .Where(item => item != null)
                                .OrderBy(item => item.ItemID)
                                .SelectMany(item => new[]
                                {
                                    "\"<tr id=\\\"itempricerow" +
                                    ((int)item.ItemID).ToString() +
                                    "\\\" style=\\\"display:none;\\\"><td class=\\\"priceheaderstyle\\\" style=\\\"\\\">" +
                                    item.Name[lang] +
                                    ":</td><td><input type=\\\"text\\\" class=\\\"priceboxstyle\\\" name=\\\"itemprice" +
                                    ((int)item.ItemID).ToString() +
                                    "\\\" id=\\\"itemprice" +
                                    ((int)item.ItemID).ToString() +
                                    "\\\" value=\\\"\"",
                                    "_format_price(price_list[" +
                                    ((int)item.ItemID).ToString() +
                                    "])",
                                    "\"\\\" />" +
                                    gil_names[lang] +
                                    "</td><td><span id=\\\"itempriceerrormessage" +
                                    ((int)item.ItemID).ToString() +
                                    "\\\" data-text=\\\"\\\" class=\\\"errormessageiconstyle\\\" style=\\\"display:none;\\\">！</span></rd></tr>\""
                                })) +
                    "); }");
        }
        */

        private static object GetPermutationTable()
        {
            return (new[]
            {
                Enumerable.Range(0, 0).Permutation(),
                Enumerable.Range(0, 1).Permutation(),
                Enumerable.Range(0, 2).Permutation(),
                Enumerable.Range(0, 3).Permutation(),
                Enumerable.Range(0, 4).Permutation(),
                Enumerable.Range(0, 5).Permutation(),
            });
        }

        private static object[][] GetMaxStatusValueTable(IDictionary<MateriaID, Materia> materias)
        {
            var q = materias.Values.Where(materia => materia != null)
                .GroupBy(materia => materia.StatusID)
                .Select(g =>
                {
                    var status_id = (int)g.Key;
                    var max_values = g
                                     .GroupBy(m2 => m2.GradeID)
                                     .Select(g2 => new { grade_id = (int)g2.Key, max_value = g2.Max(m2 => m2.Value) * 5 })
                                     .ToArray();
                    var max_grade_id = max_values.Max(m2 => m2.grade_id);
                    var grade_array = new object[max_grade_id + 1];
                    foreach (var max_value_item in max_values)
                        grade_array[max_value_item.grade_id] = max_value_item.max_value;
                    return (new { status_id, max_values = grade_array });
                })
                .ToArray();
            var max_status_id = q.Max(item => item.status_id);
            var status_array = new object[max_status_id + 1][];
            foreach (var status_item in q)
                status_array[status_item.status_id] = status_item.max_values;
            return status_array;
        }

        private static object RenderConversionTableFromGlobalIDToElementID(IDictionary<GlobalID, object> storage_ids_indexed_by_global_id)
        {
            var dic = new Dictionary<string, object>();
            foreach (var item in storage_ids_indexed_by_global_id)
                dic[item.Key.ToString()] = item.Value;
            return (dic);
        }

        private static object RenderConversionTableFromElementIDToGlobalID(IDictionary<string, object> storage_ids_indexed_by_global_id)
        {
            var dic = new Dictionary<string, object>();
            foreach (var item in storage_ids_indexed_by_global_id)
                dic[item.Key] = item.Value;
            return (dic);
        }

        private static void WriteToJSONFile(IDictionary<ItemID, Item> items, IDictionary<GradeID, Grade> grades, IDictionary<StatusID, Status> status, IDictionary<MateriaID, Materia> materias, IDictionary<string, object> storage_items, MultiLanguageString gil_name, IDictionary<GlobalID, string> default_item_prices)
        {
            var output_file = new FileInfo(Path.Combine(new DirectoryInfo(Path.GetDirectoryName(typeof(Program).Assembly.Location)).Parent.Parent.Parent.FullName, "WebMateriaCalculator", "Contents", "master_data.json"));
            using (var file_stream = output_file.Create())
            using (var writer = new StreamWriter(file_stream, new UTF8Encoding(false)))
            {
                RenderToJSONFile(writer, items, grades, status, materias, storage_items, gil_name, default_item_prices);
                writer.Flush();
            }
        }

        private static void WriteToJSONGzipFile(IDictionary<ItemID, Item> items, IDictionary<GradeID, Grade> grades, IDictionary<StatusID, Status> status, IDictionary<MateriaID, Materia> materias, IDictionary<string, object> storage_items, MultiLanguageString gil_name, IDictionary<GlobalID, string> default_item_prices)
        {
            var output_file = new FileInfo(Path.Combine(new DirectoryInfo(Path.GetDirectoryName(typeof(Program).Assembly.Location)).Parent.Parent.Parent.FullName, "WebMateriaCalculator", "Contents", "master_data.json.z"));
            using (var file_stream = output_file.Create())
            using (var gzip_stream = new DeflateStream(file_stream, CompressionMode.Compress))
            using (var writer = new StreamWriter(gzip_stream, new UTF8Encoding(false)))
            {
                RenderToJSONFile(writer, items, grades, status, materias, storage_items, gil_name, default_item_prices);
                writer.Flush();
            }
        }

        private static void RenderToJSONFile(StreamWriter writer, IDictionary<ItemID, Item> items, IDictionary<GradeID, Grade> grades, IDictionary<StatusID, Status> status, IDictionary<MateriaID, Materia> materias, IDictionary<string, object> storage_items, MultiLanguageString gil_name, IDictionary<GlobalID, string> default_item_prices)
        {
            var dic = new Dictionary<string, object>();
            dic["items"] = SerializeToObject(items);
            dic["grades"] = SerializeToObject(grades);
            dic["status"] = SerializeToObject(status);
            dic["materias"] = SerializeToObject(materias);
            dic["materia_counts"] = SerializeToObject(CreateCombinationTable(grades, status, materias));
            dic["permutation_table"] = GetPermutationTable();
            dic["storage_items"] = storage_items;
            dic["gil_names"] = gil_name.SerializeToObject();
            dic["max_status_values"] = GetMaxStatusValueTable(materias);
            dic["initial_item_prices"] = SimpleJson.Serialize(default_item_prices.ToDictionary(item => item.Key.ToString(), item => (object)"*"));
            dic["exsample_item_prices"] = SimpleJson.Serialize(default_item_prices.ToDictionary(item => item.Key.ToString(), item => (object)item.Value));
            //writer.WriteLine(SimpleJson.Serialize(dic, new SerializationFormatParameter { DelimiterArrayComma = "\n", DelimiterArrayLeft = "\n", DelimiterArrayRight = "\n", DelimiterObjecColon = "\n", DelimiterObjecComma = "\n", DelimiterObjectLeft = "\n", DelimiterObjectRight = "\n" }));
            writer.WriteLine(SimpleJson.Serialize(dic));
            var x = SimpleJson.Serialize(dic);
            var y = SimpleJson.Deserialize(x);
            var z = SimpleJson.Serialize(y);
            if (x != z)
                throw new ApplicationException();
        }

    }
}