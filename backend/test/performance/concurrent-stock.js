import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Counter, Trend } from 'k6/metrics';
import { BASE_URL, getAuthHeaders } from './config.js';

// Custom metrics
const errorRate = new Rate('errors');
const stockUpdatesCompleted = new Counter('stock_updates_completed');
const stockUpdateDuration = new Trend('stock_update_duration');
const conflictRate = new Rate('conflict_rate');

export const options = {
  scenarios: {
    concurrent_stock_updates: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '15s', target: 10 },  // Ramp up to 10 concurrent users
        { duration: '30s', target: 10 },   // Hold at 10
        { duration: '15s', target: 30 },   // Ramp up to 30
        { duration: '30s', target: 30 },   // Hold at 30
        { duration: '15s', target: 50 },   // Spike to 50 concurrent users
        { duration: '30s', target: 50 },   // Hold at 50
        { duration: '15s', target: 0 },    // Ramp down
      ],
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<3000'],         // 95% of requests under 3s
    http_req_failed: ['rate<0.1'],              // Less than 10% HTTP errors
    errors: ['rate<0.15'],                      // Custom error rate under 15%
    stock_update_duration: ['p(95)<3000'],      // 95% of stock updates under 3s
    conflict_rate: ['rate<0.3'],                // Conflict rate under 30% (expected under concurrency)
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

  // Fetch available items for stock updates
  const itemsRes = http.get(`${BASE_URL}/items?limit=100`, getAuthHeaders(token));
  let items = [];
  if (itemsRes.status === 200) {
    try {
      const body = JSON.parse(itemsRes.body);
      items = body.data || body.items || body || [];
    } catch {
      items = [];
    }
  }

  return { token, items };
}

export default function (data) {
  const { token, items } = data;
  const headers = getAuthHeaders(token);

  if (items.length === 0) {
    console.warn('No items available for stock updates');
    sleep(1);
    return;
  }

  // Pick a random item -- deliberately picking from a small pool to increase
  // contention and test concurrent access to the same records
  const poolSize = Math.min(5, items.length);
  const item = items[Math.floor(Math.random() * poolSize)];

  // Test 1: Stock adjustment (add stock)
  const adjustQuantity = Math.floor(Math.random() * 10) + 1;
  const adjustPayload = JSON.stringify({
    quantity: adjustQuantity,
    type: 'adjustment',
    reason: `Load test adjustment - VU ${__VU} Iter ${__ITER}`,
  });

  const startAdjust = Date.now();
  const adjustRes = http.post(
    `${BASE_URL}/items/${item.id}/stock-adjustments`,
    adjustPayload,
    headers,
  );
  const adjustDuration = Date.now() - startAdjust;
  stockUpdateDuration.add(adjustDuration);

  const adjustSuccess = adjustRes.status === 200 || adjustRes.status === 201;
  const isConflict = adjustRes.status === 409;

  check(adjustRes, {
    'stock adjustment accepted': (r) =>
      r.status === 200 || r.status === 201 || r.status === 409,
    'adjustment response time under 3s': () => adjustDuration < 3000,
  });

  if (adjustSuccess) {
    stockUpdatesCompleted.add(1);
  }

  conflictRate.add(isConflict);
  errorRate.add(!adjustSuccess && !isConflict);
  sleep(Math.random() + 0.5); // 0.5-1.5s

  // Test 2: Read current stock level (verify consistency)
  const stockRes = http.get(`${BASE_URL}/items/${item.id}`, headers);

  check(stockRes, {
    'item fetch returns 200': (r) => r.status === 200,
    'item has quantity field': (r) => {
      try {
        const body = JSON.parse(r.body);
        const itemData = body.data || body;
        return itemData.quantity !== undefined || itemData.stockQuantity !== undefined;
      } catch {
        return false;
      }
    },
  });

  errorRate.add(stockRes.status !== 200);
  sleep(Math.random() * 0.5 + 0.3);

  // Test 3: Bulk stock check (simulate warehouse scan)
  if (__ITER % 5 === 0) {
    const bulkItems = items.slice(0, Math.min(10, items.length));
    const bulkIds = bulkItems.map((i) => i.id).join(',');
    const bulkRes = http.get(`${BASE_URL}/items?ids=${bulkIds}`, headers);

    check(bulkRes, {
      'bulk stock check returns 200': (r) => r.status === 200,
    });

    errorRate.add(bulkRes.status !== 200);
    sleep(0.5);
  }
}
