const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
const cors = require('cors');
require('dotenv').config();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());


// import { MongoClient } from 'mongodb';

const client = new MongoClient(`mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.wy5hpga.mongodb.net/?appName=Cluster0`);

// export async function connectToMongoDB() {
async function connectToMongoDB() {
  try {

    const scholarshipCollection = client.db('scholarshipDB').collection('scholarship');

    app.get('/scholarship', async (req, res) => {
      const result = await scholarshipCollection.find().toArray();
      res.send(result);
    });

    app.get('/scholarship/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await scholarshipCollection.findOne(query);
      res.send(result);
    })

    await client.connect();
    console.log("You successfully connected to MongoDB!");

    return client;

  } catch (err) {
    console.log(err);
  }
}
connectToMongoDB();


// Call this only when your application terminates
// export async function disconnectFromMongoDB() {
async function disconnectFromMongoDB() {
  await client.close();
}


app.get('/', (req, res) => {
  res.send("Scholarship manager is waiting");
})

app.listen(port, () => {
  console.log(`Scholarship manager is providing scholarship at port: ${port}`);
})