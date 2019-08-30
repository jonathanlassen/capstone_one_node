'use strict';
const app = require('../src/app');

describe('App', () => {
  it('GET / responds with 404', () => {
    return supertest(app)
      .get('/')
      .expect(404);
  });
});