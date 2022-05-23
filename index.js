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
