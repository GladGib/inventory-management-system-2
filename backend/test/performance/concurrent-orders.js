import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Counter, Trend } from 'k6/metrics';
import { SharedArray } from 'k6/data';
import { BASE_URL, getAuthHeaders } from './config.js';

// Custom metrics
const errorRate = new Rate('errors');
const ordersCreated = new Counter('orders_created');
const orderCreationDuration = new Trend('order_creation_duration');

export const options = {
  scenarios: {
    concurrent_orders: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '15s', target: 10 },  // Ramp up to 10 concurrent users
        { duration: '30s', target: 10 },   // Hold at 10
        { duration: '15s', target: 25 },   // Ramp up to 25
        { duration: '30s', target: 25 },   // Hold at 25
        { duration: '15s', target: 50 },   // Spike to 50 concurrent users
        { duration: '30s', target: 50 },   // Hold at 50
        { duration: '15s', target: 0 },    // Ramp down
      ],
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<5000'],      // 95% of requests under 5s
    http_req_failed: ['rate<0.05'],          // Less than 5% HTTP errors
    errors: ['rate<0.1'],                    // Custom error rate under 10%
    order_creation_duration: ['p(95)<4000'], // 95% of order creations under 4s
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

  // Fetch available customers
  const customersRes = http.get(`${BASE_URL}/customers?limit=50`, getAuthHeaders(token));
  let customers = [];
  if (customersRes.status === 200) {
    try {
      const body = JSON.parse(customersRes.body);
      customers = body.data || body.items || body || [];
    } catch {
      customers = [];
    }
  }

  // Fetch available items
  const itemsRes = http.get(`${BASE_URL}/items?limit=50`, getAuthHeaders(token));
  let items = [];
  if (itemsRes.status === 200) {
    try {
      const body = JSON.parse(itemsRes.body);
      items = body.data || body.items || body || [];
    } catch {
      items = [];
    }
  }

  return { token, customers, items };
}

export default function (data) {
  const { token, customers, items } = data;
  const headers = getAuthHeaders(token);

  // Build order payload from available data
  const customerId =
    customers.length > 0
      ? customers[Math.floor(Math.random() * customers.length)].id
      : undefined;

  const orderItems = [];
  if (items.length > 0) {
    // Pick 1-3 random items for the order
    const itemCount = Math.floor(Math.random() * 3) + 1;
    const shuffled = items.sort(() => 0.5 - Math.random());
    for (let i = 0; i < Math.min(itemCount, shuffled.length); i++) {
      orderItems.push({
        itemId: shuffled[i].id,
        quantity: Math.floor(Math.random() * 5) + 1,
      });
    }
  }

  const orderPayload = JSON.stringify({
    customerId,
    items: orderItems,
    notes: `Load test order - VU ${__VU} Iter ${__ITER}`,
  });

  // Create order
  const startTime = Date.now();
  const createRes = http.post(`${BASE_URL}/sales-orders`, orderPayload, headers);
  const duration = Date.now() - startTime;
  orderCreationDuration.add(duration);

  const isSuccess = createRes.status === 200 || createRes.status === 201;

  check(createRes, {
    'order created successfully': (r) => r.status === 200 || r.status === 201,
    'order response has id': (r) => {
      try {
        const body = JSON.parse(r.body);
        return (body.data?.id || body.id) !== undefined;
      } catch {
        return false;
      }
    },
    'response time under 4s': () => duration < 4000,
  });

  if (isSuccess) {
    ordersCreated.add(1);
  }

  errorRate.add(!isSuccess);
  sleep(Math.random() * 2 + 0.5); // Random sleep 0.5-2.5s

  // Periodically fetch order list to simulate mixed read/write load
  if (__ITER % 3 === 0) {
    const listRes = http.get(`${BASE_URL}/sales-orders?page=1&limit=10`, headers);
    check(listRes, {
      'order list returns 200': (r) => r.status === 200,
    });
    errorRate.add(listRes.status !== 200);
    sleep(0.5);
  }
}
