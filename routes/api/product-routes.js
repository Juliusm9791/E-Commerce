const router = require('express').Router();
const { Product, Category, Tag, ProductTag } = require('../../models');

// The `/api/products` endpoint

// get all products
router.get('/', async (req, res) => {
  // find all products
  // be sure to include its associated Category and Tag data
  try {
    const productData = await Product.findAll({
      include: [{ model: Category }, { model: Tag }],
    });
    res.status(200).json(productData);
  } catch (err) {
    res.status(500).json(err);
  }
});

// get one product
router.get('/:id', async (req, res) => {
  // find a single product by its `id`
  // be sure to include its associated Category and Tag data
  try {
    const productData = await Product.findByPk(req.params.id, {
      include: [{ model: Category }, { model: Tag }],
    });

    if (!productData) {
      res.status(404).json({ message: 'No product found with this id!' });
      return;
    }

    res.status(200).json(productData);
  } catch (err) {
    res.status(500).json(err);
  }
});


// create new product
router.post('/', async (req, res) => {
  /* req.body should look like this...
    {
      product_name: "Basketball",
      price: 200.00,
      stock: 3,
      tagIds: [1, 2, 3, 4]
    }
  */
  const productData = await Product.create(req.body)
  // if there's product tags, we need to create pairings to bulk create in the ProductTag model
  try {
    if (req.body.tagIds.length) {
      const productTagIdArr = req.body.tagIds.map((tagId) => {
        return {
          productId: productData.id,
          tagId,
        };
      });
      await ProductTag.bulkCreate(productTagIdArr);
    }
    // if no product tags, just respond
    res.status(200).json(productData);
  } catch (err) {
    console.log(err);
    res.status(400).json(err);
  };
});


// update product
router.put('/:id', async (req, res) => {
  // update product data // const product=
  try {
    const productData = await Product.update(req.body, {
      where: {
        id: req.params.id,
      },
    })
    // find all associated tags from ProductTag
    const productTags = await ProductTag.findAll({ where: { productId: req.params.id } });
    // get list of current tag_ids
    const productTagIds = productTags.map(({ tagId }) => tagId);
    // create filtered list of new tag_ids
    const newProductTags = req.body.tagIds
      .filter((tagId) => !productTagIds.includes(tagId))
      .map((tagId) => {
        return {
          productId: req.params.id,
          tagId,
        };
      });
    // figure out which ones to remove
    const productTagsToRemove = productTags
      .filter(({ tagId }) => !req.body.tagIds.includes(tagId))
      .map(({ id }) => id);

    await ProductTag.destroy({ where: { id: productTagsToRemove } });
    const updatedProductTags = await ProductTag.bulkCreate(newProductTags);
    res.json({ product: productData, tags: updatedProductTags });

  } catch (err) {
    console.log(err);
    res.status(400).json(err);
  };
});

router.delete('/:id', async (req, res) => {
  // delete one product by its `id` value
  try {
    const productData = await Product.destroy({
      where: { id: req.params.id }
    });
    if (!productData) {
      res.status(404).json({ message: 'No product with this id!' });
      return;
    }
    res.status(200).json(productData);
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;
