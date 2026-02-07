import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { BASE_URL, getAuthHeaders } from './config.js';

// Custom metrics
const errorRate = new Rate('errors');
const stockValuationDuration = new Trend('stock_valuation_duration');

export const options = {
  stages: [
    { duration: '30s', target: 5 },   // Ramp up to 5 users
    { duration: '1m', target: 10 },    // Stay at 10 users
    { duration: '30s', target: 20 },   // Ramp up to 20 users
    { duration: '1m', target: 20 },    // Stay at 20 users
    { duration: '30s', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<3000'],  // 95% of requests under 3s
    errors: ['rate<0.1'],               // Error rate under 10%
    stock_valuation_duration: ['p(95)<5000'],
  },
};

function authenticate() {
  const loginPayload = JSON.stringify({
    email: __ENV.TEST_EMAIL || 'admin@ims.local',
    password: __ENV.TEST_PASSWORD || 'Admin123!',
  });

  const loginRes = http.post(`${BASE_URL}/auth/login`, loginPayload, {
    headers: { 'Content-Type': 'application/json' },
  });

  check(loginRes, {
    'login successful': (r) => r.status === 200 || r.status === 201,
  });

  if (loginRes.status === 200 || loginRes.status === 201) {
    return JSON.parse(loginRes.body).data?.accessToken ||
           JSON.parse(loginRes.body).accessToken;
  }
  return null;
}

export function setup() {
  const token = authenticate();
  if (!token) {
    throw new Error('Authentication failed during setup');
  }
  return { token };
}

export default function (data) {
  const { token } = data;
  const headers = getAuthHeaders(token);

  // Test 1: Fetch stock valuation report (all items)
  const startAll = Date.now();
  const allItemsRes = http.get(`${BASE_URL}/reports/stock-valuation`, headers);
  stockValuationDuration.add(Date.now() - startAll);

  check(allItemsRes, {
    'stock valuation returns 200': (r) => r.status === 200,
    'stock valuation has data': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.data !== undefined || Array.isArray(body);
      } catch {
        return false;
      }
    },
  });

  errorRate.add(allItemsRes.status !== 200);
  sleep(1);

  // Test 2: Fetch stock valuation with category filter
  const startFiltered = Date.now();
  const filteredRes = http.get(
    `${BASE_URL}/reports/stock-valuation?category=electronics`,
    headers,
  );
  stockValuationDuration.add(Date.now() - startFiltered);

  check(filteredRes, {
    'filtered stock valuation returns 200': (r) => r.status === 200,
  });

  errorRate.add(filteredRes.status !== 200);
  sleep(1);

  // Test 3: Export stock valuation as CSV
  const exportRes = http.get(
    `${BASE_URL}/reports/stock-valuation/export?format=csv`,
    headers,
  );

  check(exportRes, {
    'stock valuation export returns 200': (r) => r.status === 200,
  });

  errorRate.add(exportRes.status !== 200);
  sleep(0.5);
}
