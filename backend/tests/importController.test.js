const test = require('node:test');
const assert = require('node:assert/strict');
const { buildImportedUserData } = require('../controllers/importController');

test('buildImportedUserData includes academy and sport context for imported users', () => {
    const userData = buildImportedUserData({
        name: 'Aarav Singh',
        email: 'aarav@example.com',
        password: 'Password123',
        type: 'athlete',
        batchRaw: 'U-19 Elite',
        phone: '9876543210',
        dob: '01/01/2008',
        reqUser: { sport: 'cricket', academyName: 'Elite Academy' },
    });

    assert.equal(userData.role, 'athlete');
    assert.equal(userData.sport, 'cricket');
    assert.equal(userData.academyName, 'Elite Academy');
    assert.equal(userData.batchAssigned, 'U-19 Elite');
    assert.equal(userData.phone, '9876543210');
});
