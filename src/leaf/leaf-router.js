const express = require('express')
const uuid = require('uuid/v4')
const { isWebUri } = require('valid-url')
const logger = require('../logger')
const store = require('../store')
const LeafService = require('./leaf-service')
const AuthService = require('./auth-service')
const bcrypt = require('bcryptjs')
const LeafRouter = express.Router();
const bodyParser = express.json()
const { requireAuth } = require('./jwt-auth')

const serializeLeaf = leaf => ({
  id: leaf.id,
  title: leaf.name,
  lat: leaf.lat,
  long: leaf.long,
})

const serializeUser = (user, token) => ({
  id: user.id,
  username: user.username,
  email: user.email,
  token:token
})

LeafRouter
  .route('/login')
  .post(bodyParser, (req, res) => {
    // TODO: update to use db
    for (const field of ['password', 'username']) {
      if (!req.body[field]) {
        logger.error(`${field} is required`)
        return res.status(400).send(`'${field}' is required`)
      }
    }

    const { username, password } = req.body;

    AuthService.getUserWithUserName(req.app.get('db'), username).then(user => {
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized request1' })
      }

      return bcrypt.compare(password, user.password)
            .then(passwordsMatch => {
              if (!passwordsMatch) {
                return res.status(401).json({ error: 'Unauthorized request2' })
              }
              const sub = user.username
              const payload = { id: user.id }
              const token = AuthService.createJwt(sub, payload);
              res.json(serializeUser(user, token))
            });
    });
  });

LeafRouter
  .route('/register')
  .post(bodyParser, (req, res) => {
    // TODO: update to use db
    for (const field of ['password', 'username']) {
      if (!req.body[field]) {
        logger.error(`${field} is required`)
        return res.status(400).send(`'${field}' is required`)
      }
    }
    // check for existing email/username
  
    const { username, password, email } = req.body;
    bcrypt.hash(password, 12).then(hash => {
        const user = { username, password:hash, email};
        AuthService.insertUser(req.app.get('db'), user);
    }
    );
  });

  LeafRouter
  .route('/claim')
  .post(bodyParser, (req, res) => {
    const { user, id } = req.body;
    console.log(user);
    AuthService.claimShop(req.app.get('db'), user, id);


  });



LeafRouter
  .route('/Leaf')
  .get((req, res, next) => {
    LeafService.getAllLeaf(req.app.get('db'))
      .then(Leaf => {
        res.json(Leaf.map(serializeLeaf))
      })
      .catch(next)
  })
  .post(bodyParser, (req, res) => {
    // TODO: update to use db
    for (const field of ['title', 'url', 'rating']) {
      if (!req.body[field]) {
        logger.error(`${field} is required`)
        return res.status(400).send(`'${field}' is required`)
      }
    }
    const { title, url, description, rating } = req.body

    if (!isWebUri(url)) {
      logger.error(`Invalid url '${url}' supplied`)
      return res.status(400).send(`'url' must be a valid URL`)
    }

    const leaf = { id: uuid(), title, url, description, rating }

    store.Leaf.push(leaf)

    logger.info(`Leaf with id ${leaf.id} created`)
    res
      .status(201)
      .location(`http://localhost:8000/Leaf/${leaf.id}`)
      .json(leaf)
  })

LeafRouter
  .route('/Leaf/:leaf_id')
  .get((req, res, next) => {
    const { leaf_id } = req.params
    LeafService.getById(req.app.get('db'), leaf_id)
      .then(leaf => {
        if (!leaf) {
          logger.error(`leaf with id ${leaf_id} not found.`)
          return res.status(404).json({
            error: { message: `leaf Not Found` }
          })
        }
        res.json(serializeleaf(leaf))
      })
      .catch(next)
  })
  .delete((req, res) => {
    // TODO: update to use db
    const { leaf_id } = req.params

    const LeafIndex = store.Leaf.findIndex(b => b.id === leaf_id)

    if (LeafIndex === -1) {
      logger.error(`leaf with id ${leaf_id} not found.`)
      return res
        .status(404)
        .send('leaf Not Found')
    }

    store.Leaf.splice(LeafIndex, 1)

    logger.info(`leaf with id ${leaf_id} deleted.`)
    res
      .status(204)
      .end()
  })

module.exports = LeafRouter