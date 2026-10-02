import { buildApp } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';

async function testAuthRbac() {
  console.log('🧪 Starting Auth & RBAC Verification Tests...');
  const app = await buildApp();
  await app.ready();

  let adminToken = '';
  let userToken = '';
  let createdUserId = '';

  // 1. Test Admin Login
  console.log('\n--- 1. Testing Admin Login ---');
  const adminLoginRes = await app.inject({
    method: 'POST',
    url: '/auth/login',
    payload: {
      email: 'admin@eshub.local',
      password: 'Admin1234!'
    }
  });

  console.log('Status:', adminLoginRes.statusCode);
  const adminLoginBody = adminLoginRes.json();
  if (adminLoginRes.statusCode === 200 && adminLoginBody.token) {
    adminToken = adminLoginBody.token;
    console.log('✅ Admin login succeeded! Role:', adminLoginBody.user.role);
  } else {
    console.error('❌ Admin login failed:', adminLoginBody);
    process.exit(1);
  }

  // 2. Test GET /auth/me with Admin Token
  console.log('\n--- 2. Testing GET /auth/me (Admin) ---');
  const adminMeRes = await app.inject({
    method: 'GET',
    url: '/auth/me',
    headers: {
      authorization: `Bearer ${adminToken}`
    }
  });
  console.log('Status:', adminMeRes.statusCode, adminMeRes.json());
  if (adminMeRes.statusCode === 200) {
    console.log('✅ GET /auth/me succeeded for Admin');
  } else {
    console.error('❌ GET /auth/me failed for Admin');
    process.exit(1);
  }

  // 3. Test Admin Creating Normal User
  console.log('\n--- 3. Testing Admin Provisioning New User ---');
  const testUserEmail = `borrower_${Date.now()}@eshub.local`;
  const createUserRes = await app.inject({
    method: 'POST',
    url: '/users',
    headers: {
      authorization: `Bearer ${adminToken}`
    },
    payload: {
      name: 'Jane Doe',
      email: testUserEmail,
      role: 'USER'
    }
  });
  console.log('Status:', createUserRes.statusCode);
  const createUserBody = createUserRes.json();
  if (createUserRes.statusCode === 201) {
    createdUserId = createUserBody.data.id;
    console.log('✅ User created by admin! Email:', testUserEmail, 'mustChangePassword:', createUserBody.data.mustChangePassword);
  } else {
    console.error('❌ User creation failed:', createUserBody);
    process.exit(1);
  }

  // 4. Test Normal User Login with Default Password
  console.log('\n--- 4. Testing User Login with Default Password (User1234!) ---');
  const userLoginRes = await app.inject({
    method: 'POST',
    url: '/auth/login',
    payload: {
      email: testUserEmail,
      password: 'User1234!'
    }
  });
  console.log('Status:', userLoginRes.statusCode);
  const userLoginBody = userLoginRes.json();
  if (userLoginRes.statusCode === 200 && userLoginBody.token) {
    userToken = userLoginBody.token;
    console.log('✅ User login succeeded with default password! Role:', userLoginBody.user.role);
  } else {
    console.error('❌ User login failed:', userLoginBody);
    process.exit(1);
  }

  // 5. Test Normal User Forbidden Action (Creating Instrument)
  console.log('\n--- 5. Testing RBAC: Normal User Attempting Admin Action ---');
  const forbiddenRes = await app.inject({
    method: 'POST',
    url: '/instruments',
    headers: {
      authorization: `Bearer ${userToken}`
    },
    payload: {
      name: 'Unauthorized Oscilloscope'
    }
  });
  console.log('Status:', forbiddenRes.statusCode, forbiddenRes.json());
  if (forbiddenRes.statusCode === 403) {
    console.log('✅ RBAC Guard passed: Standard user correctly blocked with 403 Forbidden!');
  } else {
    console.error('❌ Expected 403 Forbidden, got:', forbiddenRes.statusCode);
    process.exit(1);
  }

  // 6. Test User Changing Their Own Password
  console.log('\n--- 6. Testing User Changing Password ---');
  const changePwdRes = await app.inject({
    method: 'POST',
    url: '/auth/change-password',
    headers: {
      authorization: `Bearer ${userToken}`
    },
    payload: {
      currentPassword: 'User1234!',
      newPassword: 'MyNewSecretPassword2026!'
    }
  });
  console.log('Status:', changePwdRes.statusCode, changePwdRes.json());
  if (changePwdRes.statusCode === 200) {
    console.log('✅ Password changed successfully!');
  } else {
    console.error('❌ Password change failed');
    process.exit(1);
  }

  // 7. Test Login with New Password
  console.log('\n--- 7. Testing Login with New Password ---');
  const newLoginRes = await app.inject({
    method: 'POST',
    url: '/auth/login',
    payload: {
      email: testUserEmail,
      password: 'MyNewSecretPassword2026!'
    }
  });
  console.log('Status:', newLoginRes.statusCode);
  if (newLoginRes.statusCode === 200) {
    console.log('✅ Login with new password succeeded! mustChangePassword:', newLoginRes.json().user.mustChangePassword);
  } else {
    console.error('❌ Login with new password failed');
    process.exit(1);
  }

  // 8. Test Hardware Endpoints (Public)
  console.log('\n--- 8. Testing Hardware / Public Endpoints ---');
  const timeRes = await app.inject({
    method: 'GET',
    url: '/time'
  });
  console.log('GET /time status:', timeRes.statusCode, timeRes.body);
  if (timeRes.statusCode === 200) {
    console.log('✅ Hardware endpoint /time accessible without auth token!');
  } else {
    console.error('❌ /time failed');
    process.exit(1);
  }

  // Cleanup test user
  if (createdUserId) {
    await prisma.user.delete({ where: { id: createdUserId } });
  }

  await app.close();
  await prisma.$disconnect();
  console.log('\n🎉 ALL BACKEND AUTH & RBAC TESTS PASSED SUCCESSFULLY!\n');
  process.exit(0);
}

testAuthRbac().catch(async (err) => {
  console.error('Test error:', err);
  await prisma.$disconnect();
  process.exit(1);
});
