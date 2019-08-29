/* eslint-disable strict */
const LeafService = {
  getAllLeaf(knex) {
    return knex.select('*').from('shops');
  },
  getById(knex, id) {
    return knex.from('shops').select('*').where('id', id).first();
  },
  insertLeaf(knex, newLeaf) {
    return knex
      .insert(newLeaf)
      .into('leaf')
      .returning('*')
      .then(rows => {
        return rows[0];
      });
  },
  deleteLeaf(knex, id) {
    return knex('leaf')
      .where({ id })
      .delete();
  },
  updateShop(knex, id, shop) {
    return knex('shops')
      .where({ id: id })
      .update( shop );
  },
};
  
module.exports = LeafService;