#!/bin/bash

# zipcodes.jsonをダウンロードしてmongoimportする

FIXTURES=zipcodes.json

if [ -f ${FIXTURES} ]; then
  wget -O ${FIXTURES} "https://media.mongodb.org/zips.json"
  if [ $? -ne 0 ]; then
    echo "Failed to download ${FIXTURES}"
    exit 1
  fi
fi

# 冪等性のため実行時dropする
mongoimport \
--db=practice \
--collection=zipcodes \
--file=${FIXTURES} \
--drop
if [ $? -ne 0 ]; then
  echo "Failed to import ${FIXTURES}"
  exit 1
fi

## インポート後データベースに接続
# mongosh localhost:27017/practice

exit 0
