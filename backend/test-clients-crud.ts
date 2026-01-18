import * as http from 'http';

const BASE_URL = 'http://localhost:3000';
let createdClientId: string | null = null;

interface HttpResponse {
  status: number;
  headers: http.IncomingHttpHeaders;
  body: any;
}

interface ClientData {
  name: string;
  description?: string;
}

interface UpdateClientData {
  name?: string;
  description?: string | null;
  active?: boolean;
}

// Helper function to make HTTP requests with retry
function makeRequest(
  method: string,
  path: string,
  data: any = null,
  retries: number = 2
): Promise<HttpResponse> {
  return new Promise((resolve, reject) => {
    const attempt = (retryCount: number) => {
      const url = new URL(path, BASE_URL);
      const options: http.RequestOptions = {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 5000,
      };

      const req = http.request(url, options, (res: http.IncomingMessage) => {
        let body = '';
        res.on('data', (chunk: Buffer) => {
          body += chunk.toString();
        });
        res.on('end', () => {
          try {
            const parsed = body ? JSON.parse(body) : {};
            resolve({
              status: res.statusCode || 500,
              headers: res.headers,
              body: parsed,
            });
          } catch (e) {
            resolve({
              status: res.statusCode || 500,
              headers: res.headers,
              body: body,
            });
          }
        });
      });

      req.on('error', (error: NodeJS.ErrnoException) => {
        if (
          retryCount > 0 &&
          (error.code === 'ECONNRESET' ||
            error.code === 'ECONNREFUSED' ||
            error.code === 'EPIPE')
        ) {
          console.log(
            `⚠️  Retry ${retries - retryCount + 1}/${retries} for ${method} ${path} (${error.code})...`
          );
          setTimeout(() => attempt(retryCount - 1), 1000);
        } else {
          console.error(
            `❌ Request failed for ${method} ${path}:`,
            error.code || error.message
          );
          reject(error);
        }
      });

      req.on('timeout', () => {
        req.destroy();
        if (retryCount > 0) {
          setTimeout(() => attempt(retryCount - 1), 500);
        } else {
          reject(new Error('Request timeout'));
        }
      });

      if (data) {
        req.write(JSON.stringify(data));
      }
      req.end();
    };

    attempt(retries);
  });
}

// Helper to add delay between requests
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Test functions
async function testHealth(): Promise<boolean> {
  console.log('\n=== Test 1: Health Check ===');
  try {
    const response = await makeRequest('GET', '/health');
    console.log(`Status: ${response.status}`);
    console.log(`Response:`, JSON.stringify(response.body, null, 2));
    return response.status === 200;
  } catch (error: any) {
    console.error('Error:', error.message || error);
    console.error('⚠️  Vérifiez que le serveur est bien démarré sur le port 3000');
    return false;
  }
}

async function testGetClients(): Promise<boolean> {
  console.log('\n=== Test 2: GET /api/admin/clients (List clients) ===');
  try {
    const response = await makeRequest('GET', '/api/admin/clients');
    console.log(`Status: ${response.status}`);
    console.log(`Response:`, JSON.stringify(response.body, null, 2));
    return response.status === 200 && response.body.success === true;
  } catch (error: any) {
    console.error('Error:', error.message);
    return false;
  }
}

async function testCreateClient(): Promise<boolean> {
  console.log('\n=== Test 3: POST /api/admin/clients (Create client) ===');
  try {
    const clientData: ClientData = {
      name: `Test Client ${Date.now()}`,
      description: 'Client créé par les tests automatiques',
    };
    const response = await makeRequest('POST', '/api/admin/clients', clientData);
    console.log(`Status: ${response.status}`);
    console.log(`Response:`, JSON.stringify(response.body, null, 2));

    if (
      response.status === 201 &&
      response.body.success &&
      response.body.data?.id
    ) {
      createdClientId = response.body.data.id;
      console.log(`✓ Client créé avec ID: ${createdClientId}`);
      return true;
    }
    return false;
  } catch (error: any) {
    console.error('Error:', error.message);
    return false;
  }
}

async function testCreateDuplicateClient(): Promise<boolean> {
  console.log(
    '\n=== Test 4: POST /api/admin/clients (Create duplicate - should fail) ==='
  );
  try {
    const uniqueName = `Duplicate Client Test ${Date.now()}`;
    const clientData: ClientData = {
      name: uniqueName,
      description: 'Test de duplication',
    };
    // Create first time
    await makeRequest('POST', '/api/admin/clients', clientData);
    await delay(200);
    // Try to create again with same name
    const response = await makeRequest('POST', '/api/admin/clients', clientData);
    console.log(`Status: ${response.status}`);
    console.log(`Response:`, JSON.stringify(response.body, null, 2));
    return response.status === 409 && response.body.success === false;
  } catch (error: any) {
    console.error('Error:', error.message);
    return false;
  }
}

async function testUpdateClient(): Promise<boolean> {
  console.log('\n=== Test 5: PUT /api/admin/clients/:id (Update client) ===');
  if (!createdClientId) {
    console.log('⚠ Skipped: No client ID available');
    return false;
  }
  try {
    const updateData: UpdateClientData = {
      name: 'Client Modifié',
      description: 'Description mise à jour',
    };
    const response = await makeRequest(
      'PUT',
      `/api/admin/clients/${createdClientId}`,
      updateData
    );
    console.log(`Status: ${response.status}`);
    console.log(`Response:`, JSON.stringify(response.body, null, 2));
    return response.status === 200 && response.body.success === true;
  } catch (error: any) {
    console.error('Error:', error.message);
    return false;
  }
}

async function testUpdateNonExistentClient(): Promise<boolean> {
  console.log(
    '\n=== Test 6: PUT /api/admin/clients/:id (Update non-existent - should fail) ==='
  );
  try {
    const updateData: UpdateClientData = { name: 'Test' };
    const response = await makeRequest(
      'PUT',
      '/api/admin/clients/99999',
      updateData
    );
    console.log(`Status: ${response.status}`);
    console.log(`Response:`, JSON.stringify(response.body, null, 2));
    return response.status === 404 && response.body.success === false;
  } catch (error: any) {
    console.error('Error:', error.message);
    return false;
  }
}

async function testGetClientsWithFilter(): Promise<boolean> {
  console.log(
    '\n=== Test 7: GET /api/admin/clients?active=true (Filter active) ==='
  );
  try {
    const response = await makeRequest(
      'GET',
      '/api/admin/clients?active=true'
    );
    console.log(`Status: ${response.status}`);
    console.log(`Response:`, JSON.stringify(response.body, null, 2));
    return response.status === 200 && response.body.success === true;
  } catch (error: any) {
    console.error('Error:', error.message);
    return false;
  }
}

async function testDeleteClient(): Promise<boolean> {
  console.log(
    '\n=== Test 8: DELETE /api/admin/clients/:id (Soft delete) ==='
  );
  if (!createdClientId) {
    console.log('⚠ Skipped: No client ID available');
    return false;
  }
  try {
    const response = await makeRequest(
      'DELETE',
      `/api/admin/clients/${createdClientId}`
    );
    console.log(`Status: ${response.status}`);
    console.log(`Response:`, JSON.stringify(response.body, null, 2));
    return response.status === 200 && response.body.success === true;
  } catch (error: any) {
    console.error('Error:', error.message);
    return false;
  }
}

async function testDeleteNonExistentClient(): Promise<boolean> {
  console.log(
    '\n=== Test 9: DELETE /api/admin/clients/:id (Delete non-existent - should fail) ==='
  );
  try {
    const response = await makeRequest('DELETE', '/api/admin/clients/99999');
    console.log(`Status: ${response.status}`);
    console.log(`Response:`, JSON.stringify(response.body, null, 2));
    return response.status === 404 && response.body.success === false;
  } catch (error: any) {
    console.error('Error:', error.message);
    return false;
  }
}

async function testValidationError(): Promise<boolean> {
  console.log(
    '\n=== Test 10: POST /api/admin/clients (Validation error - empty name) ==='
  );
  try {
    const clientData: ClientData = {
      name: '',
      description: 'Test avec nom vide',
    };
    const response = await makeRequest('POST', '/api/admin/clients', clientData);
    console.log(`Status: ${response.status}`);
    console.log(`Response:`, JSON.stringify(response.body, null, 2));
    return response.status === 400 && response.body.success === false;
  } catch (error: any) {
    console.error('Error:', error.message);
    return false;
  }
}

// Run all tests
async function runTests(): Promise<void> {
  console.log('🚀 Démarrage des tests CRUD pour Clients API');
  console.log(`📍 Base URL: ${BASE_URL}`);

  const results: boolean[] = [];

  results.push(
    await testHealth().catch((e: any) => {
      console.error('Test 1 failed:', e.code || e.message);
      return false;
    })
  );
  await delay(500);

  results.push(
    await testGetClients().catch((e: any) => {
      console.error('Test 2 failed:', e.code || e.message);
      return false;
    })
  );
  await delay(500);

  results.push(
    await testCreateClient().catch((e: any) => {
      console.error('Test 3 failed:', e.code || e.message);
      return false;
    })
  );
  await delay(500);

  results.push(
    await testCreateDuplicateClient().catch((e: any) => {
      console.error('Test 4 failed:', e.code || e.message);
      return false;
    })
  );
  await delay(500);

  results.push(
    await testUpdateClient().catch((e: any) => {
      console.error('Test 5 failed:', e.code || e.message);
      return false;
    })
  );
  await delay(500);

  results.push(
    await testUpdateNonExistentClient().catch((e: any) => {
      console.error('Test 6 failed:', e.code || e.message);
      return false;
    })
  );
  await delay(500);

  results.push(
    await testGetClientsWithFilter().catch((e: any) => {
      console.error('Test 7 failed:', e.code || e.message);
      return false;
    })
  );
  await delay(500);

  results.push(
    await testDeleteClient().catch((e: any) => {
      console.error('Test 8 failed:', e.code || e.message);
      return false;
    })
  );
  await delay(500);

  results.push(
    await testDeleteNonExistentClient().catch((e: any) => {
      console.error('Test 9 failed:', e.code || e.message);
      return false;
    })
  );
  await delay(500);

  results.push(
    await testValidationError().catch((e: any) => {
      console.error('Test 10 failed:', e.code || e.message);
      return false;
    })
  );

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 RÉSUMÉ DES TESTS');
  console.log('='.repeat(50));
  const passed = results.filter((r) => r).length;
  const total = results.length;
  console.log(`✓ Tests réussis: ${passed}/${total}`);
  console.log(`✗ Tests échoués: ${total - passed}/${total}`);

  if (passed === total) {
    console.log('\n🎉 Tous les tests sont passés !');
    process.exit(0);
  } else {
    console.log('\n❌ Certains tests ont échoué.');
    process.exit(1);
  }
}

runTests().catch((error) => {
  console.error('Erreur fatale:', error);
  process.exit(1);
});

