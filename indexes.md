# indexes

todo
readとwriteどちらのパフォーマンスを優先するかのトレードインについて

read hevy write light
read light write heavy

インデックスを作成したドキュメントへのインサートはインデックスの再構築

MongoDBのインデックスはRAMに読み込まれている必要がある。diskからの読み込みは避ける。
