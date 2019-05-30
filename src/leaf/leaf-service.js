const LeafService = {
    getAllLeaf(knex) {
      return knex.select('*').from('leaf')
    },
    getById(knex, id) {
      return knex.from('leaf').select('*').where('id', id).first()
    },
    insertLeaf(knex, newLeaf) {
      return knex
        .insert(newLeaf)
        .into('leaf')
        .returning('*')
        .then(rows => {
          return rows[0]
        })
    },
    deleteLeaf(knex, id) {
      return knex('leaf')
        .where({ id })
        .delete()
    },
    updateLeaf(knex, id, newLeafFields) {
      return knex('leaf')
        .where({ id })
        .update(newLeafFields)
    },
  }
  
  module.exports = LeafService