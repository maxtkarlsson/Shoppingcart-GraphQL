const path = require("path");
const { GraphQLError } = require("graphql");
const crypto = require("crypto");
const fsPromises = require("fs/promises");
const { fileExists } = require("../utils/fileHandling");

const articleDirectory = path.join(__dirname, "..", "data", "articles");
const cartDirectory = path.join(__dirname, "..", "data", "carts");

exports.resolvers = {
  Query: {
    getCartById: async (_, args) => {
      const cartId = args.cartId;

      const cartFilePath = path.join(cartDirectory, `${cartId}.json`);

      const cartExists = await fileExists(cartFilePath);
      if (!cartExists) return new GraphQLError("That cart does not exist");

      const cart = JSON.parse(
        await fsPromises.readFile(cartFilePath, {
          encoding: "utf-8",
        })
      );

      console.log(cart);

      return cart;
    },
  },
  Mutation: {
    createCart: async (_, args) => {
      const newCart = {
        cartId: crypto.randomUUID(),
        articles: [],
        articleCount: 0,
        totalPrice: 0,
      };

      let filePath = path.join(cartDirectory, `${newCart.cartId}.json`);

      let idExists = true;

      while (idExists) {
        const exists = await fileExists(filePath);

        if (exists) {
          newCart.cartId = crypto.randomUUID();
          filePath = path.join(articleDirectory, `${newCart.cartId}.json`);
        }
        idExists = exists;
      }

      await fsPromises.writeFile(filePath, JSON.stringify(newCart));

      return newCart;
    },
    deleteCartById: async (_, args) => {
      const cartId = args.cartId;

      const cartFilePath = path.join(cartDirectory, `${cartId}.json`);

      const cartExists = await fileExists(cartFilePath);
      if (!cartExists) return new GraphQLError("That cart does not exist");

      await fsPromises.unlink(cartFilePath);

      const response = { deletedId: cartId, success: true };

      return response;
    },

    addArticleToCart: async (_, args) => {
      const { cartId, articleId } = args;

      const cartFilePath = path.join(cartDirectory, `${cartId}.json`);
      const articleFilePath = path.join(articleDirectory, `${articleId}.json`);

      const cartExists = await fileExists(cartFilePath);
      if (!cartExists) return new GraphQLError("That cart does not exist");

      const articleExists = await fileExists(articleFilePath);
      if (!articleExists)
        return new GraphQLError("That article does not exist");

      const cartData = await fsPromises.readFile(cartFilePath, {
        encoding: "utf-8",
      });

      let cart = JSON.parse(cartData);
      console.log(cart);

      const articleData = await fsPromises.readFile(articleFilePath, {
        encoding: "utf-8",
      });

      const article = JSON.parse(articleData);

      const newArticle = {
        articleId: article.articleId,
        name: article.name,
        description: article.description,
        price: article.price,
      };

      cart.articles.push(newArticle);
      let priceSum = 0;
      let articleSum = 0;

      for (let i = 0; i < cart.articles.length; i++) {
        priceSum += cart.articles[i].price;
        articleSum++;
      }

      cart.totalPrice = priceSum;
      cart.articleCount = articleSum;

      await fsPromises.writeFile(cartFilePath, JSON.stringify(cart));
      return cart;
    },
    removeArticleFromCartById: async (_, args) => {
      const { cartId, articleId } = args;

      const cartFilePath = path.join(cartDirectory, `${cartId}.json`);

      const cartExists = await fileExists(cartFilePath);
      if (!cartExists) return new GraphQLError("That cart does not exist");

      const cartData = await fsPromises.readFile(cartFilePath, {
        encoding: "utf-8",
      });

      let cart = JSON.parse(cartData);
      console.log(cart);

      let exists = false;
      for (let i = 0; i < cart.articles.length; i++) {
        if (articleId === cart.articles[i].articleId && exists === false) {
          cart.articles.splice([i], 1);
          exists = true;
        }
      }

      if (!exists)
        return new GraphQLError("Den här produkten finns inte i varukorgen");

      let priceSum = 0;
      let articleSum = 0;

      for (let i = 0; i < cart.articles.length; i++) {
        priceSum += cart.articles[i].price;
        articleSum++;
      }

      cart.totalPrice = priceSum;
      cart.articleCount = articleSum;

      await fsPromises.writeFile(cartFilePath, JSON.stringify(cart));
      console.log(cart);
      return cart;
    },

    createArticle: async (_, args) => {
      const { name, description, price } = args.input;

      if (name.length === 0)
        return new GraphQLError("Name must be at least 1 character long");

      const newArticle = {
        articleId: crypto.randomUUID(),
        name,
        description,
        price,
      };

      let filePath = path.join(
        articleDirectory,
        `${newArticle.articleId}.json`
      );

      let idExists = true;

      while (idExists) {
        const exists = await fileExists(filePath);

        if (exists) {
          newArticle.articleId = crypto.randomUUID();
          filePath = path.join(
            articleDirectory,
            `${newArticle.articleId}.json`
          );
        }
        idExists = exists;
      }

      await fsPromises.writeFile(filePath, JSON.stringify(newArticle));

      return newArticle;
    },
    deleteArticleById: async (_, args) => {
      const articleId = args.articleId;

      const articleFilePath = path.join(articleDirectory, `${articleId}.json`);

      const articleExists = await fileExists(articleFilePath);
      if (!articleExists)
        return new GraphQLError("That article does not exist");

      await fsPromises.unlink(articleFilePath);

      const response = { deletedId: articleId, success: true };

      return response;
    },
  },
};
