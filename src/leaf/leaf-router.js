const express = require('express')
const uuid = require('uuid/v4')
const { isWebUri } = require('valid-url')
const logger = require('../logger')
const store = require('../store')
const LeafService = require('./Leaf-service')

const LeafRouter = express.Router()
const bodyParser = express.json()

const serializeLeaf = leaf => ({
  id: leaf.id,
  title: leaf.title,
  url: leaf.url,
  description: leaf.description,
  rating: Number(leaf.rating),
})

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

    if (!Number.isInteger(rating) || rating < 0 || rating > 5) {
      logger.error(`Invalid rating '${rating}' supplied`)
      return res.status(400).send(`'rating' must be a number between 0 and 5`)
    }

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