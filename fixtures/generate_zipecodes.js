/**
 * 住所のfixtureデータをExtended JSON v2で生成する
 *
 * 生成したデータのインポート
 * mongoimport \
 * --db=practice \
 * --collection=addresses \
 * --file=zipcodes.json \
 * --drop
 */
import fs from "node:fs";
import { faker } from "@faker-js/faker";

const numberOfZipcoes = 200000;

const createRandomZipCode = () => {
  const state = faker.address.state();

  return {
    city: faker.address.city(),
    loc: [faker.address.latitude(), faker.address.longitude()],
    state,
    zipCode: faker.address.zipCodeByState(state),
    country: {
      name: faker.address.country(),
      code: faker.address.countryCode(),
    },
  };
};

const writeStream = fs.createWriteStream("zipcodes.json");

Array.from({ length: numberOfZipcoes }).forEach(() => {
  const zipCode = createRandomZipCode();
  writeStream.write(`${JSON.stringify(zipCode)}\n`);
});
