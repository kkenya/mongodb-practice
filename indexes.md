# indexes

todo
readとwriteどちらのパフォーマンスを優先するかのトレードインについて

read hevy write light
read light write heavy

インデックスを作成したドキュメントへのインサートはインデックスの再構築

MongoDBのインデックスはRAMに読み込まれている必要がある。diskからの読み込みは避ける。

## fixtures

テストで利用するfixtureデータ

```shell
practice> db.zipcodes.findOne()
{
  _id: ObjectId("64531b86a9f0967a847d2f2d"),
  city: 'Onamouth',
  loc: [ '-30.6043', '-142.2737' ],
  state: 'Delaware',
  zipCode: '14832-9369',
  country: { name: 'Norway', code: 'CK' }
}
practice> db.zipcodes.countDocuments()
200000
```

## single field

単一のフィールドを指定したインデックス

```shell
practice> db.zipcodes.getIndexes()
[
  # デフォルトで作成される
  { v: 2, key: { _id: 1 }, name: '_id_' },
  # zipCodeのみを指定したインデックス
  { v: 2, key: { zipCode: 1 }, name: 'zipCode_1' }
]

```

|stage|説明|
|:--|:--|
|COLLSCAN|コレクション全体の走査|
|IXSCAN|選択されたindexを使用した走査|
|FETCH for retrieving documents
GROUP for grouping documents
SHARD_MERGE for merging results from shards
SHARDING_FILTER for filtering out orphan documents from shards

### COLLSCAN

コレクション全体の走査。
ソート指定なしの全件取得など。
    executionTimeMillis: 15,

```shell
{
  explainVersion: '1',
  queryPlanner: {
    namespace: 'practice.addresses',
    indexFilterSet: false,
    parsedQuery: {},
    queryHash: '17830885',
    planCacheKey: '17830885',
    maxIndexedOrSolutionsReached: false,
    maxIndexedAndSolutionsReached: false,
    maxScansToExplodeReached: false,
    winningPlan: { stage: 'COLLSCAN', direction: 'forward' },
    rejectedPlans: []
  },
  executionStats: {
    executionSuccess: true,
    nReturned: 200000,
    executionTimeMillis: 56,
    totalKeysExamined: 0,
    totalDocsExamined: 200000,
    executionStages: {
      stage: 'COLLSCAN',
      nReturned: 200000,
      executionTimeMillisEstimate: 0,
      works: 200002,
      advanced: 200000,
      needTime: 1,
      needYield: 0,
      saveState: 200,
      restoreState: 200,
      isEOF: 1,
      direction: 'forward',
      docsExamined: 200000
    },
    allPlansExecution: []
  },
  command: { find: 'addresses', filter: {}, '$db': 'practice' },
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

### IXSCAN

インデックスを使用した走査。
全件取得でインデックスが作成されている `_id` フィールドを昇順に取得する。
	todo: ソート指定なしより遅くなった
	件数が少ないためソートのコストの方が上回った?

インデックスなし

```shell
practice> db.addresses.find({}, { zipCode: 1, _id: 0 }).sort({ zipCode: 1 }).explain("allPlansExecution")
{
  explainVersion: '1',
  queryPlanner: {
    namespace: 'practice.addresses',
    indexFilterSet: false,
    parsedQuery: {},
    queryHash: '24FC2D2D',
    planCacheKey: '24FC2D2D',
    maxIndexedOrSolutionsReached: false,
    maxIndexedAndSolutionsReached: false,
    maxScansToExplodeReached: false,
    winningPlan: {
      stage: 'SORT',
      sortPattern: { zipCode: 1 },
      memLimit: 104857600,
      type: 'simple',
      inputStage: {
        stage: 'PROJECTION_SIMPLE',
        transformBy: { zipCode: 1, _id: 0 },
        inputStage: { stage: 'COLLSCAN', direction: 'forward' }
      }
    },
    rejectedPlans: []
  },
  executionStats: {
    executionSuccess: true,
    nReturned: 200000,
    executionTimeMillis: 256,
    totalKeysExamined: 0,
    totalDocsExamined: 200000,
    executionStages: {
      stage: 'SORT',
      nReturned: 200000,
      executionTimeMillisEstimate: 64,
      works: 400003,
      advanced: 200000,
      needTime: 200002,
      needYield: 0,
      saveState: 401,
      restoreState: 401,
      isEOF: 1,
      sortPattern: { zipCode: 1 },
      memLimit: 104857600,
      type: 'simple',
      totalDataSizeSorted: 11699690,
      usedDisk: false,
      spills: 0,
      inputStage: {
        stage: 'PROJECTION_SIMPLE',
        nReturned: 200000,
        executionTimeMillisEstimate: 1,
        works: 200002,
        advanced: 200000,
        needTime: 1,
        needYield: 0,
        saveState: 401,
        restoreState: 401,
        isEOF: 1,
        transformBy: { zipCode: 1, _id: 0 },
        inputStage: {
          stage: 'COLLSCAN',
          nReturned: 200000,
          executionTimeMillisEstimate: 0,
          works: 200002,
          advanced: 200000,
          needTime: 1,
          needYield: 0,
          saveState: 401,
          restoreState: 401,
          isEOF: 1,
          direction: 'forward',
          docsExamined: 200000
        }
      }
    },
    allPlansExecution: []
  },
  command: {
    find: 'addresses',
    filter: {},
    sort: { zipCode: 1 },
    projection: { zipCode: 1, _id: 0 },
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

インデックスあり

```shell
practice> db.addresses.createIndex({ zipCode: 1 })
zipCode_1

practice> db.addresses.find().sort({ zipCode: 1 }).explain("allPlansExecution")
{
  explainVersion: '1',
  queryPlanner: {
    namespace: 'practice.addresses',
    indexFilterSet: false,
    parsedQuery: {},
    queryHash: '713BB622',
    planCacheKey: '713BB622',
    maxIndexedOrSolutionsReached: false,
    maxIndexedAndSolutionsReached: false,
    maxScansToExplodeReached: false,
    winningPlan: {
      stage: 'FETCH',
      inputStage: {
        stage: 'IXSCAN',
        keyPattern: { zipCode: 1 },
        indexName: 'zipCode_1',
        isMultiKey: false,
        multiKeyPaths: { zipCode: [] },
        isUnique: false,
        isSparse: false,
        isPartial: false,
        indexVersion: 2,
        direction: 'forward',
        indexBounds: { zipCode: [ '[MinKey, MaxKey]' ] }
      }
    },
    rejectedPlans: []
  },
  executionStats: {
    executionSuccess: true,
    nReturned: 200000,
    executionTimeMillis: 235,
    totalKeysExamined: 200000,
    totalDocsExamined: 200000,
    executionStages: {
      stage: 'FETCH',
      nReturned: 200000,
      executionTimeMillisEstimate: 6,
      works: 200001,
      advanced: 200000,
      needTime: 0,
      needYield: 0,
      saveState: 200,
      restoreState: 200,
      isEOF: 1,
      docsExamined: 200000,
      alreadyHasObj: 0,
      inputStage: {
        stage: 'IXSCAN',
        nReturned: 200000,
        executionTimeMillisEstimate: 4,
        works: 200001,
        advanced: 200000,
        needTime: 0,
        needYield: 0,
        saveState: 200,
        restoreState: 200,
        isEOF: 1,
        keyPattern: { zipCode: 1 },
        indexName: 'zipCode_1',
        isMultiKey: false,
        multiKeyPaths: { zipCode: [] },
        isUnique: false,
        isSparse: false,
        isPartial: false,
        indexVersion: 2,
        direction: 'forward',
        indexBounds: { zipCode: [ '[MinKey, MaxKey]' ] },
        keysExamined: 200000,
        seeks: 1,
        dupsTested: 0,
        dupsDropped: 0
      }
    },
    allPlansExecution: []
  },
  command: {
    find: 'addresses',
    filter: {},
    sort: { zipCode: 1 },
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

単一のフィールドで作成したインデックスでは昇順・降順関係なくそのインデックスが使用される。

### covered query

queryの条件とprojectionに、インデックスに指定したフィールドのみを指定する。
stageは `PROJECTION_COVERED` が表示される。
クエリの条件と返り値がインデックスのフィールドに含まれる `covered queries` の場合、 `FETCH` ステージの子のノードに含まれない

```shell
practice> db.addresses.find({}, { zipCode: 1, _id: 0 }).sort({ zipCode: 1 }).explain("allPlansExecution")
{
  explainVersion: '1',
  queryPlanner: {
    namespace: 'practice.addresses',
    indexFilterSet: false,
    parsedQuery: {},
    queryHash: '24FC2D2D',
    planCacheKey: '24FC2D2D',
    maxIndexedOrSolutionsReached: false,
    maxIndexedAndSolutionsReached: false,
    maxScansToExplodeReached: false,
    winningPlan: {
      stage: 'PROJECTION_COVERED',
      transformBy: { zipCode: 1, _id: 0 },
      inputStage: {
        stage: 'IXSCAN',
        keyPattern: { zipCode: 1 },
        indexName: 'zipCode_1',
        isMultiKey: false,
        multiKeyPaths: { zipCode: [] },
        isUnique: false,
        isSparse: false,
        isPartial: false,
        indexVersion: 2,
        direction: 'forward',
        indexBounds: { zipCode: [ '[MinKey, MaxKey]' ] }
      }
    },
    rejectedPlans: []
  },
  executionStats: {
    executionSuccess: true,
    nReturned: 200000,
    executionTimeMillis: 120,
    totalKeysExamined: 200000,
    totalDocsExamined: 0,
    executionStages: {
      stage: 'PROJECTION_COVERED',
      nReturned: 200000,
      executionTimeMillisEstimate: 1,
      works: 200001,
      advanced: 200000,
      needTime: 0,
      needYield: 0,
      saveState: 200,
      restoreState: 200,
      isEOF: 1,
      transformBy: { zipCode: 1, _id: 0 },
      inputStage: {
        stage: 'IXSCAN',
        nReturned: 200000,
        executionTimeMillisEstimate: 0,
        works: 200001,
        advanced: 200000,
        needTime: 0,
        needYield: 0,
        saveState: 200,
        restoreState: 200,
        isEOF: 1,
        keyPattern: { zipCode: 1 },
        indexName: 'zipCode_1',
        isMultiKey: false,
        multiKeyPaths: { zipCode: [] },
        isUnique: false,
        isSparse: false,
        isPartial: false,
        indexVersion: 2,
        direction: 'forward',
        indexBounds: { zipCode: [ '[MinKey, MaxKey]' ] },
        keysExamined: 200000,
        seeks: 1,
        dupsTested: 0,
        dupsDropped: 0
      }
    },
    allPlansExecution: []
  },
  command: {
    find: 'addresses',
    filter: {},
    sort: { zipCode: 1 },
    projection: { zipCode: 1, _id: 0 },
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

## Compound Indexes

複数のフィールドを対象にしたインデックス

### index prefix

複数のフィールドを指定したインデックスは先頭から一致するフィールドのみの条件、ソートで使用できる。

例えば、次の3つのフィールドを指定したインデックスがあるとする。

```shell
practice> db.addresses.createIndex({ city: 1, zipCode: 1, state: 1 })
city_1_zipCode_1_state_1
```

インデックスに指定された3つのフィールドの検索条件は、並び順は関係ない組み合わせなので3C3 + 3C2 + 3C1の7通りとなる。

|query condition|stage|
|:--|:--|
|`city: 1`|IXSCAN|
|`zipCode: 1`|COLLSCAN|
|`state: 1`|COLLSCAN|
|`city: 1, zipCode: 1`|IXSCAN|
|`city: 1, state: 1`|IXSCAN(一部)|
|`zipCode: 1, state: 1`|COLLSCAN|
|`city: 1, zipCode: 1, state: 1`|IXSCAN|

`city: 1` 、 `zipCode: 1` 、 `state: 1` はインデックスのプレフィックスに一致するので検索時インデックスが使用される。
プレフィックスに一致しない `city: 1` や　`zipCode: 1` はインデックスが使用されない。これはインデックスがB-Tree構造で構築されていることを意識すれば感覚的に理解しやすい。

todo: b-treeの図

例外として `city: 1, state: 1` はプレフィックに完全に一致しないが、インデックスは使用される。このとき `winningPlan` で使用されるインデックスの範囲は下のようになる。

```shell
    winningPlan: {
        # 省略...
        indexBounds: {
          city: [ '[1, 1]' ],
          zipCode: [ '[MinKey, MaxKey]' ],
          state: [ '[1, 1]' ]
        },
```

インデックスに一致するクエリの場合各フィールドの `indexBounds` の下限と上限は `1` になるが、 `city: 1, state: 1` のクエリでは `zipCode` が検索条件に含まれないため全件を対象としてそのleaf nodeであるstateが走査される。

### city: 1, state: 1

```shell
practice> db.addresses.find({ city: 1, state: 1 }).explain('allPlansExecution')
{
  explainVersion: '1',
  queryPlanner: {
    namespace: 'practice.addresses',
    indexFilterSet: false,
    parsedQuery: {
      '$and': [ { city: { '$eq': 1 } }, { state: { '$eq': 1 } } ]
    },
    queryHash: '4C442345',
    planCacheKey: 'E548C5D8',
    maxIndexedOrSolutionsReached: false,
    maxIndexedAndSolutionsReached: false,
    maxScansToExplodeReached: false,
    winningPlan: {
      stage: 'FETCH',
      inputStage: {
        stage: 'IXSCAN',
        keyPattern: { city: 1, zipCode: 1, state: 1 },
        indexName: 'city_1_zipCode_1_state_1',
        isMultiKey: false,
        multiKeyPaths: { city: [], zipCode: [], state: [] },
        isUnique: false,
        isSparse: false,
        isPartial: false,
        indexVersion: 2,
        direction: 'forward',
        indexBounds: {
          city: [ '[1, 1]' ],
          zipCode: [ '[MinKey, MaxKey]' ],
          state: [ '[1, 1]' ]
        }
      }
    },
    rejectedPlans: []
  },
  executionStats: {
    executionSuccess: true,
    nReturned: 0,
    executionTimeMillis: 0,
    totalKeysExamined: 1,
    totalDocsExamined: 0,
    executionStages: {
      stage: 'FETCH',
      nReturned: 0,
      executionTimeMillisEstimate: 0,
      works: 1,
      advanced: 0,
      needTime: 0,
      needYield: 0,
      saveState: 0,
      restoreState: 0,
      isEOF: 1,
      docsExamined: 0,
      alreadyHasObj: 0,
      inputStage: {
        stage: 'IXSCAN',
        nReturned: 0,
        executionTimeMillisEstimate: 0,
        works: 1,
        advanced: 0,
        needTime: 0,
        needYield: 0,
        saveState: 0,
        restoreState: 0,
        isEOF: 1,
        keyPattern: { city: 1, zipCode: 1, state: 1 },
        indexName: 'city_1_zipCode_1_state_1',
        isMultiKey: false,
        multiKeyPaths: { city: [], zipCode: [], state: [] },
        isUnique: false,
        isSparse: false,
        isPartial: false,
        indexVersion: 2,
        direction: 'forward',
        indexBounds: {
          city: [ '[1, 1]' ],
          zipCode: [ '[MinKey, MaxKey]' ],
          state: [ '[1, 1]' ]
        },
        keysExamined: 1,
        seeks: 1,
        dupsTested: 0,
        dupsDropped: 0
      }
    },
    allPlansExecution: []
  },
  command: {
    find: 'addresses',
    filter: { city: 1, state: 1 },
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

### 並び順

単一フィールドのインデックスは並び順が昇順・降順に関わらず使用されるが、compound indexはフィールドの並び順によってインデックスが使用されるない場合がある。

次のインデックス `{ city: 1, zipCode: -1 }` を作成した場合、インデックスが使用されるのは指定通りの `.sort({ city: 1, zipCode: -1 })` と逆順の `.sort({city: -1,  zipCode: 1 })` となる。片方のフィールドのみがインデックスと逆順の場合は使用できない。

|||**zipCode**|**zipCode**|
|:--|:--|:--|:--|
|||昇順(1)|降順(-1)|
|**city**|昇順(1)|COLLSCAN|IXSCAN|
|**city**|降順(-1)|IXSCAN|COLLSCAN|

### city: 1, zipCode: 1

```shell
practice> db.addresses.find().sort({ city: 1, zipCode: 1 }).explain('allPlansExecution')
{
  explainVersion: '1',
  queryPlanner: {
    namespace: 'practice.addresses',
    indexFilterSet: false,
    parsedQuery: {},
    queryHash: 'A6781FEF',
    planCacheKey: 'A6781FEF',
    maxIndexedOrSolutionsReached: false,
    maxIndexedAndSolutionsReached: false,
    maxScansToExplodeReached: false,
    winningPlan: {
      stage: 'SORT',
      sortPattern: { city: 1, zipCode: 1 },
      memLimit: 104857600,
      type: 'simple',
      inputStage: { stage: 'COLLSCAN', direction: 'forward' }
    },
    rejectedPlans: []
  },
  executionStats: {
    executionSuccess: true,
    nReturned: 200000,
    executionTimeMillis: 308,
    totalKeysExamined: 0,
    totalDocsExamined: 200000,
    executionStages: {
      stage: 'SORT',
      nReturned: 200000,
      executionTimeMillisEstimate: 138,
      works: 400003,
      advanced: 200000,
      needTime: 200002,
      needYield: 0,
      saveState: 401,
      restoreState: 401,
      isEOF: 1,
      sortPattern: { city: 1, zipCode: 1 },
      memLimit: 104857600,
      type: 'simple',
      totalDataSizeSorted: 58212392,
      usedDisk: false,
      spills: 0,
      inputStage: {
        stage: 'COLLSCAN',
        nReturned: 200000,
        executionTimeMillisEstimate: 0,
        works: 200002,
        advanced: 200000,
        needTime: 1,
        needYield: 0,
        saveState: 401,
        restoreState: 401,
        isEOF: 1,
        direction: 'forward',
        docsExamined: 200000
      }
    },
    allPlansExecution: []
  },
  command: {
    find: 'addresses',
    filter: {},
    sort: { city: 1, zipCode: 1 },
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

### city: 1, zipCode: -1

```shell
practice> db.addresses.find().sort({ city: 1, zipCode: -1 }).explain('allPlansExecution')
{
  explainVersion: '1',
  queryPlanner: {
    namespace: 'practice.addresses',
    indexFilterSet: false,
    parsedQuery: {},
    queryHash: '02CB5826',
    planCacheKey: '02CB5826',
    maxIndexedOrSolutionsReached: false,
    maxIndexedAndSolutionsReached: false,
    maxScansToExplodeReached: false,
    winningPlan: {
      stage: 'FETCH',
      inputStage: {
        stage: 'IXSCAN',
        keyPattern: { city: 1, zipCode: -1 },
        indexName: 'city_1_zipCode_-1',
        isMultiKey: false,
        multiKeyPaths: { city: [], zipCode: [] },
        isUnique: false,
        isSparse: false,
        isPartial: false,
        indexVersion: 2,
        direction: 'forward',
        indexBounds: {
          city: [ '[MinKey, MaxKey]' ],
          zipCode: [ '[MaxKey, MinKey]' ]
        }
      }
    },
    rejectedPlans: []
  },
  executionStats: {
    executionSuccess: true,
    nReturned: 200000,
    executionTimeMillis: 243,
    totalKeysExamined: 200000,
    totalDocsExamined: 200000,
    executionStages: {
      stage: 'FETCH',
      nReturned: 200000,
      executionTimeMillisEstimate: 4,
      works: 200001,
      advanced: 200000,
      needTime: 0,
      needYield: 0,
      saveState: 200,
      restoreState: 200,
      isEOF: 1,
      docsExamined: 200000,
      alreadyHasObj: 0,
      inputStage: {
        stage: 'IXSCAN',
        nReturned: 200000,
        executionTimeMillisEstimate: 2,
        works: 200001,
        advanced: 200000,
        needTime: 0,
        needYield: 0,
        saveState: 200,
        restoreState: 200,
        isEOF: 1,
        keyPattern: { city: 1, zipCode: -1 },
        indexName: 'city_1_zipCode_-1',
        isMultiKey: false,
        multiKeyPaths: { city: [], zipCode: [] },
        isUnique: false,
        isSparse: false,
        isPartial: false,
        indexVersion: 2,
        direction: 'forward',
        indexBounds: {
          city: [ '[MinKey, MaxKey]' ],
          zipCode: [ '[MaxKey, MinKey]' ]
        },
        keysExamined: 200000,
        seeks: 1,
        dupsTested: 0,
        dupsDropped: 0
      }
    },
    allPlansExecution: []
  },
  command: {
    find: 'addresses',
    filter: {},
    sort: { city: 1, zipCode: -1 },
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

### city: -1, zipCode: 1

```shell
practice> db.addresses.find().sort({ city: -1, zipCode: 1 }).explain('allPlansExecution')
{
  explainVersion: '1',
  queryPlanner: {
    namespace: 'practice.addresses',
    indexFilterSet: false,
    parsedQuery: {},
    queryHash: 'A525A2B5',
    planCacheKey: 'A525A2B5',
    maxIndexedOrSolutionsReached: false,
    maxIndexedAndSolutionsReached: false,
    maxScansToExplodeReached: false,
    winningPlan: {
      stage: 'FETCH',
      inputStage: {
        stage: 'IXSCAN',
        keyPattern: { city: 1, zipCode: -1 },
        indexName: 'city_1_zipCode_-1',
        isMultiKey: false,
        multiKeyPaths: { city: [], zipCode: [] },
        isUnique: false,
        isSparse: false,
        isPartial: false,
        indexVersion: 2,
        direction: 'backward',
        indexBounds: {
          city: [ '[MaxKey, MinKey]' ],
          zipCode: [ '[MinKey, MaxKey]' ]
        }
      }
    },
    rejectedPlans: []
  },
  executionStats: {
    executionSuccess: true,
    nReturned: 200000,
    executionTimeMillis: 351,
    totalKeysExamined: 200000,
    totalDocsExamined: 200000,
    executionStages: {
      stage: 'FETCH',
      nReturned: 200000,
      executionTimeMillisEstimate: 18,
      works: 200001,
      advanced: 200000,
      needTime: 0,
      needYield: 0,
      saveState: 200,
      restoreState: 200,
      isEOF: 1,
      docsExamined: 200000,
      alreadyHasObj: 0,
      inputStage: {
        stage: 'IXSCAN',
        nReturned: 200000,
        executionTimeMillisEstimate: 13,
        works: 200001,
        advanced: 200000,
        needTime: 0,
        needYield: 0,
        saveState: 200,
        restoreState: 200,
        isEOF: 1,
        keyPattern: { city: 1, zipCode: -1 },
        indexName: 'city_1_zipCode_-1',
        isMultiKey: false,
        multiKeyPaths: { city: [], zipCode: [] },
        isUnique: false,
        isSparse: false,
        isPartial: false,
        indexVersion: 2,
        direction: 'backward',
        indexBounds: {
          city: [ '[MaxKey, MinKey]' ],
          zipCode: [ '[MinKey, MaxKey]' ]
        },
        keysExamined: 200000,
        seeks: 1,
        dupsTested: 0,
        dupsDropped: 0
      }
    },
    allPlansExecution: []
  },
  command: {
    find: 'addresses',
    filter: {},
    sort: { city: -1, zipCode: 1 },
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

### city: -1, zipCode: -1

```shell
practice> db.addresses.find().sort({ city: -1, zipCode: -1 }).explain('allPlansExecution')
{
  explainVersion: '1',
  queryPlanner: {
    namespace: 'practice.addresses',
    indexFilterSet: false,
    parsedQuery: {},
    queryHash: 'A471D6E0',
    planCacheKey: 'A471D6E0',
    maxIndexedOrSolutionsReached: false,
    maxIndexedAndSolutionsReached: false,
    maxScansToExplodeReached: false,
    winningPlan: {
      stage: 'SORT',
      sortPattern: { city: -1, zipCode: -1 },
      memLimit: 104857600,
      type: 'simple',
      inputStage: { stage: 'COLLSCAN', direction: 'forward' }
    },
    rejectedPlans: []
  },
  executionStats: {
    executionSuccess: true,
    nReturned: 200000,
    executionTimeMillis: 310,
    totalKeysExamined: 0,
    totalDocsExamined: 200000,
    executionStages: {
      stage: 'SORT',
      nReturned: 200000,
      executionTimeMillisEstimate: 143,
      works: 400003,
      advanced: 200000,
      needTime: 200002,
      needYield: 0,
      saveState: 401,
      restoreState: 401,
      isEOF: 1,
      sortPattern: { city: -1, zipCode: -1 },
      memLimit: 104857600,
      type: 'simple',
      totalDataSizeSorted: 58212392,
      usedDisk: false,
      spills: 0,
      inputStage: {
        stage: 'COLLSCAN',
        nReturned: 200000,
        executionTimeMillisEstimate: 1,
        works: 200002,
        advanced: 200000,
        needTime: 1,
        needYield: 0,
        saveState: 401,
        restoreState: 401,
        isEOF: 1,
        direction: 'forward',
        docsExamined: 200000
      }
    },
    allPlansExecution: []
  },
  command: {
    find: 'addresses',
    filter: {},
    sort: { city: -1, zipCode: -1 },
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
