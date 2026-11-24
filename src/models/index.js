const { Sequelize } = require('sequelize');
const dbConfig = require('../config/database');

const env = process.env.NODE_ENV || 'development';
const config = dbConfig[env];

const sequelize = new Sequelize(
    config.database,
    config.username,
    config.password,
    config
);

const User = require('./User')(sequelize);
const Category = require('./Category')(sequelize);
const Product = require('./Product')(sequelize);
const ProductImage = require('./ProductImage')(sequelize);
const ProductOption = require('./ProductOption')(sequelize);
const ProductCategory = require('./ProductCategory')(sequelize);

// Associações entre Product e ProductImage (1:N)
Product.hasMany(ProductImage, {
    foreignKey: 'product_id',
    as: 'images',
    onDelete: 'CASCADE',
});
ProductImage.belongsTo(Product, {
    foreignKey: 'product_id',
    as: 'product',
});

// Associações entre Product e ProductOption (1:N)
Product.hasMany(ProductOption, {
    foreignKey: 'product_id',
    as: 'options',
    onDelete: 'CASCADE',
});
ProductOption.belongsTo(Product, {
    foreignKey: 'product_id',
    as: 'product',
});

// Associações N:N entre Product e Category através de ProductCategory
Product.belongsToMany(Category, {
    through: ProductCategory,
    foreignKey: 'product_id',
    otherKey: 'category_id',
    as: 'categories',
});
Category.belongsToMany(Product, {
    through: ProductCategory,
    foreignKey: 'category_id',
    otherKey: 'product_id',
    as: 'products',
});

module.exports = {
    sequelize,
    Sequelize,
    User,
    Category,
    Product,
    ProductImage,
    ProductOption,
    ProductCategory,
};
