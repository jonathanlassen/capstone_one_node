const knex = require('knex')
const app = require('./app')
const { PORT, DB_URL } = require('./config')

const db = knex({
  client: 'pg',
  connection: DB_URL,
})


/* const shops = require('./shops')


shops.features.map(shop => {
  db.insert({
    name: shop.properties.Name,
    lat: shop.geometry.coordinates[1],
    long: shop.geometry.coordinates[0],
  })
  .into('shops')
  .returning('*')
  .then();
}); */



app.set('db', db)

app.listen(PORT, () => {
  console.log(`Server listening at http://localhost:${PORT}`)
})