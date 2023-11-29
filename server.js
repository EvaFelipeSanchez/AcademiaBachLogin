
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
const mongoose = require('mongoose');
const db = mongoose.connection;   ///


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
db.on('connected', _ => { console.log('DB CONNECTED'); });
db.on('disconnected', _ => { console.log('DB DISCONNECTED'); });
db.on('error', err => { console.error('DB ERROR', err); });


const initializePassport = require('./passport-config');
const MongoClient = require('mongodb').MongoClient;
const { ObjectId } = require('mongodb');
// Middleware para analizar datos del formulario HTML
app.use(bodyParser.urlencoded({ extended: true }));


//const uri = 'mongodb://localhost:27017/mi_basededatos';
const uri = 'mongodb+srv://evafelipe:BL8h6Y4AguSZWB56@clusteracademiabach.wz3n9ev.mongodb.net/ClusterAcademiaBach?retryWrites=true&w=majority';
//mongoose.connect('mongodb://localhost:27017/mi_basededatos', { useNewUrlParser: true, useUnifiedTopology: true });

let usersCollection;

(async () => {
  const client = await MongoClient.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  const db = client.db('mi_basededatos');
  usersCollection = db.collection('users');
})();

app.use('*.js', (req, res, next) => {
  res.header('Content-Type', 'application/javascript');
  next();
});
app.use(express.json());


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



app.get('/login', checkNotAuthenticated, async (req, res) => {
    res.render('login.ejs');  
});

/*
app.post('/login', checkNotAuthenticated, passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/login',
  failureFlash: true
})); */

app.post('/login', checkNotAuthenticated, passport.authenticate('local', {
  //successRedirect: '/',
  failureRedirect: '/login',
  failureFlash: true
}),
async (req, res) => {
  const userId = req.user.id;
  console.log('User ID:', userId);
  res.redirect('/' + userId);
}); 



app.get('/register', checkNotAuthenticated, async (req, res) => {
  try {
    //const usuarios = await usersCollection.find().toArray();
    //res.json({ usuarios });
    res.render('register.ejs');
  } catch (error) {
    console.error('Error al obtener la lista de usuarios:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
  
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
    res.status(201).json({ message: 'Usuario registrado exitosamente' })
    res.redirect('/login');
  } catch (error) {
    console.error('Error al registrar usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
    res.redirect('/register');
  }
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


/*
app.get('/', async (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
}); */


app.get('/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await usersCollection.findOne({ id: userId });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    

    console.log('User ID:', userId);
    //res.sendFile(__dirname + '/public/index.html', { user });
    //res.render('index.ejs', { user });
    res.render('index.ejs', { user });
    //res.json({ user });
  } catch (error) {
    console.error('Error al obtener usuario por ID:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
    
  }
});


app.get('/checklist/:id', async function(req, res) {
  const userId = req.params.id;
  const user = await usersCollection.findOne({ id: userId });
  if (!user) {
    return res.status(404).json({ error: 'Usuario no encontrado' });

  }

  res.render('checklist.ejs', { user });
}); 

app.get('/papelera/:id', async function(req, res) {
  const userId = req.params.id;
  const user = await usersCollection.findOne({ id: userId });
  if (!user) {
    return res.status(404).json({ error: 'Usuario no encontrado' });

  }

  res.render('papelera.ejs', { user });
}); 

app.get('/mascota/:id', async function(req, res) {
  const userId = req.params.id;
  const user = await usersCollection.findOne({ id: userId });
  if (!user) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }

  res.render('mascota.ejs', { user });
}); 

app.get('/tienda/:id', async function(req, res) {
  const userId = req.params.id;
  const user = await usersCollection.findOne({ id: userId });
  if (!user) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }

  res.render('tienda.ejs', { user });
}); 

app.get('/cementerio/:id', async function(req, res) {
  const userId = req.params.id;
  const user = await usersCollection.findOne({ id: userId });
  if (!user) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }

  res.render('cementerio.ejs', { user });
}); 


//Tareas//
const Tarea = require('./model/tarea');  

app.get('/:idt/tareas', async (req, res) => {
  let idt = req.params.idt;
  
  console.log('GET /:idt/tareas');
  try { 
    res.json(await Tarea.find({ userId: idt })); }
  catch (err) { res.status(500).send({ message: err.message }); }
});


app.post('/:idt/tareas', async (req, res) => {
  let tarea = req.body;
  const idt = req.params.idt;
  console.log(`POST /:idt/tarea`);
  console.log('BODY', tarea);
  try {
    // Aquí debes comparar con el ID del usuario que envías en la solicitud POST
    if (idt !== tarea.userId) {
      return res.status(403).json({ message: 'No tienes permiso para realizar esta acción.' });
    }
    tarea.userId = idt; // Actualiza el ID del usuario con el valor de idt
    res.json(await Tarea(tarea).save());
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
});


app.get('/:idt/tareas/:id', async (req, res) => {
  let idt = req.params.idt;
  let id = req.params.id;
  console.log(`GET /${idt}/tarea/${id}`);
  try { res.json(await Tarea.findById(id)) }
  catch (err) { res.status(500).send({ message: err.message }); }
});

app.delete('/:idt/tareas/:id', async (req, res) => {
  let id = req.params.id;
  console.log(`DELETE /:idt/tarea/${id}`);
  try { res.json(await Tarea.findByIdAndDelete(id)); }
  catch (err) { res.status(500).send({ message: err.message }); }
});

app.delete('/:idt/tareas', async (req, res) => {
  console.log(`DELETE /:idt/tarea`);
  try { res.json(await Tarea.deleteMany()); }
  catch (err) { res.status(500).send({ message: err.message }); }
});

app.put('/:idt/tareas/:id', async (req, res) => {
  let id = req.params.id;
  console.log(`PUT /:idt/tarea/${id}`);
  try {
    let tarea = await Tarea.findById(id);
    Object.assign(tarea, req.body);
    res.json(await tarea.save());
  } catch (err) { res.status(500).send({ message: err.message }); }
});

//Puntos guardados

//MascotaPrincipal


//Papeleras
const Papelera = require('./model/papelera');  

app.get('/:idt/papeleras', async (req, res) => {
  let idt = req.params.idt;
  
  console.log('GET /:idt/papeleras');
  try { 
    res.json(await Papelera.find({ userId: idt })); }
  catch (err) { res.status(500).send({ message: err.message }); }
});


app.post('/:idt/papeleras', async (req, res) => {
  let papelera= req.body;
  const idt = req.params.idt;
  console.log(`POST /:idt/papelera`);
  console.log('BODY', papelera);
  try {
    // Aquí debes comparar con el ID del usuario que envías en la solicitud POST
    if (idt !== papelera.userId) {
      return res.status(403).json({ message: 'No tienes permiso para realizar esta acción.' });
    }
    papelera.userId = idt; // Actualiza el ID del usuario con el valor de idt
    res.json(await Papelera(papelera).save());
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
});


app.get('/:idt/papeleras/:id', async (req, res) => {
  let idt = req.params.idt;
  let id = req.params.id;
  console.log(`GET /${idt}/papelera/${id}`);
  try { res.json(await Papelera.findById(id)) }
  catch (err) { res.status(500).send({ message: err.message }); }
});

app.delete('/:idt/papeleras/:id', async (req, res) => {
  let id = req.params.id;
  console.log(`DELETE /:idt/papelera/${id}`);
  try { res.json(await Papelera.findByIdAndDelete(id)); }
  catch (err) { res.status(500).send({ message: err.message }); }
});

app.delete('/:idt/papeleras', async (req, res) => {
  console.log(`DELETE /:idt/papelera`);
  try { res.json(await Papelera.deleteMany()); }
  catch (err) { res.status(500).send({ message: err.message }); }
});

app.put('/:idt/papeleras/:id', async (req, res) => {
  let id = req.params.id;
  console.log(`PUT /:idt/papelera/${id}`);
  try {
    let papelera = await Papelera.findById(id);
    Object.assign(papelera, req.body);
    res.json(await papelera.save());
  } catch (err) { res.status(500).send({ message: err.message }); }
});

//
//Mascotas//
const Mascota = require('./model/mascota');  

app.get('/:idt/mascotas', async (req, res) => {
  let idt = req.params.idt;
  
  console.log('GET /:idt/mascota');
  try { 
    res.json(await Mascota.find({ userId: idt })); }
  catch (err) { res.status(500).send({ message: err.message }); }
});


app.post('/:idt/mascotas', async (req, res) => {
  let mascota= req.body;
  const idt = req.params.idt;
  console.log(`POST /:idt/mascota`);
  console.log('BODY', mascota);
  try {
    // Aquí debes comparar con el ID del usuario que envías en la solicitud POST
    if (idt !== mascota.userId) {
      return res.status(403).json({ message: 'No tienes permiso para realizar esta acción.' });
    }
    mascota.userId = idt; // Actualiza el ID del usuario con el valor de idt
    res.json(await Mascota(mascota).save());
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
});


app.get('/:idt/mascotas/:id', async (req, res) => {
  let idt = req.params.idt;
  let id = req.params.id;
  console.log(`GET /${idt}/mascota/${id}`);
  try { res.json(await Mascota.findById(id)) }
  catch (err) { res.status(500).send({ message: err.message }); }
});

app.delete('/:idt/mascotas/:id', async (req, res) => {
  let id = req.params.id;
  console.log(`DELETE /:idt/mascota/${id}`);
  try { res.json(await Mascota.findByIdAndDelete(id)); }
  catch (err) { res.status(500).send({ message: err.message }); }
});

app.delete('/:idt/mascotas', async (req, res) => {
  console.log(`DELETE /:idt/mascota`);
  try { res.json(await Mascota.deleteMany()); }
  catch (err) { res.status(500).send({ message: err.message }); }
});

app.put('/:idt/mascotas/:id', async (req, res) => {
  let id = req.params.id;
  console.log(`PUT /:idt/mascota/${id}`);
  try {
    let mascota = await Mascota.findById(id);
    Object.assign(mascota, req.body);
    res.json(await mascota.save());
  } catch (err) { res.status(500).send({ message: err.message }); }
});


//Muertos//
const Muerto = require('./model/muerto');  

app.get('/:idt/muertos', async (req, res) => {
  let idt = req.params.idt;
  
  console.log('GET /:idt/muerto');
  try { 
    res.json(await Muerto.find({ userId: idt })); }
  catch (err) { res.status(500).send({ message: err.message }); }
});


app.post('/:idt/muertos', async (req, res) => {
  let muerto= req.body;
  const idt = req.params.idt;
  console.log(`POST /:idt/muerto`);
  console.log('BODY', muerto);
  try {
    // Aquí debes comparar con el ID del usuario que envías en la solicitud POST
    if (idt !== muerto.userId) {
      return res.status(403).json({ message: 'No tienes permiso para realizar esta acción.' });
    }
    muerto.userId = idt; // Actualiza el ID del usuario con el valor de idt
    res.json(await Muerto(muerto).save());
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
});


app.get('/:idt/muertos/:id', async (req, res) => {
  let idt = req.params.idt;
  let id = req.params.id;
  console.log(`GET /${idt}/muerto/${id}`);
  try { res.json(await Muerto.findById(id)) }
  catch (err) { res.status(500).send({ message: err.message }); }
});

app.delete('/:idt/muertos/:id', async (req, res) => {
  let id = req.params.id;
  console.log(`DELETE /:idt/muerto/${id}`);
  try { res.json(await Muerto.findByIdAndDelete(id)); }
  catch (err) { res.status(500).send({ message: err.message }); }
});

app.delete('/:idt/muertos', async (req, res) => {
  console.log(`DELETE /:idt/muerto`);
  try { res.json(await Muerto.deleteMany()); }
  catch (err) { res.status(500).send({ message: err.message }); }
});

app.put('/:idt/muertos/:id', async (req, res) => {
  let id = req.params.id;
  console.log(`PUT /:idt/muerto/${id}`);
  try {
    let muerto = await Muerto.findById(id);
    Object.assign(muerto, req.body);
    res.json(await muerto.save());
  } catch (err) { res.status(500).send({ message: err.message }); }
});


//

app.put('/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const { name, email, password, username } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const updatedUser = {
      name,
      email,
      password: hashedPassword,
      servicioLocal: uuidv4(),
      username,
    };

    const result = await usersCollection.updateOne({ id: userId }, { $set: updatedUser });

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({ message: 'Usuario actualizado exitosamente' });
  } catch (error) {
    console.error('Error al actualizar usuario por ID:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});



// Configura la carpeta "public" para servir archivos estáticos
app.use(express.static('public'));

const port = parseInt(process.env.PORT) || 3000;
async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/tareas-sample');
}
main();
app.listen(port, () => {
console.log(`helloworld: listening on port ${port}`);
});

