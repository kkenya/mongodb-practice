# mongoパフォーマンス

## index

readとwriteどちらのパフォーマンスを優先するかのトレードイン

read hevy write light
read light write heavy

インデックスを作成したドキュメントへのインサートはインデックスの再構築

MongoDBのインデックスはRAMに読み込まれている必要がある。diskからの読み込みは避ける。

todo

## 計画(plan)の取得

MongoDBは次の3つのクエリ計画の取得方法を提供する

- db.collection.explain()
- cursor.explain()
- explainコマンド

|stage|説明|
|:--|:--|
|COLLSCAN|コレクション全体の走査|
|IXSCAN|選択されたindexを利用した走査|
|FETCH for retrieving documents
GROUP for grouping documents
SHARD_MERGE for merging results from shards
SHARDING_FILTER for filtering out orphan documents from shards

COLLSCAN
collection scan

IXSCAN
query plannerが選択したインデックスの情報が含まれる

クエリの条件と返り値がインデックスのフィールドに含まれる `covered queries` の場合、 `FETCH` ステージの子のノードに含まれない

todo
クエリの実行結果を貼る

queryPlanner

query optimizerによって選択された計画の詳細情報が書かれている。

## fixtureの利用

[Aggregation with the Zip Code Data Set](https://www.mongodb.com/docs/manual/tutorial/aggregation-zip-code-data-set/)で提供されている住所情報を利用する。
mongoimportをインストールしていない場合は[ドキュメント](https://www.mongodb.com/docs/database-tools/installation/installation-macos/)を参照

```shell
# fixtureをダウンロード
$ wget -O zipcodes.json "https://media.mongodb.org/zips.json"
# ファイルからインポート
$ mongoimport \
--db=practice \
--collection=zipcodes \
--file=zipcodes.json
2023-04-29T23:18:02.021+0900    connected to: mongodb://localhost/
2023-04-29T23:18:03.369+0900    29353 document(s) imported successfully. 0 document(s) failed to import.

```

## カーディナリティ

- [Install MongoDB Community Edition on macOS](https://www.mongodb.com/docs/manual/tutorial/install-mongodb-on-os-x/)
  - macOSでのmongodbインストール・起動
- [Explain Results](https://www.mongodb.com/docs/manual/reference/explain-results/)
  - explainの表示内容を説明
- [Aggregation with the Zip Code Data Set](https://www.mongodb.com/docs/manual/tutorial/aggregation-zip-code-data-set/)
  - 住所データのフィクスチャを提供
- [大規模サービスにおけるMongoDBのインデックス運用](https://blog.studysapuri.jp/entry/mongodb-index)
- [データベースを遅くするための８つの方法](https://zenn.dev/koduki/articles/d3e8984f420b370681f9)
  - RDBに関する内容だがMongoDBにも通じる
