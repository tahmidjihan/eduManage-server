const express = require('express');
require('dotenv').config();
const cors = require('cors');
const app = express();
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

app.use(express.json());
app.use(cors());
const verifyJWT = (req, res, next) => {
  const token = req.headers.authorization;
  // console.log(req.headers);
  // console.log(token);
  if (!token) {
    return res.status(401).send('401 Unauthorized');
  } else {
    try {
      const decoded = jwt.verify(token, process.env.SECRET);
      req.decoded = decoded;
      next();
    } catch (error) {
      return res.status(401).send('401 Unauthorized or invalid token');
    }
  }
};
const port = process.env.PORT || 3000;

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.tfnar.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
async function run() {
  try {
    app.get('/api/courses', async (req, res) => {
      const courseCollection = client.db('EduManage').collection('Courses');
      const result = await courseCollection.find({}).toArray();
      res.send(result);
    });
    app.get('/api/courses/:id', verifyJWT, async (req, res) => {
      const id = req.params.id;
      const courseCollection = client.db('EduManage').collection('Courses');
      const result = await courseCollection.findOne({ _id: new ObjectId(id) });
      res.send(result);
    });
    app.get('/api/feedbacks', async (req, res) => {
      const feedbackCollection = client.db('EduManage').collection('Feedback');
      const result = await feedbackCollection.find({}).toArray();
      res.send(result);
    });
    app.post('/api/users', async (req, res) => {
      try {
        const user = req.body;
        const userCollection = client.db('EduManage').collection('Users');
        const result = await userCollection.insertOne(user);
        res.status(201).send(result);
      } catch (error) {
        // console.error(error);
        res.status(500).send({ error: 'Something went wrong' });
      }
    });
    app.get('/api/isUser/:email', async (req, res) => {
      const email = req.params.email;
      const userCollection = client.db('EduManage').collection('Users');
      const result = await userCollection.findOne({ email: email });
      if (result) {
        res.send({ isUser: true });
      } else {
        res.send({ isUser: false });
      }
    });
    app.post('/api/jwt', async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.SECRET, {
        expiresIn: '10d',
      });
      res.send({ token });
    });
    // Send a ping to confirm a successful connection
    await client.db('admin').command({ ping: 1 });
    console.log(
      'Pinged your deployment. You successfully connected to MongoDB!'
    );
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('porte boi');
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
