import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { BASE_URL, getAuthHeaders } from './config.js';

// Custom metrics
const errorRate = new Rate('errors');
const salesReportDuration = new Trend('sales_report_duration');

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
    sales_report_duration: ['p(95)<5000'],
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

  // Test 1: Sales by customer report (last 30 days)
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const startDate = thirtyDaysAgo.toISOString().split('T')[0];
  const endDate = now.toISOString().split('T')[0];

  const startReport = Date.now();
  const salesByCustomerRes = http.get(
    `${BASE_URL}/reports/sales-by-customer?startDate=${startDate}&endDate=${endDate}`,
    headers,
  );
  salesReportDuration.add(Date.now() - startReport);

  check(salesByCustomerRes, {
    'sales by customer returns 200': (r) => r.status === 200,
    'sales by customer has data': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.data !== undefined || Array.isArray(body);
      } catch {
        return false;
      }
    },
  });

  errorRate.add(salesByCustomerRes.status !== 200);
  sleep(1);

  // Test 2: Sales by customer report (last 90 days, larger dataset)
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  const startDate90 = ninetyDaysAgo.toISOString().split('T')[0];

  const startReport90 = Date.now();
  const salesRes90 = http.get(
    `${BASE_URL}/reports/sales-by-customer?startDate=${startDate90}&endDate=${endDate}`,
    headers,
  );
  salesReportDuration.add(Date.now() - startReport90);

  check(salesRes90, {
    'sales 90-day report returns 200': (r) => r.status === 200,
  });

  errorRate.add(salesRes90.status !== 200);
  sleep(1);

  // Test 3: Export sales by customer as CSV
  const exportRes = http.get(
    `${BASE_URL}/reports/sales-by-customer/export?format=csv&startDate=${startDate}&endDate=${endDate}`,
    headers,
  );

  check(exportRes, {
    'sales report export returns 200': (r) => r.status === 200,
  });

  errorRate.add(exportRes.status !== 200);
  sleep(0.5);

  // Test 4: Sales by customer with pagination
  const paginatedRes = http.get(
    `${BASE_URL}/reports/sales-by-customer?startDate=${startDate}&endDate=${endDate}&page=1&limit=10`,
    headers,
  );

  check(paginatedRes, {
    'paginated sales report returns 200': (r) => r.status === 200,
  });

  errorRate.add(paginatedRes.status !== 200);
  sleep(0.5);
}
