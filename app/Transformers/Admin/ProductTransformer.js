'use strict'

const BumblebeeTransformer = use('Bumblebee/Transformer')
const ImageTransformer = use('App/Transformers/Admin/ImageTransformer')


/**
 * ProductTransformer class
 *
 * @class ProductTransformer
 * @constructor
 */
class ProductTransformer extends BumblebeeTransformer {
  defaultInclude(){
    return['image']
  }

  transform (model) {
    return {
      id: model.id,
      title: model.title,
      description: model.description,
      price: model.price
    }
  }

  includeImage(model){
    return this.item(model.getRelated('image'), ImageTransformer)
  }
}

module.exports = ProductTransformer
