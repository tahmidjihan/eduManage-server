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
    app.patch('/api/courses/:id', verifyJWT, async (req, res) => {
      const id = req.params.id;
      const courseCollection = client.db('EduManage').collection('Courses');
      const result = await courseCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: req.body }
      );
      res.send(result);
    });
    app.post('/api/courses', verifyJWT, async (req, res) => {
      const body = req.body;
      const result = await client
        .db('EduManage')
        .collection('Courses')
        .insertOne(body)
        .then((result) => {
          res.send(result);
        });
    });
    app.delete('/api/courses/:id', async (req, res) => {
      const id = req.params.id;
      const courseCollection = client.db('EduManage').collection('Courses');
      const result = await courseCollection.deleteOne({
        _id: new ObjectId(id),
      });
      res.send(result);
    });
    app.get('/api/courses/stats/:id', async (req, res) => {
      const id = req.params.id;
      const AssignmentSubmission = client
        .db('EduManage')
        .collection('AssignmentSubmission');
      const assignment = client.db('EduManage').collection('Assignments');
      const CourseEnrolled = client
        .db('EduManage')
        .collection('CourseEnrolled');
      const result = await AssignmentSubmission.aggregate([
        { $match: { courseId: id } },
        { $group: { _id: '$assignmentId', count: { $sum: 1 } } },
      ]).toArray();
      const result2 = await assignment
        .aggregate([
          { $match: { courseId: id } },
          { $group: { _id: '$courseId', count: { $sum: 1 } } },
        ])
        .toArray();
      const result3 = await CourseEnrolled.aggregate([
        { $match: { courseId: id } },
        { $group: { _id: '$courseId', count: { $sum: 1 } } },
      ]).toArray();
      const data = {
        assignmentSubmitted: result[0].count,
        totalAssignment: result2[0].count,
        enrolled: result3[0].count,
      };
      res.send(data);
    });
    app.get('/api/courses/email/:email', verifyJWT, async (req, res) => {
      const email = req.params.email;
      const courseCollection = client.db('EduManage').collection('Courses');
      const result = await courseCollection.find({ email: email }).toArray();
      res.send(result);
    });
    app.post('/api/assignments', async (req, res) => {
      body = req.body;
      const result = await client
        .db('EduManage')
        .collection('Assignments')
        .insertOne(body)
        .then((result) => {
          res.send(result);
        });
    });
    app.get(
      '/api/assignments/course/:courseId',
      verifyJWT,
      async (req, res) => {
        const courseId = req.params.courseId;
        const assignmentCollection = client
          .db('EduManage')
          .collection('Assignments');
        const result = await assignmentCollection
          .find({ courseId: courseId })
          .toArray();
        res.send(result);
      }
    );
    app.post('/api/assignmentSubmit', verifyJWT, async (req, res) => {
      body = req.body;
      const result = await client
        .db('EduManage')
        .collection('AssignmentSubmission')
        .insertOne(body)
        .then((result) => {
          res.send(result);
        });
    });
    app.post('/api/feedbacks', async (req, res) => {
      body = req.body;
      const result = await client
        .db('EduManage')
        .collection('Feedback')
        .insertOne(body)
        .then((result) => {
          res.send(result);
        });
    });
    app.get('/api/feedbacks', async (req, res) => {
      const feedbackCollection = client.db('EduManage').collection('Feedback');
      const result = await feedbackCollection.find({}).toArray();
      res.send(result);
    });
    app.post('/api/users', verifyJWT, async (req, res) => {
      try {
        const user = req.body;
        const userCollection = client.db('EduManage').collection('Users');
        await client
          .db('EduManage')
          .collection('Users')
          .createIndex({ email: 1 }, { unique: true });
        const existingUser = await userCollection.findOne({
          email: user.email,
        });
        if (existingUser) {
          return;
          // res.status(400).send({ error: 'User already exists' });
        } else {
          const result = await userCollection.insertOne(user);
          res.status(201).send(result);
        }
      } catch (error) {
        // console.error(error);
        res.status(500).send({ error: 'Something went wrong' });
      }
    });

    app.get('/api/users', verifyJWT, async (req, res) => {
      const userCollection = client.db('EduManage').collection('Users');
      const queries = req.query;
      if (queries.email) {
        const result = await userCollection.findOne({ email: queries.email });
        res.send(result);
        return;
      }

      const result = await userCollection.find({}).toArray();
      res.send(result);
    });
    app.get('/api/users/admin', verifyJWT, async (req, res) => {
      const userCollection = client.db('EduManage').collection('Users');
      const result = await userCollection.find({ role: 'admin' }).toArray();
      res.send(result);
    });
    app.patch('/api/users/:id', verifyJWT, async (req, res) => {
      const id = req.params.id;
      const user = req.body;
      const userCollection = client.db('EduManage').collection('Users');
      const result = await userCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: user }
      );
      res.send(result);
    });
    app.get('/api/users/teacher', verifyJWT, async (req, res) => {
      const userCollection = client.db('EduManage').collection('Users');
      const result = await userCollection.find({ role: 'teacher' }).toArray();
      res.send(result);
    });
    app.post('/api/enrolled', verifyJWT, async (req, res) => {
      try {
        const user = req.body;
        const userCollection = client
          .db('EduManage')
          .collection('CourseEnrolled');
        const result = await userCollection.insertOne(user);
        res.status(201).send(result);
      } catch (error) {
        // console.error(error);
        res.status(500).send({ error: 'Something went wrong' });
      }
    });

    app.get('/api/enrolled', verifyJWT, async (req, res) => {
      const userCollection = client
        .db('EduManage')
        .collection('CourseEnrolled');
      const email = req.query.email;
      if (email) {
        const result = await userCollection.find({ email: email }).toArray();
        res.send(result);
        return;
      }
      const result = await userCollection.find({}).toArray();
      res.send(result);
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
