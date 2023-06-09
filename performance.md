# mongoパフォーマンス

## クエリ計画(query plan)の取得

MongoDBは次の3つのクエリ計画の取得方法を提供する

- db.collection.explain()
- cursor.explain()
- explainコマンド

## explain

次のcursorを返すコマンド実行時にクエリ計画の情報を提供する。

- aggregate
- count
- distinct
- find
- findAndModify
- delete
- mapReduce
- update

引数に指定するverbosity modeにより表示する情報を変えられる。

- allPlansExecution(デフォルト)
  - queryPlannerとexecutionStatsで考慮されたすべての計画を表示する
- queryPlanner
  - クエリ計画のみを表示する
- executionStats

```shell
practice> db.runCommand(
  {
     explain: {
       find: "zipcodes",
       filter: { _id: { $gte: '1000', $lte: '4000' } }
     }
  }
)
{
  explainVersion: '1',
  queryPlanner: { # query optimizerによって選択されたクエリ計画の詳細
    namespace: 'practice.zipcodes', # <database>.<collection>
    indexFilterSet: false,
    parsedQuery: {
      '$and': [ { _id: { '$lte': '4000' } }, { _id: { '$gte': '1000' } } ]
    },
    queryHash: 'B25BDAF5', # query shapeのハッシュ値
    planCacheKey: 'AAB87497',
    maxIndexedOrSolutionsReached: false,
    maxIndexedAndSolutionsReached: false,
    maxScansToExplodeReached: false,
    winningPlan: { # query optimizerによって選択されたquery plan
      stage: 'FETCH', # ドキュメントの取得
      inputStage: { # 一つの子ステージ(複数の場合inputStages)
        stage: 'IXSCAN', # インデックスの走査
        keyPattern: { _id: 1 },
        indexName: '_id_', # 利用されたインデックス名
        isMultiKey: false,
        multiKeyPaths: { _id: [] },
        isUnique: true,
        isSparse: false,
        isPartial: false,
        indexVersion: 2,
        direction: 'forward',
        indexBounds: { _id: [ '["1000", "4000"]' ] }
      }
    },
    rejectedPlans: []
  },
  executionStats: { # winningPlanの実行結果
    executionSuccess: true,
    nReturned: 9027, # 条件に一致したドキュメント数
    executionTimeMillis: 29, # クエリ計画の選択から実行までのms
    totalKeysExamined: 9027, # 走査されたインデックス数
    totalDocsExamined: 9027, # 操作されたドキュメントの総数
    executionStages: {
      stage: 'FETCH',
      nReturned: 9027,
      executionTimeMillisEstimate: 0,
      works: 9028,
      advanced: 9027,
      needTime: 0,
      needYield: 0,
      saveState: 9,
      restoreState: 9,
      isEOF: 1,
      docsExamined: 9027,
      alreadyHasObj: 0,
      inputStage: {
        stage: 'IXSCAN',
        nReturned: 9027,
        executionTimeMillisEstimate: 0,
        works: 9028,
        advanced: 9027,
        needTime: 0,
        needYield: 0,
        saveState: 9,
        restoreState: 9,
        isEOF: 1,
        keyPattern: { _id: 1 },
        indexName: '_id_',
        isMultiKey: false,
        multiKeyPaths: { _id: [] },
        isUnique: true,
        isSparse: false,
        isPartial: false,
        indexVersion: 2,
        direction: 'forward',
        indexBounds: { _id: [ '["1000", "4000"]' ] },
        keysExamined: 9027,
        seeks: 1,
        dupsTested: 0,
        dupsDropped: 0
      }
    },
    allPlansExecution: []
  },
  command: {
    find: 'zipcodes',
    filter: { _id: { '$gte': '1000', '$lte': '4000' } },
    '$db': 'practice'
  },
  serverInfo: {
    host: 'CA-20020790',
    port: 27017,
    version: '6.0.5',
    gitVersion: 'c9a99c120371d4d4c52cbb15dac34a36ce8d3b1d'
  },
  serverParameters: {
    internalQueryFacetBufferSizeBytes: 104857600,
    internalQueryFacetMaxOutputDocSizeBytes: 104857600,
    internalLookupStageIntermediateDocumentMaxSizeBytes: 104857600,
    internalDocumentSourceGroupMaxMemoryBytes: 104857600,
    internalQueryMaxBlockingSortMemoryUsageBytes: 104857600,
    internalQueryProhibitBlockingMergeOnMongoS: 0,
    internalQueryMaxAddToSetBytes: 104857600,
    internalDocumentSourceSetWindowFieldsMaxMemoryBytes: 104857600
  },
  ok: 1
}
```

## explainのmongoshヘルパーメソッド

todo databaseコマンドについて追記
databaseコマンドに加えて、mongoshは2つのヘルパーメソッドを提供する。

- [db.collection.explain()](https://www.mongodb.com/docs/manual/reference/method/db.collection.explain/#db.collection.explain--)
- [cursor.explain()](https://www.mongodb.com/docs/manual/reference/method/cursor.explain/#cursor.explain--)

mongoshのヘルパーメソッドはデータベースコマンドと同等の情報を返さない場合がある。
データベースコマンドはデフォルトで `allPlansExecution` が指定されるが、ヘルパーメソッドでは `queryPlanner` がデフォルトで指定される。

### db.collection.explain()

実行例

`db.productions.explain().find()`

`cursor.explain()` と異なり、explainの後に指定して関数に続けて `limit` や `count` などのmodifiersを指定することができる。
利用できるmodifiersは `db.collection.explain().<method(...)>.help()` で確認できる。

### cursor.explain()

cursorを返す次のコマンドから実行できる。

- aggregate
- count
- find
- remove
- distinct
- findAndModify
- mapReduce

`cursor.explain()` はcursorを返し、 実行結果を取得するには `.next()` かエイリアスの `.finish()` を呼び出す必要がある。mongoshのインタラクティブシェルで実行する場合は自動的に `.finish()` が呼び出される。

```shell
# インデックスの取得
practice> db.zipcodes.getIndexes()
[ { v: 2, key: { _id: 1 }, name: '_id_' } ]
```

explainはクエリ計画(query plan)をステージのツリー構造で表す。
MongoDB 5.1以後の `slot-based execution query engine` 、以前の `classic query engine` で表示が異なる
どちらを利用しているかは `explainVersion` で判定できる

|versoin|説明|
|:--|:--|
|1|classic query engineを利用している|
|2|slot-based execution query engineを利用している|

[explain.queryPlanner.winningPlan.inputStages](https://www.mongodb.com/docs/manual/reference/explain-results/#mongodb-data-explain.queryPlanner.winningPlan.inputStages)は `classic query execution engine` でのみ表示される

インデックスを利用した指定範囲の抽出

```shell
practice> db.zipcodes.find({ _id: { $gte: '1000', $lte: '4000' } }).explain()
{
  explainVersion: '1',
  queryPlanner: { # query optimizerによって選択されたクエリ計画の詳細
    namespace: 'practice.zipcodes', # <database>.<collection>
    indexFilterSet: false,
    parsedQuery: {
      '$and': [ { _id: { '$lte': '4000' } }, { _id: { '$gte': '1000' } } ]
    },
    queryHash: 'B25BDAF5', # query shapeのハッシュ値
    planCacheKey: 'AAB87497',
    maxIndexedOrSolutionsReached: false,
    maxIndexedAndSolutionsReached: false,
    maxScansToExplodeReached: false,
    winningPlan: { # query optimizerによって選択されたquery plan
      stage: 'FETCH', # ドキュメントの取得
      inputStage: { # 一つの子ステージ(複数の場合inputStages)
        stage: 'IXSCAN', # インデックスの走査
        keyPattern: { _id: 1 },
        indexName: '_id_', # 利用されたインデックス名
        isMultiKey: false,
        multiKeyPaths: { _id: [] },
        isUnique: true,
        isSparse: false,
        isPartial: false,
        indexVersion: 2,
        direction: 'forward',
        indexBounds: { _id: [ '["1000", "4000"]' ] }
      }
    },
    rejectedPlans: []
  },
  command: {
    find: 'zipcodes',
    filter: { _id: { '$gte': '1000', '$lte': '4000' } },
    '$db': 'practice'
  },
  serverInfo: { # MongoDBインスタンスの情報
    host: 'CA-20020790',
    port: 27017,
    version: '6.0.5',
    gitVersion: 'c9a99c120371d4d4c52cbb15dac34a36ce8d3b1d'
  },
  serverParameters: { # インスタンス内の詳細パラメーター
    internalQueryFacetBufferSizeBytes: 104857600,
    internalQueryFacetMaxOutputDocSizeBytes: 104857600,
    internalLookupStageIntermediateDocumentMaxSizeBytes: 104857600,
    internalDocumentSourceGroupMaxMemoryBytes: 104857600,
    internalQueryMaxBlockingSortMemoryUsageBytes: 104857600,
    internalQueryProhibitBlockingMergeOnMongoS: 0,
    internalQueryMaxAddToSetBytes: 104857600,
    internalDocumentSourceSetWindowFieldsMaxMemoryBytes: 104857600
  },
  ok: 1
}
```

### query predicate

predicateは述語。 `{ qty: 1 }` のようなドキュメントをフィルタする条件のこと。

### query shape

query predicate, sort, projection, collactionの組み合わせで構成される。query predicateフィールド名を含む構造を重視する。
`{ type: 'food' }` と `{ type: 'utensil' }` は等価である。
query shapeを16進数にハッシュ化した `queryHash` はスロークエリの判別に利用される。

### index filter

`planCacheSetFilter` に設定され、query optimizerが評価するquery shapeへのインデックスを決定する。
query optimizerはindex filterが存在する場合に指定されたインデックスのみを考慮する。
index filterはサーバーのプロセスが実行されている間存在し、シャットダウン後は永続化されない。

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

データ詳細

```shell
practice> db.zipcodes.findOne()
{
  _id: '01005',
  city: 'BARRE',
  loc: [ -72.108354, 42.409698 ],
  pop: 4546,
  state: 'MA'
}
# 件数
practice> db.zipcodes.countDocuments()
29353
```

## $indexStats

ドキュメントのインデックスごとに統計を出力する。

- aggregateの最初のステージでのみ利用できる
- トランザクション中で利用できない

```shell
practice> db.zipcodes.getIndexes()
[ { v: 2, key: { _id: 1 }, name: '_id_' } ]
practice> db.zipcodes.aggregate( [ { $indexStats: { } } ] )
[
  {
    name: '_id_',
    key: { _id: 1 },
    host: 'CA-20020790:27017',
    accesses: { ops: Long("7"), since: ISODate("2023-04-30T00:31:21.481Z") },
    spec: { v: 2, key: { _id: 1 }, name: '_id_' }
  }
]
```

## カーディナリティ

- [Analyze Query Performance](https://www.mongodb.com/docs/manual/tutorial/analyze-query-plan/)
- [Install MongoDB Community Edition on macOS](https://www.mongodb.com/docs/manual/tutorial/install-mongodb-on-os-x/)
  - macOSでのmongodbインストール・起動
- [Explain Results](https://www.mongodb.com/docs/manual/reference/explain-results/)
  - explainの表示内容を説明
- [Measure Index Use](https://www.mongodb.com/docs/manual/tutorial/measure-index-use/)
  - aggregateでの $indexStats, $explainでのクエリ計画の取得、$hintでのインデックス矯正について
- [Aggregation with the Zip Code Data Set](https://www.mongodb.com/docs/manual/tutorial/aggregation-zip-code-data-set/)
  - 住所データのフィクスチャを提供
- [大規模サービスにおけるMongoDBのインデックス運用](https://blog.studysapuri.jp/entry/mongodb-index)
- [データベースを遅くするための８つの方法](https://zenn.dev/koduki/articles/d3e8984f420b370681f9)
  - RDBに関する内容だがMongoDBにも通じる
