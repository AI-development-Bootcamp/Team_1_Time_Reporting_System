import * as http from 'http';

const BASE_URL = 'http://localhost:3000';
let createdProjectId: string | null = null;
let testClientId: string | null = null;
let testProjectManagerId: string | null = null;

interface HttpResponse {
  status: number;
  headers: http.IncomingHttpHeaders;
  body: any;
}

interface ProjectData {
  name: string;
  clientId: number;
  projectManagerId: number;
  startDate: string;
  endDate?: string | null;
  description?: string;
  reportingType?: 'duration' | 'startEnd';
}

interface UpdateProjectData {
  name?: string;
  clientId?: number;
  projectManagerId?: number;
  startDate?: string;
  endDate?: string | null;
  description?: string | null;
  reportingType?: 'duration' | 'startEnd';
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

async function testGetProjectsForSetup(): Promise<boolean> {
  console.log('\n=== Test 2: GET /api/admin/projects (Setup - Get test client and manager from existing projects) ===');
  try {
    const response = await makeRequest('GET', '/api/admin/projects');
    if (response.status === 200 && response.body.success && response.body.data.length > 0) {
      // Use first project's clientId and projectManagerId
      const firstProject = response.body.data[0];
      testClientId = firstProject.clientId;
      testProjectManagerId = firstProject.projectManagerId;
      console.log(`✓ Client ID trouvé: ${testClientId}`);
      console.log(`✓ Project Manager ID trouvé: ${testProjectManagerId}`);
      return true;
    }
    console.log('⚠ Aucun projet trouvé dans la base de données');
    return false;
  } catch (error: any) {
    console.error('Error:', error.message);
    return false;
  }
}

async function testGetProjects(): Promise<boolean> {
  console.log('\n=== Test 4: GET /api/admin/projects (List projects) ===');
  try {
    const response = await makeRequest('GET', '/api/admin/projects');
    console.log(`Status: ${response.status}`);
    console.log(`Response:`, JSON.stringify(response.body, null, 2));
    return response.status === 200 && response.body.success === true;
  } catch (error: any) {
    console.error('Error:', error.message);
    return false;
  }
}

async function testGetProjectsWithClientFilter(): Promise<boolean> {
  console.log('\n=== Test 5: GET /api/admin/projects?clientId=X (Filter by client) ===');
  if (!testClientId) {
    console.log('⚠ Skipped: No client ID available');
    return false;
  }
  try {
    const response = await makeRequest('GET', `/api/admin/projects?clientId=${testClientId}`);
    console.log(`Status: ${response.status}`);
    console.log(`Response:`, JSON.stringify(response.body, null, 2));
    
    // Verify all returned projects belong to the filtered client
    if (response.status === 200 && response.body.success) {
      const allMatch = response.body.data.every((project: any) => project.clientId === testClientId);
      console.log(`✓ All projects belong to client ${testClientId}: ${allMatch}`);
      return allMatch;
    }
    return false;
  } catch (error: any) {
    console.error('Error:', error.message);
    return false;
  }
}

async function testCreateProject(): Promise<boolean> {
  console.log('\n=== Test 6: POST /api/admin/projects (Create project) ===');
  if (!testClientId || !testProjectManagerId) {
    console.log('⚠ Skipped: Missing test client or project manager ID');
    return false;
  }
  try {
    const projectData: ProjectData = {
      name: `Test Project ${Date.now()}`,
      clientId: parseInt(testClientId),
      projectManagerId: parseInt(testProjectManagerId),
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      description: 'Project créé par les tests automatiques',
      reportingType: 'startEnd',
    };
    const response = await makeRequest('POST', '/api/admin/projects', projectData);
    console.log(`Status: ${response.status}`);
    console.log(`Response:`, JSON.stringify(response.body, null, 2));

    if (response.status === 500) {
      console.error('⚠️  Erreur 500: La migration Prisma pour reportingType n\'a peut-être pas été exécutée.');
      console.error('   Exécutez: npx prisma migrate dev --name add_reporting_type_to_projects');
      return false;
    }

    if (
      response.status === 201 &&
      response.body.success &&
      response.body.data?.id
    ) {
      createdProjectId = response.body.data.id;
      console.log(`✓ Project créé avec ID: ${createdProjectId}`);
      return true;
    }
    return false;
  } catch (error: any) {
    console.error('Error:', error.message);
    return false;
  }
}

async function testCreateProjectWithInvalidClient(): Promise<boolean> {
  console.log('\n=== Test 7: POST /api/admin/projects (Invalid client - should fail) ===');
  if (!testProjectManagerId) {
    console.log('⚠ Skipped: No project manager ID available');
    return false;
  }
  try {
    const projectData: ProjectData = {
      name: 'Test Project Invalid Client',
      clientId: 99999,
      projectManagerId: parseInt(testProjectManagerId),
      startDate: '2026-01-01',
    };
    const response = await makeRequest('POST', '/api/admin/projects', projectData);
    console.log(`Status: ${response.status}`);
    console.log(`Response:`, JSON.stringify(response.body, null, 2));
    return response.status === 404 && response.body.success === false;
  } catch (error: any) {
    console.error('Error:', error.message);
    return false;
  }
}

async function testCreateProjectWithInvalidManager(): Promise<boolean> {
  console.log('\n=== Test 8: POST /api/admin/projects (Invalid project manager - should fail) ===');
  if (!testClientId) {
    console.log('⚠ Skipped: No client ID available');
    return false;
  }
  try {
    const projectData: ProjectData = {
      name: 'Test Project Invalid Manager',
      clientId: parseInt(testClientId),
      projectManagerId: 99999,
      startDate: '2026-01-01',
    };
    const response = await makeRequest('POST', '/api/admin/projects', projectData);
    console.log(`Status: ${response.status}`);
    console.log(`Response:`, JSON.stringify(response.body, null, 2));
    return response.status === 404 && response.body.success === false;
  } catch (error: any) {
    console.error('Error:', error.message);
    return false;
  }
}

async function testUpdateProject(): Promise<boolean> {
  console.log('\n=== Test 9: PUT /api/admin/projects/:id (Update project) ===');
  if (!createdProjectId) {
    console.log('⚠ Skipped: No project ID available');
    return false;
  }
  try {
    const updateData: UpdateProjectData = {
      name: 'Project Modifié',
      description: 'Description mise à jour',
    };
    const response = await makeRequest(
      'PUT',
      `/api/admin/projects/${createdProjectId}`,
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

async function testUpdateNonExistentProject(): Promise<boolean> {
  console.log(
    '\n=== Test 10: PUT /api/admin/projects/:id (Update non-existent - should fail) ==='
  );
  try {
    const updateData: UpdateProjectData = { name: 'Test' };
    const response = await makeRequest(
      'PUT',
      '/api/admin/projects/99999',
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

async function testPatchToggleReportingType(): Promise<boolean> {
  console.log(
    '\n=== Test 11: PATCH /api/admin/projects/:id (Toggle reportingType) ==='
  );
  if (!createdProjectId) {
    console.log('⚠ Skipped: No project ID available');
    return false;
  }
  try {
    // First, get current reportingType from the list
    const getResponse = await makeRequest('GET', '/api/admin/projects');
    const project = getResponse.body.data?.find((p: any) => p.id === createdProjectId);
    const currentType = project?.reportingType || 'startEnd';
    console.log(`Current reportingType: ${currentType}`);

    // Toggle it
    const response = await makeRequest('PATCH', `/api/admin/projects/${createdProjectId}`, {});
    console.log(`Status: ${response.status}`);
    console.log(`Response:`, JSON.stringify(response.body, null, 2));

    if (response.status === 200 && response.body.success) {
      const newType = response.body.data.reportingType;
      const expectedType = currentType === 'startEnd' ? 'duration' : 'startEnd';
      const toggled = newType === expectedType;
      console.log(`✓ Toggled from ${currentType} to ${newType}: ${toggled}`);
      return toggled;
    }
    return false;
  } catch (error: any) {
    console.error('Error:', error.message);
    return false;
  }
}

async function testDeleteProject(): Promise<boolean> {
  console.log(
    '\n=== Test 12: DELETE /api/admin/projects/:id (Soft delete) ==='
  );
  if (!createdProjectId) {
    console.log('⚠ Skipped: No project ID available');
    return false;
  }
  try {
    const response = await makeRequest(
      'DELETE',
      `/api/admin/projects/${createdProjectId}`
    );
    console.log(`Status: ${response.status}`);
    console.log(`Response:`, JSON.stringify(response.body, null, 2));
    return response.status === 200 && response.body.success === true;
  } catch (error: any) {
    console.error('Error:', error.message);
    return false;
  }
}

async function testDeleteNonExistentProject(): Promise<boolean> {
  console.log(
    '\n=== Test 13: DELETE /api/admin/projects/:id (Delete non-existent - should fail) ==='
  );
  try {
    const response = await makeRequest('DELETE', '/api/admin/projects/99999');
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
    '\n=== Test 14: POST /api/admin/projects (Validation error - empty name) ==='
  );
  if (!testClientId || !testProjectManagerId) {
    console.log('⚠ Skipped: Missing test client or project manager ID');
    return false;
  }
  try {
    const projectData: any = {
      name: '',
      clientId: parseInt(testClientId),
      projectManagerId: parseInt(testProjectManagerId),
      startDate: '2026-01-01',
    };
    const response = await makeRequest('POST', '/api/admin/projects', projectData);
    console.log(`Status: ${response.status}`);
    console.log(`Response:`, JSON.stringify(response.body, null, 2));
    return response.status === 400 && response.body.success === false;
  } catch (error: any) {
    console.error('Error:', error.message);
    return false;
  }
}

async function testInvalidDateFormat(): Promise<boolean> {
  console.log(
    '\n=== Test 15: POST /api/admin/projects (Validation error - invalid date format) ==='
  );
  if (!testClientId || !testProjectManagerId) {
    console.log('⚠ Skipped: Missing test client or project manager ID');
    return false;
  }
  try {
    const projectData: any = {
      name: 'Test Project',
      clientId: parseInt(testClientId),
      projectManagerId: parseInt(testProjectManagerId),
      startDate: '01-01-2026', // Invalid format
    };
    const response = await makeRequest('POST', '/api/admin/projects', projectData);
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
  console.log('🚀 Démarrage des tests CRUD pour Projects API');
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
    await testGetProjectsForSetup().catch((e: any) => {
      console.error('Test 2 failed:', e.code || e.message);
      return false;
    })
  );
  await delay(500);

  results.push(
    await testGetProjects().catch((e: any) => {
      console.error('Test 3 failed:', e.code || e.message);
      return false;
    })
  );
  await delay(500);

  results.push(
    await testGetProjectsWithClientFilter().catch((e: any) => {
      console.error('Test 4 failed:', e.code || e.message);
      return false;
    })
  );
  await delay(500);

  results.push(
    await testCreateProject().catch((e: any) => {
      console.error('Test 5 failed:', e.code || e.message);
      return false;
    })
  );
  await delay(500);

  results.push(
    await testCreateProjectWithInvalidClient().catch((e: any) => {
      console.error('Test 6 failed:', e.code || e.message);
      return false;
    })
  );
  await delay(500);

  results.push(
    await testCreateProjectWithInvalidManager().catch((e: any) => {
      console.error('Test 7 failed:', e.code || e.message);
      return false;
    })
  );
  await delay(500);

  results.push(
    await testUpdateProject().catch((e: any) => {
      console.error('Test 8 failed:', e.code || e.message);
      return false;
    })
  );
  await delay(500);

  results.push(
    await testUpdateNonExistentProject().catch((e: any) => {
      console.error('Test 9 failed:', e.code || e.message);
      return false;
    })
  );
  await delay(500);

  results.push(
    await testPatchToggleReportingType().catch((e: any) => {
      console.error('Test 10 failed:', e.code || e.message);
      return false;
    })
  );
  await delay(500);

  results.push(
    await testDeleteProject().catch((e: any) => {
      console.error('Test 11 failed:', e.code || e.message);
      return false;
    })
  );
  await delay(500);

  results.push(
    await testDeleteNonExistentProject().catch((e: any) => {
      console.error('Test 12 failed:', e.code || e.message);
      return false;
    })
  );
  await delay(500);

  results.push(
    await testValidationError().catch((e: any) => {
      console.error('Test 13 failed:', e.code || e.message);
      return false;
    })
  );
  await delay(500);

  results.push(
    await testInvalidDateFormat().catch((e: any) => {
      console.error('Test 14 failed:', e.code || e.message);
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

