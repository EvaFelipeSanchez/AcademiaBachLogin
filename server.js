
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const express = require('express');
const app = express();
const bcrypt = require('bcrypt');
const flash = require('express-flash');
const session = require('express-session');
const methodOverride = require('method-override');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const passport = require('passport');


const initializePassport = require('./passport-config');
const MongoClient = require('mongodb').MongoClient;

// Middleware para analizar datos del formulario HTML
app.use(bodyParser.urlencoded({ extended: true }));

//const uri = 'mongodb://localhost:27017/mi_basededatos';
const uri = 'mongodb+srv://evafelipe:BL8h6Y4AguSZWB56@clusteracademiabach.wz3n9ev.mongodb.net/ClusterAcademiaBach?retryWrites=true&w=majority';
let usersCollection;

(async () => {
  const client = await MongoClient.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  const db = client.db('mi_basededatos');
  usersCollection = db.collection('users');
})();


//const initializePassport = require('./passport-config');
initializePassport(
  passport,
  async email => {
    try {
      const user = await usersCollection.findOne({ email: email });
      return user;
    } catch (error) {
      console.error(error);
      return null;
    }
  },
  async id => {
    try {
      const client = await MongoClient.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
      const usersCollection = client.db('mi_basededatos').collection('users');
      const user = await usersCollection.findOne({ id: id });
      client.close();
      return user;
    } catch (error) {
      console.error(error);
    }
  }
);

const users = [
  { id: 1, username: 'user1', email: 'user1@example.com', password: 'w' },
  { id: 2, username: 'user2', email: 'user2@example.com', password: 'w' },
  // ... otros usuarios
];

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: false }));
app.use(flash())

const secrett = process.env.SESSION_SECRET || 'default-secret';
app.use(session({
secret: secrett, // Replace with your actual secret key
resave: false,
saveUninitialized: true
}));

const getUserByEmail = async (email) => {
  try {
    const user = await usersCollection.findOne({ email: email });
    return user;
  } catch (error) {
    console.error(error);
    return null;
  }
};


const { ObjectId } = require('mongodb');

const getUserById = async (id) => {
  try {
    const user = await usersCollection.findOne({ _id: ObjectId(id) });
    return user;
  } catch (error) {
    console.error(error);
    return null;
  }
};


const passportInstance = passport;
initializePassport(passportInstance, getUserByEmail, getUserById, usersCollection);

app.use(passportInstance.initialize());
app.use(passportInstance.session());
app.use(methodOverride('_method'));



app.get('/login', checkNotAuthenticated, (req, res) => {
  res.render('login.ejs');
})

app.post('/login', checkNotAuthenticated, passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/login',
  failureFlash: true
}));


app.get('/register', checkNotAuthenticated, (req, res) => {
  res.render('register.ejs');
});


app.post('/register', checkNotAuthenticated, async (req, res) => {
  try {

    const existingUser = await getUserByEmail(req.body.email);
    if (existingUser) {
      req.flash('error', 'Email is already registered.');
      return res.redirect('/register');
    }

    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    const newUser = {
      id: uuidv4(),
      name: req.body.name,
      email: req.body.email,
      password: hashedPassword,
      servicioLocal: uuidv4(),
      username: req.body.username,
      
    };

    console.log('Nuevo Usuario:', newUser);

    await usersCollection.insertOne(newUser);

    res.redirect('/login');
  } catch (error) {
    console.error('Error al registrar nuevo usuario:', error);
    res.redirect('/register');
  }
});


// Ruta para mostrar el formulario HTML
app.get('/', (req, res) => {
  // Envia el archivo HTML en respuesta a la solicitud GET
  res.sendFile(__dirname + '/public/index.html');
});


// Ruta para procesar los datos del formulario (POST)
app.post('/guardar', (req, res) => {
  // Conectar a la base de datos
  MongoClient.connect('mongodb://localhost:27017/mi_basededatos', (err, client) => {
    if (err) return console.error(err);
    console.log('Conexión exitosa a la base de datos');

    const db = client.db('mi_basededatos');
    const collection = db.collection('misdatos');

    // Insertar datos en la colección
    collection.insertOne(req.body, (err, result) => {
      if (err) return console.error(err);
      console.log('Datos insertados con éxito');
      client.close();
      res.redirect('/');
      console.log('Ruta /guardar llamada');
    });
  });
});





app.delete('/logout', (req, res) => {
  req.logOut(function(err) {
    if (err) {
      console.error(err);
    }
    res.redirect('/login');
  });
});

function checkAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next()
  }

  res.redirect('/login')
}

function checkNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect('/')
  }
  next()
}



// Configura la carpeta "public" para servir archivos estáticos
app.use(express.static('public'));

const port = parseInt(process.env.PORT) || 3000;
app.listen(port, () => {
console.log(`helloworld: listening on port ${port}`);
});
