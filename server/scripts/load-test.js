/* eslint-disable no-console */
const autocannon = require('autocannon');
const http = require('http');

const BASE_URL = process.env.LOAD_TEST_BASE_URL || 'http://localhost:5000';
const CONCURRENCIES = (process.env.LOAD_TEST_CONCURRENCIES || '100,250')
  .split(',')
  .map((value) => Number.parseInt(value.trim(), 10))
  .filter((value) => Number.isFinite(value) && value > 0);
const DURATION_SEC = Number.parseInt(process.env.LOAD_TEST_DURATION_SEC || '20', 10);

const randomEmail = () => `loadtest_${Date.now()}_${Math.floor(Math.random() * 10000)}@example.com`;

const requestJson = (method, path, payload, cookie = '') => {
  return new Promise((resolve, reject) => {
    const body = payload ? JSON.stringify(payload) : '';
    const req = http.request(
      `${BASE_URL}${path}`,
      {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
          ...(cookie ? { Cookie: cookie } : {}),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: data ? JSON.parse(data) : {}, headers: res.headers });
          } catch (error) {
            reject(error);
          }
        });
      }
    );

    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
};

const runAuto = (title, options) => {
  return new Promise((resolve, reject) => {
    console.log(`\n=== ${title} ===`);
    autocannon(options, (error, result) => {
      if (error) {
        reject(error);
        return;
      }

      const toNumber = (value) => (Number.isFinite(value) ? Number(value.toFixed(2)) : null);
      const latencyP95 = result.latency?.p95 ?? result.latency?.['95'] ?? null;
      const latencyP99 = result.latency?.p99 ?? result.latency?.['99'] ?? null;

      console.log(
        JSON.stringify(
          {
            title,
            requestsPerSec: toNumber(result.requests?.average),
            latencyAverageMs: toNumber(result.latency?.average),
            latencyP95Ms: toNumber(latencyP95),
            latencyP99Ms: toNumber(latencyP99),
            non2xx: result.non2xx,
            errors: result.errors,
            timeouts: result.timeouts,
            bytesPerSec: toNumber(result.throughput?.average),
          },
          null,
          2
        )
      );

      resolve(result);
    });
  });
};

const main = async () => {
  const email = randomEmail();
  const password = 'loadtest-pass-123';

  const registerResponse = await requestJson('POST', '/api/auth/register', {
    name: 'Load Test Student',
    email,
    password,
    role: 'student',
  });

  if (registerResponse.status !== 201) {
    throw new Error(`Failed to register load-test user: ${registerResponse.status}`);
  }

  const loginResponse = await requestJson('POST', '/api/auth/login', {
    email,
    password,
  });

  if (loginResponse.status !== 200) {
    throw new Error(`Failed to login load-test user: ${loginResponse.status}`);
  }

  const cookie = loginResponse.headers['set-cookie']?.[0]?.split(';')?.[0];
  if (!cookie) {
    throw new Error('No auth cookie received from login response.');
  }

  console.log(`Using concurrencies: ${CONCURRENCIES.join(', ')} | duration: ${DURATION_SEC}s`);

  for (const connections of CONCURRENCIES) {
    await runAuto(`health-read-${connections}`, {
      url: `${BASE_URL}/api/health`,
      connections,
      duration: DURATION_SEC,
      pipelining: 1,
    });

    await runAuto(`dashboard-auth-read-${connections}`, {
      url: `${BASE_URL}/api/dashboard/summary`,
      method: 'GET',
      connections,
      duration: DURATION_SEC,
      headers: { Cookie: cookie },
    });

    await runAuto(`mixed-records-read-${connections}`, {
      url: `${BASE_URL}/api/projects?page=1&pageSize=10`,
      method: 'GET',
      connections,
      duration: DURATION_SEC,
      headers: { Cookie: cookie },
    });
  }
};

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
