/* eslint-disable strict */
const express = require('express');
const uuid = require('uuid/v4');
const { isWebUri } = require('valid-url');
const logger = require('../logger');
const store = require('../store');
const LeafService = require('./leaf-service');
const AuthService = require('./auth-service');
const bcrypt = require('bcryptjs');
const LeafRouter = express.Router();
const bodyParser = express.json();
const { requireAuth } = require('./jwt-auth');
const xss = require('xss');

const serializeLeaf = leaf => ({
  id: leaf.id,
  title: leaf.name,
  lat: leaf.lat,
  long: leaf.long,
  zip: leaf.zip,
  address: leaf.address,
  telephone: leaf.telephone,
  owned: leaf.owned,
  owner_id: leaf.owner_id,
  description: leaf.description
});

const serializeUser = (user, token) => ({
  id: user.id,
  username: user.username,
  email: user.email,
  token:token,
  shop_id: user.shop_id
});

const serializeShop = shop => ({
  name: shop.name,
  address: shop.address,
  telephone: shop.telephone,
  zip:shop.zip,
  url: shop.url,
  owned: shop.owned,
  owner_id: shop.owner_id,
  description: shop.description,
  statecode: shop.statecode
});

LeafRouter
  .route('/api/login')
  .post(bodyParser, (req, res) => {
    // TODO: update to use db
    for (const field of ['password', 'username']) {
      if (!req.body[field]) {
        logger.error(`${field} is required`);
        return res.status(400).send(`'${field}' is required`);
      }
    }

    const { username, password } = req.body;
    AuthService.getUserWithUserName(req.app.get('db'), username).then(user => {
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized request1' });
      }
      return bcrypt.compare(password, user.password)
        .then(passwordsMatch => {
          if (!passwordsMatch) {
            return res.status(401).json({ error: 'Unauthorized request2' });
          }
          const sub = user.username;
          const payload = { id: user.id };
          const token = AuthService.createJwt(sub, payload);
          res.json(serializeUser(user, token));
        });
    });
  });

LeafRouter
  .route('/api/register')
  .post(bodyParser, (req, res) => {
    // TODO: update to use db
    for (const field of ['password', 'username', 'email']) {
      if (!req.body[field]) {
        logger.error(`${field} is required`);
        return res.status(400).send(`'${field}' is required`);
      }
    }
    const { username, password, email } = req.body;
    AuthService.findDuplicateUsers(req.app.get('db'), username, email)
      .then(user => {
        if (user)
          return res.status(400).send(`'username or email is taken`);
      });

    bcrypt.hash(password, 12).then(hash => {
      const user = { username, password:hash, email};
      AuthService.insertUser(req.app.get('db'), user);
    }
    );
  });

LeafRouter
  .route('/Leaf')
  .get((req, res, next) => {
    LeafService.getAllLeaf(req.app.get('db'))
      .then(Leaf => {
        res.json(Leaf.map(serializeLeaf));
      })
      .catch(next);
  })
  .post(bodyParser, (req, res) => {
    // TODO: update to use db
    for (const field of ['title', 'url', 'rating']) {
      if (!req.body[field]) {
        logger.error(`${field} is required`);
        return res.status(400).send(`'${field}' is required`);
      }
    }
    const { title, url, description, rating } = req.body;
    if (!isWebUri(url)) {
      logger.error(`Invalid url '${url}' supplied`);
      return res.status(400).send('\'url\' must be a valid URL');
    }
    const leaf = { id: uuid(), title, url, description, rating };
    store.Leaf.push(leaf);
    logger.info(`Leaf with id ${leaf.id} created`);

    res
      .status(201)
      .location(`http://localhost:8000/Leaf/${leaf.id}`)
      .json(leaf);
  });

LeafRouter
  .route('/api/claim').post(bodyParser, (req, res) => {
    let { id, name, telephone, url, zip, address, user, description, statecode, city } = req.body;
    AuthService.claimShop(req.app.get('db'), user.id, id).then(claimedshop => {
      name = xss(name);
      telephone= xss(telephone);
      url= xss(url);
      zip= xss(zip);
      statecode= xss(statecode);
      city= xss(city);
      address = xss(address);
      description = xss(description);
      const owner_id = user.id;
      const owned = 1;
      const shop = { id, name, telephone, url, zip, address, owned, owner_id, description, statecode, city };

      LeafService.updateShop(req.app.get('db'), id, serializeShop(shop)).then(shop => {
        AuthService.getUserWithUserName(req.app.get('db'), user.username).then(updatedUser => {

          const sub = updatedUser.username;
          const payload = { id: updatedUser.id, shop_id: updatedUser.shop_id };
          const token = AuthService.createJwt(sub, payload);
          res.json(serializeUser(updatedUser, token));
        });
      });
    });
  });




LeafRouter
  .route('/api/shop/')
  .patch(bodyParser, (req, res) => {
    let { id, name, telephone, url, zip, address, user, description, statecode, city } = req.body;
    name = xss(name);
    telephone= xss(telephone);
    url= xss(url);
    zip= xss(zip);
    statecode= xss(statecode);
    city= xss(city);
    address = xss(address);
    description = xss(description);
    const owner_id = user.id;
    const owned = 1;
    const shop = { id, name, telephone, url, zip, address, owned, owner_id, description, statecode, city };
   
    LeafService.updateShop(req.app.get('db'), id, serializeShop(shop)).then(returned => {
      res.status(201).json('1');
    });

  });


LeafRouter
  .route('/shop/:id')
  .get((req, res, next) => {
    const { id } = req.params;
    LeafService.getById(req.app.get('db'), id)
      .then(shop => {
        if (!shop) {
          logger.error(`shop with id ${id} not found.`);
          return res.status(404).json({
            error: { message: 'shop Not Found' }
          });
        }
        res.json(shop);
      })
      .catch(next);
  })
  .patch(bodyParser, (req, res) => {
    // TODO: update to use db
    const { id } = req.params;
    const { name, telephone, url, zip, address } = req.body;
    const shop = { name, telephone, url, zip, address };
   
    LeafService.updateShop(req.app.get('db'), id, serializeShop(shop)).then(shop => {
      res.json(shop);
    });
  })
  .delete((req, res) => {
    // TODO: update to use db
    const { leaf_id } = req.params;
    const LeafIndex = store.Leaf.findIndex(b => b.id === leaf_id);
    if (LeafIndex === -1) {
      logger.error(`leaf with id ${leaf_id} not found.`);
      return res
        .status(404)
        .send('leaf Not Found');
    }
    store.Leaf.splice(LeafIndex, 1);
    logger.info(`leaf with id ${leaf_id} deleted.`);
    res
      .status(204)
      .end();
  });

module.exports = LeafRouter;