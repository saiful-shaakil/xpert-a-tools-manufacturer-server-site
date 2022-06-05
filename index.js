const express = require("express");
const app = express();
const cors = require("cors");
const jwt = require("jsonwebtoken");
//port setup
const port = process.env.PORT || 5000;
require("dotenv").config();
//middleware
app.use(cors());
app.use(express.json());
//stipe setup
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
//to verify a user using jwt
function verifyUser(req, res, next) {
  const authCode = req.headers.authorization;
  if (!authCode) {
    return res.status(401).send({ message: "Unauthorized access" });
  }
  const token = authCode.split(" ")[1];
  jwt.verify(token, process.env.JWT_ACCESS_TOKEN, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: "Access Denied" });
    }
    req.decoded = decoded;
  });
  next();
}

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

    //for payment method
    app.post("/create-payment-intent", async (req, res) => {
      const order = req.body;
      const price = order.totalPrice;
      const amount = price * 100;
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        payment_method_types: ["card"],
      });
      res.send({ clientSecret: paymentIntent.client_secret });
    });
    //to post a user
    app.put("/add-user/:email", async (req, res) => {
      const emailofUser = req.params.email;
      const userDetails = req.body;
      const filter = { mail: emailofUser };
      const options = { upsert: true };
      const updateDoc = {
        $set: userDetails,
      };
      const result = await userCollection.updateOne(filter, updateDoc, options);
      const token = jwt.sign(
        { email: emailofUser },
        process.env.JWT_ACCESS_TOKEN,
        {
          expiresIn: "1d",
        }
      );
      res.send({ result, token });
    });
    //to get all users for admin
    app.get("/all-users", async (req, res) => {
      const result = await userCollection.find({}).toArray();
      res.send(result);
    });
    //to update role of a user
    app.put("/update-user/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          admin: true,
          role: "Admin",
        },
      };
      const result = await userCollection.updateOne(query, updateDoc, options);
      res.send(result);
    });
    //to update user information
    app.put("/update-user-info/:email", async (req, res) => {
      const email = req.params.email;
      const info = req.body;
      const query = { mail: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: info,
      };
      const result = await userCollection.updateOne(query, updateDoc, options);
      res.send(result);
    });
    //to get information of a single user
    app.get("/my-info/:email", async (req, res) => {
      const email = req.params.email;
      const query = { mail: email };
      const result = await userCollection.findOne(query);
      res.send(result);
    });
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
    //to get a single order
    app.get("/orders/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await orderCollection.findOne(query);
      res.send(result);
    });
    //to update the product after shipped (for admin)
    app.put("/shipped-order/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          shippingStatus: "Shipped",
        },
      };
      const result = await orderCollection.updateOne(query, updateDoc, options);
      res.send(result);
    });
    //to update the order payment status after successful payment
    app.patch("/update-order/:id", async (req, res) => {
      const id = req.params.id;
      const payment = req.body;
      const filter = { _id: ObjectId(id) };
      const updateDoc = {
        $set: {
          paid: true,
          status: "Paid",
          transactionId: payment.transId,
        },
      };
      const result = await orderCollection.updateOne(filter, updateDoc);
      res.send(result);
    });
    //to delete a product for admin
    app.delete("/delete-product/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await productCollection.deleteOne(query);
      res.send(result);
    });
    // to post an order
    app.post("/place-order", async (req, res) => {
      const placeDetails = req.body;
      const result = await orderCollection.insertOne(placeDetails);
      res.send(result);
    });
    //to get the order collection of a user
    app.get("/my-orders/:email", verifyUser, async (req, res) => {
      const verifiedEmail = req.decoded.email;
      const userEmail = req.params.email;
      if (verifiedEmail === userEmail) {
        const query = { email: userEmail };
        const result = await orderCollection.find(query).toArray();
        res.send(result);
      } else {
        return res.status(401).send({ message: "Access Denied" });
      }
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
    //to make sure the admin
    app.get("/admin/:email", async (req, res) => {
      const email = req.params.email;
      const filter = { mail: email };
      const user = await userCollection.findOne(filter);
      const isAdmin = user.admin === true;
      res.send({ admin: isAdmin });
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
