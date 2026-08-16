const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken');
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

    const userCollection = client.db('scholarshipDB').collection('users');
    const scholarshipCollection = client.db('scholarshipDB').collection('scholarship');
    const scholarshipApplicationCollection = client.db('scholarshipDB').collection('scholarshipApplications');

    // jwt related api
    app.post('/jwt', async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
      res.send({ token });
    });

    // middlewares
    const verifyToken = (req, res, next) => {
      console.log('Inside verifyToken middleware', req.headers.authorization);
      if (!req.headers.authorization) {
        return res.status(401).send({ message: 'unauthorized access' });
      }
      const token = req.headers.authorization.split(' ')[1];
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
        if (err) {
          return res.status(401).send({ message: 'unauthorized access' });
        }
        req.decoded = decoded;
        next();
      })
    }

    // use verify admin after verifyToken
    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { userEmail: email };
      const user = await userCollection.findOne(query);
      const isAdmin = user?.role === 'admin';
      if (!isAdmin) {
        return res.status(403).send({ message: 'forbidden access' });
      }
      next();
    }

    // user related apis
    app.get('/users', verifyToken, verifyAdmin, async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    });

    // app.get('/users/admin/:email', verifyToken, async (req, res) => {
    // get user role
    app.get('/users/role/:email', verifyToken, async (req, res) => {
      const email = req.params.email;
      if (email !== req.decoded.email) {
        return res.status(403).send({ message: "forbidden access" })
      }

      const query = { userEmail: email }
      const user = await userCollection.findOne(query)
      // let admin = false;
      // if (user) {
      //   admin = user?.role === 'admin'
      // }
      res.send({ role: user?.role });
    })

    app.post('/users', async (req, res) => {
      const user = req.body;
      // Simple checking whether user exists in the database
      const query = { userEmail: user.userEmail }
      const existingUser = await userCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: "user already exists", insertedId: null });
      }
      const result = await userCollection.insertOne(user);
      res.send(result);
    });

    // app.patch('/users/admin/:id', verifyToken, verifyAdmin, async (req, res) => {
    app.patch('/users/role/:id', verifyToken, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const data = req.body;
      const filter = { _id: new ObjectId(id) }
      const updatedDoc = {
        $set: {
          // role: 'Admin'
          role: data.role
        }
      }
      const result = await userCollection.updateOne(filter, updatedDoc);
      res.send(result);
    })

    app.delete('/users/:id', verifyToken, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await userCollection.deleteOne(query);
      res.send(result);
    });

    // scholarship related apis
    app.get('/scholarship', async (req, res) => {
      const result = await scholarshipCollection.find().toArray();
      res.send(result);
    });

    app.get('/scholarship/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await scholarshipCollection.findOne(query);
      res.send(result);
    });

    app.post('/scholarship', verifyToken, verifyAdmin, async (req, res) => {
      const scholarship = req.body;
      const result = await scholarshipCollection.insertOne(scholarship);
      res.send(result);
    });

    app.delete('/scholarship/:id', verifyToken, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await scholarshipCollection.deleteOne(query);
      res.send(result);
    })
    // scholarship application apis

    app.get('scholarship-application', async (req, res) => {
      const email = req.query.email;
      const query = { applicant_email: email }
      const result = await scholarshipApplicationCollection.find(query).toArray()
      res.send(result);
    })

    app.post('scholarship-applications', async (req, res) => {
      const application = req.body;
      const result = await scholarshipApplicationCollection.insertOne(application);
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