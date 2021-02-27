const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');
require('dotenv').config();

const port = 5000;

const app = express();
app.use(cors());
app.use(bodyParser.json());


var serviceAccount = require('./configs/burj-al-arab-website-firebase-adminsdk-xfqbj-60133b5f6c.json');

// var serviceAccount = (`${process.env.JSON_FILE}`)

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});


const MongoClient = require('mongodb').MongoClient;
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ipwii.mongodb.net/${process.env.DB_DATABASE}?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
  const bookingsCollection = client.db(`${process.env.DB_DATABASE}`).collection(`${process.env.DB_COLLECTION}`);
  // perform actions on the collection object
  // add or create Bookings

  app.post('/addBookings', (req, res) => {
    const bookings = req.body;
    // res.send(bookings)
    // console.log(bookings);
    bookingsCollection.insertOne(bookings)
      .then(result => {
        res.send(result.insertedCount > 0);
        console.log(result);
      })
  })

  // Read Bookings
  app.get('/bookings', (req, res) => {
    // console.log(req.query.email);
    // console.log(req.headers.authorization);
    const bearer = req.headers.authorization;
    if (bearer && bearer.startsWith('Bearer ')) {
      const idToken = bearer.split(' ')[1];
      console.log({ idToken });
      admin.auth().verifyIdToken(idToken)
        .then((decodedToken) => {
          // const uid = decodedToken.uid;
          // console.log({uid});
          // ...
          const tokenEmail = decodedToken.email;
          const queryEmail = req.query.email;
          console.log(tokenEmail, queryEmail);
          if (tokenEmail === queryEmail) {
            bookingsCollection.find({ email: req.query.email })
              .toArray((err, documents) => {
                res.send(documents);
              })
          }
          else{
            res.status(404).send('Un-authorized Access')
          }
        })
        .catch((error) => {
          res.status(404).send('Un-authorized Access')
        });
    }
    else{
      res.status(404).send('Un-authorized Access');
    }


  })

});


app.get('/', (req, res) => {
  res.send('Hello Burj Al Arab Website.');
})

app.listen(process.env.PORT || port)