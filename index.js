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