const express = require('express')
const cors = require('cors')
const app = express()
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()

const port = process.env.PORT || 5000

// middleware
app.use(cors())
app.use(express.json())



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.mf0sj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {


    const apartmentCollection = client.db("apartmentDB").collection("apartment");
    const apartmentsCollection = client.db("apartmentDB").collection("apartments");
    const userCollection = client.db("apartmentDB").collection("user");
    const announcementCollection = client.db("apartmentDB").collection("announcement");
    const couponCollection = client.db("apartmentDB").collection("coupon");


// jwt token
app.post('/jwt', async (req, res) => {
  const user = req.body;
  const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
  res.send({ token });
})


// middlewares 
const verifyToken = (req, res, next) => {
  console.log('inside verify token', req.headers.authorization);
  if (!req.headers.authorization) {
    return res.status(401).send({ message: 'unauthorized access' });
  }
  const token = req.headers.authorization.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: 'unauthorized access' })
    }
    req.decoded = decoded;
    next();
  })
}


 // use verify admin after verifyToken
 const verifyAdmin = async (req, res, next) => {
  const email = req.decoded.email;
  const query = { email: email };
  const user = await userCollection.findOne(query);
  const isAdmin = user?.role === 'admin';
  if (!isAdmin) {
    return res.status(403).send({ message: 'forbidden access' });
  }
  next();
}



app.get('/apartments', async (req, res) => {
  const result = await apartmentsCollection.find().toArray();
  res.send(result);
})

app.post('/apartments', async (req, res) => {

  const job = req.body;
  console.log(job)
  const result = await apartmentsCollection.insertOne(job)
  res.send(result)
})

// agrement
    app.get('/apartment', async (req, res) => {
        const result = await apartmentCollection.find().toArray();
        res.send(result);
      })
  
      app.post('/apartment', async (req, res) => {
  
        const job = req.body;
        const result = await apartmentCollection.insertOne(job)
        res.send(result)
      })


      // member
      app.get('/members', async (req, res) => {
       
            const query = { role: "member" };  
            const members = await apartmentCollection.find(query).toArray();
            res.send(members);
        
    });

    app.patch('/members/:id',verifyToken,verifyAdmin,  async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          role: 'user',
        },
      };
      const result = await apartmentCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });


    // created admin

    app.get("/user", verifyToken, verifyAdmin, async (req, res) => {
      const users = await userCollection.find().toArray();
      res.send(users);
  });


  app.get('/user/admin/:email', verifyToken, async (req, res) => {
    const email = req.params.email;

    if (email !== req.decoded.email) {
      return res.status(403).send({ message: 'forbidden access' })
    }
    const query = { email: email };
    const user = await userCollection.findOne(query);
    let admin = false;
    if (user) {
      admin = user?.role === 'admin';
    }
    res.send({ admin });
  })

    app.post('/user', async (req, res) => {
  
      const users = req.body;
      const query = {email: users.email}
      const extistingUser = await userCollection.findOne(query)
      if(extistingUser){
        return res.send({message : 'user created', insertedId: null})
      }
      const result = await userCollection.insertOne(users)
      res.send(result)
    })

    app.patch("/user/admin/:id",verifyToken,verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
          $set: { role: "admin" },
      };
  
      const result = await userCollection.updateOne(filter, updateDoc);
      res.send(result);
  });
  
     

  //  announcement
  app.get('/announcement', async (req, res) => {
    const result = await announcementCollection.find().toArray();
    res.send(result);
  })

  app.post('/announcement', async (req, res) => {
  
    const job = req.body;
    const result = await announcementCollection.insertOne(job)
    res.send(result)
  })

 

    //  agreement request admin route

    app.get('/apartment', async (req, res) => {
      const result = await apartmentCollection.find({ status: "pending" }).toArray();
      res.send(result);
    })

    app.patch("/apartment/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
          $set: { role: "member" },
      };
  
      const result = await apartmentCollection.updateOne(filter, updateDoc);
      res.send(result);
  });


  // admin coupon request
  app.get('/coupon', async (req, res) => {
    const result = await couponCollection.find().toArray();
    res.send(result);
  })
  
  app.post('/coupon', async (req, res) => {
  
    const job = req.body;
    console.log(job)
    const result = await couponCollection.insertOne(job)
    res.send(result)
  })




  

    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('apartment is available')
  })
  
  app.listen(port, () => {
    console.log(`apartment is running on port ${port}`)
  })