process.env.NODE_ENV = 'test';
const request = require('supertest');
const express = require('express');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const repoRouter = require('../routes/repo');

const app = express();
app.use(express.json());
app.use('/api/repo', repoRouter);

async function waitForRepoReady(repoId) {
    return new Promise(resolve => {
        const interval = setInterval(async () => {
            const r = await prisma.repo.findUnique({ where: { id: repoId } });
            if (r.status === 'ready' || r.status === 'error') {
                clearInterval(interval);
                resolve(r.status);
            }
        }, 1000);
    });
}

async function runTests() {
    console.log("=== GROUND TRUTH VALIDATION SUITE ===");

    // Clean DB
    await prisma.file.deleteMany({});
    await prisma.repo.deleteMany({});
    await prisma.symbol.deleteMany({});

    console.log("Indexing repo-auth...");
    const authRes = await request(app)
        .post('/api/repo/index-local')
        .send({
            localPath: path.join(__dirname, 'golden-repos/repo-auth'),
            name: 'repo-auth'
        });
    const authRepoId = authRes.body.id;
    const authStatus = await waitForRepoReady(authRepoId);
    if (authStatus !== 'ready') throw new Error('Failed to index repo-auth');

    console.log("Indexing repo-ecommerce...");
    const ecomRes = await request(app)
        .post('/api/repo/index-local')
        .send({
            localPath: path.join(__dirname, 'golden-repos/repo-ecommerce'),
            name: 'repo-ecommerce'
        });
    const ecomRepoId = ecomRes.body.id;
    const ecomStatus = await waitForRepoReady(ecomRepoId);
    if (ecomStatus !== 'ready') throw new Error('Failed to index repo-ecommerce');

    let passed = 0;
    let failed = 0;

    const assert = (condition, msg) => {
        if (condition) {
            console.log(`✅ ${msg}`);
            passed++;
        } else {
            console.error(`❌ ${msg}`);
            failed++;
        }
    };

    // TESTS FOR REPO-AUTH
    console.log("\n--- Testing repo-auth ---");
    
    // Test 1: whoCalls('login') -> ['loginController']
    let res = await request(app).get(`/api/repo/${authRepoId}/graph/query?type=upstream&symbol=login`);
    let resultNames = res.body.results.map(r => r.name);
    assert(resultNames.includes('loginController'), "whoCalls('login') returns 'loginController'");

    // Test 2: routesReaching('jwtUtils') -> ['POST /login', 'GET /profile']
    // Wait, the symbol name is the module 'jwtUtils.js' or one of its functions like 'verify' or 'signToken'
    res = await request(app).get(`/api/repo/${authRepoId}/graph/query?type=routes_reaching&symbol=verifyToken`);
    resultNames = res.body.results.map(r => r.name);
    assert(resultNames.includes('GET /profile') && resultNames.includes('POST /register'), "routesReaching('verifyToken') returns 'GET /profile', 'POST /register'");

    // Test 3: Middleware Chain Execution Order
    // GET /profile -> verifyToken -> profileController
    const routes = await prisma.symbol.findMany({ where: { repoId: authRepoId, type: 'route' } });
    const profileRoute = routes.find(r => r.name === 'GET /profile');
    if (profileRoute) {
        const firstCall = await prisma.symbolRelationship.findFirst({ where: { callerId: profileRoute.id }, include: { callee: true } });
        assert(firstCall && firstCall.callee.name === 'verifyToken', "Middleware chain starts with verifyToken");
        
        if (firstCall) {
            const secondCall = await prisma.symbolRelationship.findFirst({ where: { callerId: firstCall.callee.id, executionOrder: 1 }, include: { callee: true } });
            assert(secondCall && secondCall.callee.name === 'profileController', "Middleware chain continues to profileController");
        } else {
            assert(false, "Middleware chain continues to profileController");
        }
    } else {
        assert(false, "GET /profile route not found");
    }

    // Test 4: Qualified Name validation
    const loginSym = await prisma.symbol.findFirst({ where: { repoId: authRepoId, name: 'login', type: 'function' } });
    assert(loginSym && loginSym.qualifiedName.endsWith('authService.js#login'), "qualifiedName for login in authService is correct");

    // TESTS FOR REPO-ECOMMERCE
    console.log("\n--- Testing repo-ecommerce ---");

    // Test 5: External Dependency Detection (stripe)
    const extSym = await prisma.symbol.findFirst({ where: { repoId: ecomRepoId, name: 'stripe' } });
    assert(extSym && extSym.isExternal === true, "Symbol 'stripe' is marked as external_service");

    // Test 6: Import relation to external
    if (extSym) {
        const imp = await prisma.symbolRelationship.findFirst({
            where: { calleeId: extSym.id, relationship: 'imports' },
            include: { caller: true }
        });
        assert(imp && imp.caller.name === 'paymentService.js', "paymentService IMPORTS external 'stripe'");
    } else {
        assert(false, "External symbol 'stripe' not found");
    }

    console.log(`\nResults: ${passed} passed, ${failed} failed.`);
    process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(e => {
    console.error(e);
    process.exit(1);
});
