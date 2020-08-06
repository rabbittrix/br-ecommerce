'use strict'

const Helpers = require('../../../Helpers')

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

const Image = use('App/Models/Image')
const {manage_single_upload, manage_multiple_uploads} = use('App/Helpers')
const fs = use('fs')
const Transformer = use('App/Transformers/Admin/ImageTransformer')

/**
 * Resourceful controller for interacting with images
 */
class ImageController {
  /**
   * Show a list of all images.
   * GET images
   *
   * @param {object} ctx
   * @param {TransformWith} ctx.transform
   * @param {Response} ctx.response
   * @param {object} ctx.pagination
   */
  async index ({ response, pagination, transform }) {
    var images = await Image.query().orderBy('id', 'DESC').paginate(pagination.page, pagination.limit)
    images = await transform.paginate(images, Transformer)
    return response.send(images)
  }

  /**
   * Create/save a new image.
   * POST images
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {TransformWith} ctx.transform
   */
  async store ({ request, response, transform }) {
    try {
      const fileJar = request.file('images',{
        types: ['image'],
        size: '2mb'
      })

      let images = []
      if(!fileJar.files){
        const file = await manage_single_upload(fileJar)
        if(file.moved()){
          const image = await Image.create({
            path: file.fileName,
            size: file.size,
            original_name: file.clientName,
            extension: file.subtype
          })

          images.push(image)
          images = await transform.collection(images, Transformer)
          return response.status(201).send({success: images, errors: {}})
        }

        return response.status(500).send({
          message: 'Error processing your image !'
        })
      }
        let files = await manage_multiple_uploads(fileJar)
        await Promise.all(
          files.successes.map(async file => {
            const image = await Image.create({
              path: file.fileName,
              size: file.size,
              original_name: file.clientName,
              extension: file.subtype
            })
            images.push(image)
          })
        )
        images = await transform.collection(images, Transformer)
        return response.status(201).send({successes: images, errors: files.error})

    } catch (error) {
      return response.status(500).send({
        message: 'Error processing your image !'
      })

    }
  }

  /**
   * Display a single image.
   * GET images/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async show ({ params: {id}, request, response, view }) {
    const image = await Image.findOrFail(id)
    return response.send(await transform.item(image, Transformer))
  }

  /**
   * Update image details.
   * PUT or PATCH images/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async update ({ params: {id}, request, response }) {
    const image = await Image.findOrFail(id)
    try {
      image.merge(request.only(['original_name']))
      await image.save()
      return response.status(200).send(await transform.item(image, Transformer))
    } catch (error) {
      return response.status(500).send({
        message: 'Error update your image !'
      })
    }
  }

  /**
   * Delete a image with id.
   * DELETE images/:id
   *
   * @param {object} ctx
   * @param {Response} ctx.response
   */
  async destroy ({ params: {id}, response }) {
    const image = await Image.findOrFail(id)
    try {
      let filepath = Helpers.publicPath(`uploads/${image.path}`)
      fs.unlinkSync(filepath)
      await image.delete()
      return response.status(204).send({
        message: 'Success your image delete!'
      })
    } catch (error) {
      return response.status(400).send({
        message: 'Error your image not delete!'
      })
    }
  }
}

module.exports = ImageController
