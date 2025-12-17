/*
 * Copyright © 2025-26 l5yth & contributors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { COASTLINES, MAJOR_CITIES, COUNTRIES } from '../offline-map-data.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

test('offline-map-data file size is under 150KB constraint', async () => {
  const filePath = join(__dirname, '..', 'offline-map-data.js');
  const fileContent = await readFile(filePath, 'utf-8');
  const fileSizeKB = Buffer.byteLength(fileContent, 'utf-8') / 1024;
  
  assert.ok(fileSizeKB < 150, `File size ${fileSizeKB.toFixed(2)}KB exceeds 150KB limit`);
});

test('COASTLINES contains valid coordinate arrays', () => {
  assert.ok(Array.isArray(COASTLINES), 'COASTLINES should be an array');
  assert.ok(COASTLINES.length > 0, 'COASTLINES should not be empty');
  
  COASTLINES.forEach(coastline => {
    assert.ok(coastline.name, 'Each coastline should have a name');
    assert.ok(Array.isArray(coastline.coords), 'Each coastline should have coords array');
    assert.ok(coastline.coords.length > 0, 'Coastline coords should not be empty');
    
    coastline.coords.forEach(coord => {
      assert.ok(Array.isArray(coord), 'Each coordinate should be an array');
      assert.equal(coord.length, 2, 'Each coordinate should have exactly 2 elements [lon, lat]');
      const [lon, lat] = coord;
      assert.ok(typeof lon === 'number', 'Longitude should be a number');
      assert.ok(typeof lat === 'number', 'Latitude should be a number');
      assert.ok(lon >= -180 && lon <= 180, 'Longitude should be in valid range');
      assert.ok(lat >= -90 && lat <= 90, 'Latitude should be in valid range');
    });
  });
});

test('MAJOR_CITIES contains valid city data', () => {
  assert.ok(Array.isArray(MAJOR_CITIES), 'MAJOR_CITIES should be an array');
  assert.ok(MAJOR_CITIES.length > 0, 'MAJOR_CITIES should not be empty');
  assert.ok(MAJOR_CITIES.length <= 100, 'MAJOR_CITIES should contain approximately 100 cities');
  
  MAJOR_CITIES.forEach(city => {
    assert.ok(city.name, 'Each city should have a name');
    assert.ok(typeof city.lat === 'number', 'City latitude should be a number');
    assert.ok(typeof city.lon === 'number', 'City longitude should be a number');
    assert.ok(typeof city.pop === 'number', 'City population should be a number');
    assert.ok(city.lat >= -90 && city.lat <= 90, 'City latitude should be in valid range');
    assert.ok(city.lon >= -180 && city.lon <= 180, 'City longitude should be in valid range');
    assert.ok(city.pop > 0, 'City population should be positive');
  });
});

test('COUNTRIES contains valid country data', () => {
  assert.ok(Array.isArray(COUNTRIES), 'COUNTRIES should be an array');
  assert.ok(COUNTRIES.length > 0, 'COUNTRIES should not be empty');
  assert.ok(COUNTRIES.length <= 50, 'COUNTRIES should contain approximately 50 countries');
  
  COUNTRIES.forEach(country => {
    assert.ok(country.name, 'Each country should have a name');
    assert.ok(Array.isArray(country.centroid), 'Country centroid should be an array');
    assert.equal(country.centroid.length, 2, 'Country centroid should have exactly 2 elements [lon, lat]');
    const [lon, lat] = country.centroid;
    assert.ok(typeof lon === 'number', 'Centroid longitude should be a number');
    assert.ok(typeof lat === 'number', 'Centroid latitude should be a number');
    assert.ok(lon >= -180 && lon <= 180, 'Centroid longitude should be in valid range');
    assert.ok(lat >= -90 && lat <= 90, 'Centroid latitude should be in valid range');
  });
});

test('data contains geographic diversity', () => {
  // Check that we have cities on different continents
  const hasNorthAmerica = MAJOR_CITIES.some(c => c.lon < -60 && c.lat > 10);
  const hasSouthAmerica = MAJOR_CITIES.some(c => c.lon < -30 && c.lat < -10);
  const hasEurope = MAJOR_CITIES.some(c => c.lon > -10 && c.lon < 40 && c.lat > 35);
  const hasAsia = MAJOR_CITIES.some(c => c.lon > 60 && c.lat > 10);
  const hasAfrica = MAJOR_CITIES.some(c => c.lon > -20 && c.lon < 60 && c.lat > -40 && c.lat < 40);
  const hasOceania = MAJOR_CITIES.some(c => c.lon > 110 && c.lat < -10);
  
  assert.ok(hasNorthAmerica, 'Should have cities in North America');
  assert.ok(hasSouthAmerica, 'Should have cities in South America');
  assert.ok(hasEurope, 'Should have cities in Europe');
  assert.ok(hasAsia, 'Should have cities in Asia');
  assert.ok(hasAfrica, 'Should have cities in Africa');
  assert.ok(hasOceania, 'Should have cities in Oceania');
});
