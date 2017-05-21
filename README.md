FFXIV Materia Calculator
====

FFXIV用のマテリア装着費用見積もりを計算するWEBアプリです。

## Description
FFXIVにて、指定したステータスを満たす装着費用の期待値がもっとも安価なマテリアの装着順番とその費用期待値を求めます。 
マテリアの相場は事前に入力する必要があります。

## Requirement
- .Net Framework 4.6

## Usage

### コンテンツの使用方法

MasterDataGenerator プロジェクトの Contents フォルダ配下の以下のファイルをWEBサーバにアップロードし、materiacalcja.html を表示します。 
ローカル環境では使用できませんので注意してください。
- materiacalcja.html
- materiacalcscript.min.js
- materiacalc.min.css
- master_data.json.z

### マスターデータの作成方法
プロジェクト MasterDataGenerator をビルドして実行すると、MasterDataGenerator プロジェクトの Contents フォルダ配下に master_data.json.z が生成されます。

## Licence

[MIT](https://github.com/rougemeilland/ffxivmateriacalculator/blob/master/LICENCE.txt)

## Author

[Palmtree Software](https://github.com/rougemeilland/)
