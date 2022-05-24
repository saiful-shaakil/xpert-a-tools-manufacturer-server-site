const express = require("express");
const app = express();
const cors = require("cors");
const jwt = require("jsonwebtoken");
const port = process.env.PORT || 5000;
require("dotenv").config();
//middleware
app.use(cors());
app.use(express.json());

//connecting database

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_NAME}:${process.env.DB_PASS}@redonion.uipb9.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});
async function run() {
  try {
    client.connect();
    const productCollection = client
      .db("tools_manufacturer")
      .collection("products");
    const orderCollection = client
      .db("tools_manufacturer")
      .collection("orders");
    const reviewsCollection = client
      .db("tools_manufacturer")
      .collection("reviews");
    const userCollection = client.db("tools_manufacturer").collection("users");

    //to get feature products
    app.get("/feature", async (req, res) => {
      const query = { type: "featured" };
      const result = await productCollection.find(query).toArray();
      res.send(result);
    });
    //to get top rated products
    app.get("/top-rated", async (req, res) => {
      const result = await productCollection
        .find({ type: "topRated" })
        .toArray();
      res.send(result);
    });
    //to get new arrivals products
    app.get("/new-arrivals", async (req, res) => {
      const result = await productCollection
        .find({ type: "newArrivals" })
        .toArray();
      res.send(result);
    });
    //to get product by id
    app.get("/purchase/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await productCollection.findOne(query);
      res.send(result);
    });
    //to post a new product
    app.post("/new-product", async (req, res) => {
      const newProduct = req.body;
      const result = await productCollection.insertOne(newProduct);
      res.send(result);
    });
    //to get all the products for admin
    app.get("/all-products", async (req, res) => {
      const result = await productCollection.find({}).toArray();
      res.send(result);
    });
    // to post an order
    app.post("/place-order", async (req, res) => {
      const placeDetails = req.body;
      const result = await orderCollection.insertOne(placeDetails);
      res.send(result);
    });
    //to get the order collection of a user
    app.get("/my-orders/:email", async (req, res) => {
      const userEmail = req.params.email;
      const query = { email: userEmail };
      const result = await orderCollection.find(query).toArray();
      res.send(result);
    });
    //to delete an order
    app.delete("/delete-order/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await orderCollection.deleteOne(query);
      res.send(result);
    });
    //to get all order for admin
    app.get("/all-orders", async (req, res) => {
      const result = await orderCollection.find({}).toArray();
      res.send(result);
    });
    // to add reviews
    app.post("/add-review", async (req, res) => {
      const review = req.body;
      const result = await reviewsCollection.insertOne(review);
      res.send(result);
    });
    // to get reviews
    app.get("/reviews", async (req, res) => {
      const result = await reviewsCollection.find({}).toArray();
      res.send(result);
    });
    //to post a user
    app.post("/add-user", async (req, res) => {
      const userDetails = req.body;
      const result = await userCollection.insertOne(userDetails);
      res.send(result);
    });
    //to get all users for admin
    app.get("/all-users", async (req, res) => {
      const result = await userCollection.find({}).toArray();
      res.send(result);
    });
  } finally {
    //client.close()
  }
}
run();
app.get("/", (req, res) => {
  res.send("Tools Manufacturer Server Side is Running");
});
app.listen(port, () => {
  console.log("Tools Manufacturer port", port);
});
