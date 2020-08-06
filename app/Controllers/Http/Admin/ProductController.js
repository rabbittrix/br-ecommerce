'use strict'

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

const Product = use('App/Models/Product')
const Transformer = use('App/Transformers/Admin/ProductTransformer')

/**
 * Resourceful controller for interacting with products
 */
class ProductController {
  /**
   * Show a list of all products.
   * GET products
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   * @param {object} ctx.pagination
   */
  async index ({ request, response, pagination, transform}) {
    const name = request.input('name')
    const query = Product.query()
    if(name){
      query.where('name', 'LIKE', `%${name}%`)
    }

    var products = await query.paginate(pagination.page, paginate.limit)
    products = await transform.paginate(products, Transformer)
    return response.send(products)
  }

  /**
   * Create/save a new product.
   * POST products
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async store ({ request, response, transform }) {
    try {
      const {name, description, price, image_id} = request.all()
      var product = await Product.create({name, description, price, image_id})
      product = await transform.item(product, Transformer)
      return response.status(201).send(product)
    } catch (error) {
      return response.status(400).send({
        message: 'Error created your product!'
      })
    }
  }

  /**
   * Display a single product.
   * GET products/:id
   *
   * @param {object} ctx
   * @param {Response} ctx.response
   */
  async show ({ params: {id}, response, transform}) {
    var product = await Product.findOrFail(id)
    product = await transform.item(product, Transformer)
    return response.send(product)
  }

  /**
   * Update product details.
   * PUT or PATCH products/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async update ({ params: {id}, request, response, transform }) {
    var product = await Product.findOrFail(id)
    try {
      const {name, description, price, image_id} = request.all()
      product.merge({name, description, price, image_id})
      await product.save()
      product = await transform.item(product, Transformer)
      return response.send(product)
    } catch (error) {
      return response.status(400).send({
        message: 'Error updated your product!'
      })
    }
  }

  /**
   * Delete a product with id.
   * DELETE products/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async destroy ({ params: {id}, request, response }) {
    const product = await Product.findOrFail(id)
    try {
      await product.delete()
      return response.status(204).send({
      message: 'Registration deleted successfully.'
    })
    } catch (error) {
      return response.status(500).send({
        message: 'Registration deleted fail.'
      })
    }

  }

}

module.exports = ProductController
