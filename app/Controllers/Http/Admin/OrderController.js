'use strict'

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

const Order = use('App/Models/Order')
const Database = use('Database')
const Service = use('App/Services/Order/OrderService')
const Coupon = use('App/Models/Coupon')
const Discount = use('App/Models/Discount')
const Transformer = use('App/Transformers/Admin/OrderTransformer')

/**
 * Resourceful controller for interacting with orders
 */
class OrderController {
  /**
   * Show a list of all orders.
   * GET orders
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {object} ctx.pagination
   */
  async index ({ request, response, pagination, transform }) {
    const {status, id} = request.only(['status', 'id'])
    const query = Order.query()

    if(status && id){
      query.where('status', status).orWhere('id', 'LIKE', `%${id}%`)
    }else if(status){
      query.where('status', status)
    }else if(id){
      query.where('id', 'LIKE', `%${id}%`)
    }

    var orders = await query.paginate(pagination.page, pagination.limit)
    orders = await transform.paginate(orders, Transformer)
    return response.send(orders)
  }

  /**
   * Create/save a new order.
   * POST orders
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async store ({ request, response, transform }) {
    const trx = await Database.beginTransaction()
    try {
      const {user_id, items, status} = request.all()
      var order = await Order.create({user_id, status}, trx)
      const service = new Service(order, trx)

      if(items && items.length > 0){
        await service.syncItems(items)
      }
      await trx.commit()
      order = await Order.find(order.id)
      order = await transform.include('user,items').item(order, Transformer)
      return response.status(201).send(order)
    } catch (error) {
      await trx.rollback()
      return response.status(400).send({
        message: 'Error don´t create your order!'
      })
    }
  }

  /**
   * Display a single order.
   * GET orders/:id
   *
   * @param {object} ctx
   * @param {Response} ctx.response
   */
  async show ({ params: {id}, response, transform }) {
    var order = await Order.findOrFail(id)
    order = await transform.include('user,items,discounts').item(order, Transformer)
    return response.send(order)
  }

  /**
   * Update order details.
   * PUT or PATCH orders/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async update ({ params: {id}, request, response, transform }) {
    var order = await Order.findOrFail(id)
    const trx = await Database.beginTransaction()
    try {
      const {user_id, items, status} = request.all()
      order.merge({user_id, status})
      const service = new Service(order, trx)
      await service.updateItems(items)
      await order.save(trx)
      await trx.commit()
      order = await transform.include('user,items,discounts, coupons').item(order, Transformer)
      return response.send(order)
    } catch (error) {
      await trx.rollback()
      return response.status(400).send({
        message: 'Error update your order!'
      })
    }
  }

  /**
   * Delete a order with id.
   * DELETE orders/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async destroy ({ params: {id}, request, response }) {
    const order = await Order.findOrFail(id)
    const trx = await Database.beginTransaction()

    try {
      await order.items().delete(trx)
      await order.coupon().delete(trx)
      await order.delete(trx)
      await trx.commit()
      return response.status(204).send({
        message: 'Success delete your order!'
      })
    } catch (error) {
      await trx.rollback()
      return response.status(400).send({
        message: 'Error delete your order!'
      })
    }
  }

  async applyDiscount ({ params: {id}, request, response }){
    const {code} = request.all()
    const coupon = await Coupon.findByOrFail('code', code.toUpperCase())
    const order = await Order.findOrFail(id)
    var discount, info = {}
    try {
      const service = new Service(order)
      const canAddDiscount = await service.canApplyDiscount(coupon)
      const orderDiscounts = await order.coupons().getCount()

      const canApplyToOrder = orderDiscounts < 1 || (orderDiscounts >= 1 && coupon.recursive)
      if(canAddDiscount && canApplyToOrder){
        discount = await Discount.findOrCreate({
          order_id: order.id,
          coupon_id: coupon.id
        })
        info.message = 'Success apply coupon'
        info.success = true
      }else {
        info.message = 'Error apply coupon'
        info.success = false
      }
      return response.send({order, info})
    } catch (error) {
      return response.status(400).send({message: 'Error apply coupon'})
    }
  }

  async removeDiscount ({request, response }){
    const {discount_id} = request.all()
    const discount = await Discount.findOrFail(discount_id)
    await discount.delete()
    return response.status(204).send({message: 'Discount success removed'})
  }

}

module.exports = OrderController
