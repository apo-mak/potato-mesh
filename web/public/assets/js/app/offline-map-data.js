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

/**
 * Simplified geographic data for offline map rendering.
 * Data is intentionally low-resolution to keep bundle size minimal.
 * Coordinates are [lon, lat] pairs following GeoJSON convention.
 */

/**
 * Major world coastlines and country borders (simplified).
 * Data represents approximate boundaries with ~0.5° resolution.
 * @type {Array<{name: string, coords: Array<Array<number>>}>}
 */
export const COASTLINES = [
  // North America
  { name: 'North America West', coords: [[-170,52],[-165,60],[-155,65],[-145,68],[-135,68],[-130,60],[-125,55],[-125,50],[-124,48],[-123,47],[-122,48],[-121,49],[-120,49],[-118,47],[-117,46],[-115,44],[-113,42],[-110,40],[-108,38],[-106,36],[-105,35],[-104,34],[-103,33],[-102,32],[-101,31],[-100,30],[-99,29],[-98,28],[-97,27],[-97,26],[-98,25],[-99,24],[-100,23],[-101,22],[-102,21],[-104,20],[-106,19],[-108,18],[-110,17],[-112,16],[-114,16],[-116,17],[-118,18],[-119,20],[-120,22],[-121,24]] },
  { name: 'North America East', coords: [[-80,25],[-79,26],[-78,27],[-77,28],[-76,29],[-75,30],[-74,31],[-73,32],[-72,33],[-71,34],[-70,35],[-69,36],[-68,37],[-67,38],[-66,39],[-65,40],[-64,41],[-64,42],[-65,43],[-66,44],[-67,45],[-68,46],[-69,47],[-70,48],[-71,49],[-72,50],[-73,51],[-74,52],[-75,53],[-76,54],[-77,55],[-76,56],[-75,57],[-74,58],[-72,59],[-70,60],[-68,61],[-65,62],[-63,63],[-60,64],[-57,65],[-54,66],[-51,67],[-48,68],[-45,69],[-42,70]] },
  
  // South America
  { name: 'South America', coords: [[-80,-5],[-79,-4],[-78,-3],[-77,-2],[-76,-1],[-75,0],[-74,1],[-73,2],[-72,3],[-71,4],[-70,5],[-69,6],[-68,7],[-67,8],[-66,9],[-65,10],[-64,11],[-62,11],[-60,10],[-58,9],[-56,8],[-54,7],[-52,6],[-50,5],[-48,4],[-46,3],[-44,2],[-42,1],[-40,0],[-38,-1],[-36,-2],[-35,-4],[-35,-6],[-36,-8],[-37,-10],[-38,-12],[-39,-14],[-40,-16],[-41,-18],[-42,-20],[-43,-22],[-44,-24],[-45,-26],[-46,-28],[-47,-30],[-48,-32],[-49,-34],[-50,-36],[-51,-38],[-52,-40],[-53,-42],[-54,-44],[-55,-46],[-56,-48],[-57,-50],[-58,-52],[-59,-54],[-66,-55],[-67,-53],[-68,-51],[-69,-49],[-70,-47],[-71,-45],[-72,-43],[-73,-41],[-74,-39],[-75,-37],[-76,-35],[-77,-33],[-78,-31],[-79,-29],[-80,-27],[-81,-25],[-81,-23],[-81,-21],[-81,-19],[-81,-17],[-81,-15],[-81,-13],[-81,-11],[-81,-9],[-81,-7]] },
  
  // Europe
  { name: 'Europe West', coords: [[-10,51],[-9,52],[-8,53],[-7,54],[-6,55],[-5,56],[-4,57],[-3,58],[-2,59],[-1,60],[0,61],[1,62],[2,63],[3,64],[4,65],[5,66],[6,67],[7,68],[8,69],[10,70],[12,70],[14,69],[16,68],[18,67],[20,66],[22,65],[24,64],[26,63],[28,62],[30,61],[31,60],[30,59],[29,58],[28,57],[27,56],[26,55],[25,54],[24,53],[23,52],[22,51],[21,50],[20,49],[19,48],[18,47],[17,46],[16,45],[15,44],[14,43],[13,42],[12,41],[11,40],[10,39],[9,38],[8,37],[7,36],[6,36],[5,37],[4,38],[3,39],[2,40],[1,41],[0,42],[-1,43],[-2,44],[-3,45],[-4,46],[-5,47],[-6,48],[-7,49],[-8,50]] },
  
  // Mediterranean Sea detail
  { name: 'Mediterranean North', coords: [[-6,36],[-5,37],[-4,38],[-3,39],[-2,40],[-1,41],[0,41],[1,41],[2,41],[3,41],[4,40],[5,40],[6,40],[7,40],[8,40],[9,40],[10,40],[11,40],[12,40],[13,40],[14,39],[15,39],[16,39],[17,38],[18,38],[19,38],[20,38],[21,38],[22,38],[23,38],[24,38],[25,37],[26,37],[27,37],[28,37],[29,37],[30,37],[31,37],[32,37],[33,37],[34,37],[35,37],[36,37]] },
  { name: 'Adriatic & Aegean', coords: [[12,46],[13,45],[14,45],[15,44],[16,44],[16,43],[16,42],[16,41],[17,40],[18,39],[19,39],[20,39],[21,39],[22,39],[23,39],[24,39],[25,39],[26,39],[27,39],[28,39],[29,39],[30,39],[31,39],[32,38],[33,38],[34,37],[35,37],[36,37]] },
  { name: 'Black Sea', coords: [[28,46],[29,46],[30,45],[31,45],[32,45],[33,45],[34,45],[35,44],[36,44],[37,44],[38,44],[39,44],[40,44],[41,44],[42,43],[42,42],[42,41],[41,41],[40,41],[39,42],[38,42],[37,42],[36,42],[35,43],[34,43],[33,44],[32,44],[31,44],[30,44],[29,45]] },
  
  // Africa
  { name: 'Africa', coords: [[10,37],[11,36],[12,35],[13,34],[14,33],[15,32],[16,31],[17,30],[18,29],[19,28],[20,27],[21,26],[22,25],[23,24],[24,23],[25,22],[26,21],[27,20],[28,19],[29,18],[30,17],[31,16],[32,15],[33,14],[34,13],[35,12],[36,11],[37,10],[38,9],[39,8],[40,7],[41,6],[42,5],[43,4],[44,3],[45,2],[46,1],[47,0],[48,-1],[49,-2],[50,-3],[51,-4],[51,-6],[50,-8],[49,-10],[48,-12],[47,-14],[46,-16],[45,-18],[44,-20],[43,-22],[42,-24],[41,-26],[40,-28],[39,-30],[38,-32],[37,-34],[35,-35],[33,-34],[31,-33],[29,-32],[27,-31],[25,-30],[23,-29],[21,-28],[19,-27],[17,-26],[15,-25],[13,-24],[11,-23],[9,-22],[7,-21],[5,-20],[3,-19],[1,-18],[-1,-17],[-3,-16],[-5,-15],[-7,-14],[-9,-13],[-11,-12],[-13,-11],[-15,-10],[-16,-8],[-17,-6],[-17,-4],[-17,-2],[-17,0],[-16,2],[-15,4],[-14,6],[-13,8],[-12,10],[-11,12],[-10,14],[-9,16],[-8,18],[-7,20],[-6,22],[-5,24],[-4,26],[-3,28],[-2,30],[-1,32],[0,33],[1,34],[2,35],[3,36],[4,37],[5,37],[6,37],[7,37],[8,37],[9,37]] },
  
  // Asia
  { name: 'Asia', coords: [[30,40],[32,41],[34,42],[36,43],[38,44],[40,45],[42,46],[44,47],[46,48],[48,49],[50,50],[52,51],[54,52],[56,53],[58,54],[60,55],[62,56],[64,57],[66,58],[68,59],[70,60],[72,61],[74,62],[76,63],[78,64],[80,65],[82,66],[84,67],[86,68],[88,69],[90,70],[92,70],[94,69],[96,68],[98,67],[100,66],[102,65],[104,64],[106,63],[108,62],[110,61],[112,60],[114,59],[116,58],[118,57],[120,56],[122,55],[124,54],[126,53],[128,52],[130,51],[132,50],[134,49],[136,48],[138,47],[140,46],[142,45],[144,44],[146,43],[148,42],[150,41],[152,40],[154,39],[156,38],[158,37],[160,36],[160,34],[159,32],[158,30],[157,28],[156,26],[155,24],[154,22],[153,20],[152,18],[151,16],[150,14],[149,12],[148,10],[147,8],[146,6],[145,4],[144,2],[143,0],[142,-2],[141,-4],[140,-6],[139,-8],[138,-9],[136,-10],[134,-10],[132,-9],[130,-8],[128,-7],[126,-6],[124,-5],[122,-4],[120,-3],[118,-2],[116,-1],[114,0],[112,1],[110,2],[108,3],[106,4],[104,5],[102,6],[100,7],[98,8],[96,9],[94,10],[92,11],[90,12],[88,13],[86,14],[84,15],[82,16],[80,17],[78,18],[76,19],[74,20],[72,21],[70,22],[68,23],[66,24],[64,25],[62,26],[60,27],[58,28],[56,29],[54,30],[52,31],[50,32],[48,33],[46,34],[44,35],[42,36],[40,37],[38,38],[36,39],[34,40],[32,40]] },
  
  // Australia
  { name: 'Australia', coords: [[113,-10],[114,-11],[115,-12],[116,-13],[117,-14],[118,-15],[119,-16],[120,-17],[121,-18],[122,-19],[123,-20],[124,-21],[125,-22],[126,-23],[127,-24],[128,-25],[129,-26],[130,-27],[131,-28],[132,-29],[133,-30],[134,-31],[135,-32],[136,-33],[137,-34],[138,-35],[139,-36],[140,-37],[141,-38],[142,-39],[143,-40],[144,-41],[145,-42],[146,-43],[147,-44],[148,-43],[149,-42],[150,-41],[151,-40],[152,-39],[153,-38],[154,-37],[154,-36],[153,-35],[152,-34],[151,-33],[150,-32],[149,-31],[148,-30],[147,-29],[146,-28],[145,-27],[144,-26],[143,-25],[142,-24],[141,-23],[140,-22],[139,-21],[138,-20],[137,-19],[136,-18],[135,-17],[134,-16],[133,-15],[132,-14],[131,-13],[130,-12],[129,-11],[128,-10],[127,-10],[126,-11],[125,-12],[124,-13],[123,-14],[122,-15],[121,-16],[120,-17],[119,-18],[118,-19],[117,-20],[116,-21],[115,-22],[114,-23],[113,-24],[113,-22],[113,-20],[113,-18],[113,-16],[113,-14],[113,-12]] }
];

/**
 * Major cities worldwide (population >1M, highly simplified selection).
 * @type {Array<{name: string, lat: number, lon: number, pop: number}>}
 */
export const MAJOR_CITIES = [
  // Americas
  { name: 'New York', lat: 40.7, lon: -74.0, pop: 8.3 },
  { name: 'Los Angeles', lat: 34.1, lon: -118.2, pop: 4.0 },
  { name: 'Chicago', lat: 41.9, lon: -87.6, pop: 2.7 },
  { name: 'Toronto', lat: 43.7, lon: -79.4, pop: 2.9 },
  { name: 'Mexico City', lat: 19.4, lon: -99.1, pop: 21.6 },
  { name: 'São Paulo', lat: -23.6, lon: -46.7, pop: 12.3 },
  { name: 'Rio de Janeiro', lat: -22.9, lon: -43.2, pop: 6.7 },
  { name: 'Buenos Aires', lat: -34.6, lon: -58.4, pop: 15.0 },
  { name: 'Lima', lat: -12.0, lon: -77.0, pop: 10.7 },
  { name: 'Bogotá', lat: 4.7, lon: -74.1, pop: 10.6 },
  
  // Europe
  { name: 'London', lat: 51.5, lon: -0.1, pop: 9.0 },
  { name: 'Paris', lat: 48.9, lon: 2.4, pop: 11.0 },
  { name: 'Berlin', lat: 52.5, lon: 13.4, pop: 3.7 },
  { name: 'Madrid', lat: 40.4, lon: -3.7, pop: 6.6 },
  { name: 'Rome', lat: 41.9, lon: 12.5, pop: 4.3 },
  { name: 'Moscow', lat: 55.8, lon: 37.6, pop: 12.5 },
  { name: 'Istanbul', lat: 41.0, lon: 29.0, pop: 15.5 },
  
  // Mediterranean & Balkans
  { name: 'Athens', lat: 38.0, lon: 23.7, pop: 3.2 },
  { name: 'Thessaloniki', lat: 40.6, lon: 22.9, pop: 1.1 },
  { name: 'Belgrade', lat: 44.8, lon: 20.5, pop: 1.7 },
  { name: 'Zagreb', lat: 45.8, lon: 16.0, pop: 0.8 },
  { name: 'Sarajevo', lat: 43.9, lon: 18.4, pop: 0.5 },
  { name: 'Sofia', lat: 42.7, lon: 23.3, pop: 1.3 },
  { name: 'Bucharest', lat: 44.4, lon: 26.1, pop: 2.1 },
  { name: 'Tirana', lat: 41.3, lon: 19.8, pop: 0.9 },
  { name: 'Skopje', lat: 42.0, lon: 21.4, pop: 0.5 },
  { name: 'Ljubljana', lat: 46.1, lon: 14.5, pop: 0.3 },
  { name: 'Podgorica', lat: 42.4, lon: 19.3, pop: 0.2 },
  { name: 'Split', lat: 43.5, lon: 16.4, pop: 0.2 },
  { name: 'Dubrovnik', lat: 42.6, lon: 18.1, pop: 0.04 },
  { name: 'Naples', lat: 40.8, lon: 14.3, pop: 3.1 },
  { name: 'Marseille', lat: 43.3, lon: 5.4, pop: 1.8 },
  { name: 'Valencia', lat: 39.5, lon: -0.4, pop: 1.6 },
  { name: 'Lisbon', lat: 38.7, lon: -9.1, pop: 2.9 },
  { name: 'Tunis', lat: 36.8, lon: 10.2, pop: 2.4 },
  { name: 'Algiers', lat: 36.8, lon: 3.1, pop: 3.4 },
  { name: 'Alexandria', lat: 31.2, lon: 29.9, pop: 5.2 },
  { name: 'Izmir', lat: 38.4, lon: 27.1, pop: 4.4 },
  { name: 'Ankara', lat: 39.9, lon: 32.9, pop: 5.6 },
  
  // Africa
  { name: 'Cairo', lat: 30.0, lon: 31.2, pop: 20.9 },
  { name: 'Lagos', lat: 6.5, lon: 3.4, pop: 14.4 },
  { name: 'Kinshasa', lat: -4.3, lon: 15.3, pop: 14.3 },
  { name: 'Johannesburg', lat: -26.2, lon: 28.0, pop: 5.6 },
  { name: 'Nairobi', lat: -1.3, lon: 36.8, pop: 4.4 },
  
  // Middle East
  { name: 'Tehran', lat: 35.7, lon: 51.4, pop: 8.9 },
  { name: 'Baghdad', lat: 33.3, lon: 44.4, pop: 7.7 },
  { name: 'Riyadh', lat: 24.7, lon: 46.7, pop: 7.0 },
  
  // South Asia
  { name: 'Delhi', lat: 28.7, lon: 77.2, pop: 30.3 },
  { name: 'Mumbai', lat: 19.1, lon: 72.9, pop: 20.4 },
  { name: 'Kolkata', lat: 22.6, lon: 88.4, pop: 14.9 },
  { name: 'Dhaka', lat: 23.8, lon: 90.4, pop: 21.0 },
  { name: 'Karachi', lat: 24.9, lon: 67.0, pop: 16.0 },
  
  // East Asia
  { name: 'Tokyo', lat: 35.7, lon: 139.7, pop: 37.4 },
  { name: 'Shanghai', lat: 31.2, lon: 121.5, pop: 27.1 },
  { name: 'Beijing', lat: 39.9, lon: 116.4, pop: 21.5 },
  { name: 'Seoul', lat: 37.6, lon: 127.0, pop: 25.6 },
  { name: 'Hong Kong', lat: 22.3, lon: 114.2, pop: 7.5 },
  { name: 'Bangkok', lat: 13.8, lon: 100.5, pop: 10.5 },
  { name: 'Singapore', lat: 1.3, lon: 103.8, pop: 5.7 },
  { name: 'Jakarta', lat: -6.2, lon: 106.8, pop: 10.6 },
  { name: 'Manila', lat: 14.6, lon: 121.0, pop: 13.9 },
  
  // Oceania
  { name: 'Sydney', lat: -33.9, lon: 151.2, pop: 5.3 },
  { name: 'Melbourne', lat: -37.8, lon: 145.0, pop: 5.0 },
  
  // Additional major cities
  { name: 'San Francisco', lat: 37.8, lon: -122.4, pop: 3.3 },
  { name: 'Miami', lat: 25.8, lon: -80.2, pop: 2.7 },
  { name: 'Vancouver', lat: 49.3, lon: -123.1, pop: 2.5 },
  { name: 'Montreal', lat: 45.5, lon: -73.6, pop: 4.1 },
  { name: 'Havana', lat: 23.1, lon: -82.4, pop: 2.1 },
  { name: 'Santiago', lat: -33.5, lon: -70.7, pop: 6.7 },
  { name: 'Barcelona', lat: 41.4, lon: 2.2, pop: 5.6 },
  { name: 'Amsterdam', lat: 52.4, lon: 4.9, pop: 2.4 },
  { name: 'Vienna', lat: 48.2, lon: 16.4, pop: 1.9 },
  { name: 'Warsaw', lat: 52.2, lon: 21.0, pop: 1.8 },
  { name: 'Dubai', lat: 25.3, lon: 55.3, pop: 3.3 },
  { name: 'Tel Aviv', lat: 32.1, lon: 34.8, pop: 4.2 },
  { name: 'Bangalore', lat: 12.9, lon: 77.6, pop: 12.3 },
  { name: 'Chennai', lat: 13.1, lon: 80.3, pop: 10.7 },
  { name: 'Lahore', lat: 31.5, lon: 74.3, pop: 11.1 },
  { name: 'Guangzhou', lat: 23.1, lon: 113.3, pop: 14.5 },
  { name: 'Shenzhen', lat: 22.5, lon: 114.1, pop: 12.5 },
  { name: 'Chongqing', lat: 29.6, lon: 106.6, pop: 15.3 },
  { name: 'Tianjin', lat: 39.1, lon: 117.2, pop: 13.9 },
  { name: 'Osaka', lat: 34.7, lon: 135.5, pop: 19.3 },
  { name: 'Ho Chi Minh', lat: 10.8, lon: 106.7, pop: 8.6 },
  { name: 'Hanoi', lat: 21.0, lon: 105.8, pop: 8.0 },
  { name: 'Kuala Lumpur', lat: 3.1, lon: 101.7, pop: 7.6 },
  { name: 'Perth', lat: -31.9, lon: 115.9, pop: 2.1 },
  { name: 'Brisbane', lat: -27.5, lon: 153.0, pop: 2.5 },
  { name: 'Auckland', lat: -36.8, lon: 174.8, pop: 1.5 }
];

/**
 * Major country borders (simplified polygons for labeling).
 * Centroids are approximate label positions.
 * @type {Array<{name: string, centroid: [number, number]}>}
 */
export const COUNTRIES = [
  { name: 'USA', centroid: [-98, 39] },
  { name: 'Canada', centroid: [-106, 56] },
  { name: 'Mexico', centroid: [-102, 23] },
  { name: 'Brazil', centroid: [-51, -10] },
  { name: 'Argentina', centroid: [-64, -34] },
  { name: 'Chile', centroid: [-71, -30] },
  { name: 'Colombia', centroid: [-72, 4] },
  { name: 'Peru', centroid: [-75, -9] },
  { name: 'Venezuela', centroid: [-66, 7] },
  { name: 'UK', centroid: [-2, 54] },
  { name: 'France', centroid: [2, 47] },
  { name: 'Germany', centroid: [10, 51] },
  { name: 'Spain', centroid: [-4, 40] },
  { name: 'Italy', centroid: [13, 42] },
  { name: 'Poland', centroid: [20, 52] },
  { name: 'Russia', centroid: [100, 60] },
  { name: 'Turkey', centroid: [35, 39] },
  
  // Balkans & Eastern Europe
  { name: 'Greece', centroid: [22, 39] },
  { name: 'Serbia', centroid: [21, 44] },
  { name: 'Croatia', centroid: [16, 45] },
  { name: 'Bosnia', centroid: [18, 44] },
  { name: 'Albania', centroid: [20, 41] },
  { name: 'Bulgaria', centroid: [25, 43] },
  { name: 'Romania', centroid: [25, 46] },
  { name: 'N. Macedonia', centroid: [22, 42] },
  { name: 'Montenegro', centroid: [19, 43] },
  { name: 'Slovenia', centroid: [15, 46] },
  { name: 'Hungary', centroid: [20, 47] },
  { name: 'Austria', centroid: [14, 48] },
  { name: 'Czech Rep.', centroid: [15, 50] },
  { name: 'Slovakia', centroid: [19, 49] },
  { name: 'Ukraine', centroid: [32, 49] },
  
  // Mediterranean
  { name: 'Portugal', centroid: [-8, 40] },
  { name: 'Tunisia', centroid: [9, 34] },
  { name: 'Libya', centroid: [17, 27] },
  { name: 'Egypt', centroid: [30, 27] },
  { name: 'South Africa', centroid: [25, -29] },
  { name: 'Nigeria', centroid: [8, 10] },
  { name: 'Kenya', centroid: [38, 1] },
  { name: 'Ethiopia', centroid: [39, 8] },
  { name: 'DRC', centroid: [22, -3] },
  { name: 'Algeria', centroid: [3, 28] },
  { name: 'Morocco', centroid: [-7, 32] },
  { name: 'Iran', centroid: [54, 32] },
  { name: 'Saudi Arabia', centroid: [45, 24] },
  { name: 'Iraq', centroid: [44, 33] },
  { name: 'India', centroid: [79, 22] },
  { name: 'Pakistan', centroid: [69, 30] },
  { name: 'Bangladesh', centroid: [90, 24] },
  { name: 'China', centroid: [105, 35] },
  { name: 'Japan', centroid: [138, 36] },
  { name: 'South Korea', centroid: [128, 37] },
  { name: 'Thailand', centroid: [101, 15] },
  { name: 'Vietnam', centroid: [106, 16] },
  { name: 'Indonesia', centroid: [118, -2] },
  { name: 'Philippines', centroid: [122, 12] },
  { name: 'Malaysia', centroid: [102, 4] },
  { name: 'Australia', centroid: [133, -27] },
  { name: 'New Zealand', centroid: [174, -41] }
];
