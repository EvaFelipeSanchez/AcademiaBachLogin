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
const { ObjectId } = require('mongodb');

const mongoURI = 'mongodb+srv://evafelipe:BL8h6Y4AguSZWB56@clusteracademiabach.wz3n9ev.mongodb.net/ClusterAcademiaBach?retryWrites=true&w=majority';


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const initializePassport = require('./passport-config');

const db = mongoose.connection;

db.on('connected', _ => { console.log('DB CONNECTED'); });
db.on('disconnected', _ => { console.log('DB DISCONNECTED'); });
db.on('error', err => { console.error('DB ERROR', err); });

app.use(bodyParser.urlencoded({ extended: true }));


const usersCollection = mongoose.connection.collection('users');

app.use('*.js', (req, res, next) => {
  res.header('Content-Type', 'application/javascript');
  next();
});
app.use(express.json());



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

      const user = await usersCollection.findOne({ id: id });     
      return user;
    } catch (error) {
      console.error(error);
      return null;

    }
  }
);


app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: false }));

const secrett = process.env.SESSION_SECRET || 'default-secret';

app.use(session({
secret: secrett, 
resave: false,
saveUninitialized: true
}));
app.use(flash());


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



app.post('/login', checkNotAuthenticated, passport.authenticate('local', {  
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
    req.flash('success', 'Usuario registrado exitosamente');
    res.redirect('/login');
  } catch (error) {
    console.error('Error al registrar usuario:', error);
    req.flash('error', 'Error interno del servidor');
    res.redirect('/register');
  }
});

app.post('/guardar', async (req, res) => {
  try {
    
    await usersCollection.create(req.body);
    console.log('Datos insertados con éxito');
    res.redirect('/');
    console.log('Ruta /guardar llamada');
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: err.message });
  }
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



app.get('/', (req, res) => {
  res.redirect('/login');
});


app.get('/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await usersCollection.findOne({ id: userId });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    

    console.log('User ID:', userId);
    res.render('index.ejs', { user });
  
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
    
    if (idt !== tarea.userId) {
      return res.status(403).json({ message: 'No tienes permiso para realizar esta acción.' });
    }
    tarea.userId = idt; 
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


const Puntos = require('./model/puntos');  

app.get('/:idt/puntos', async (req, res) => {
  let idt = req.params.idt;
  
  console.log('GET /:idt/puntos');
  try { 
    res.json(await Puntos.find({ userId: idt })); }
  catch (err) { res.status(500).send({ message: err.message }); }
});


app.put('/:idt/puntos/:id', async (req, res) => {
  let idt = req.params.idt;
  let id = req.params.id;
  console.log(`PUT /:idt/puntos/${id}`);
  try {
    let puntos = await Puntos.findById(id);

    if (puntos.userId !== idt) {
      return res.status(403).send({ message: 'Forbidden' });
    }

    Object.assign(puntos, req.body);

    const updatedPuntos = await puntos.save();
    res.json(updatedPuntos);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
});



app.post('/:idt/puntos', async (req, res) => {
  let puntos = req.body;
  const idt = req.params.idt;
  console.log(`POST /:idt/puntos`);
  console.log('BODY', puntos);
  try {

    if (idt !== puntos.userId) {
      return res.status(403).json({ message: 'No tienes permiso para realizar esta acción.' });
    }
    puntos.userId = idt;
    res.json(await Puntos(puntos).save());
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
  });

  app.delete('/:idt/puntos', async (req, res) => {
    console.log(`DELETE /:idt/puntos`);
    try { res.json(await Puntos.deleteMany()); }
    catch (err) { res.status(500).send({ message: err.message }); }
  });
  
  

const MascotaPrincipal = require('./model/mascotaprincipal');  


app.get('/:idt/mascotaprincipal', async (req, res) => {
  let idt = req.params.idt;
  
  console.log('GET /:idt/mascotaprincipal');
  try { 
    res.json(await MascotaPrincipal.find({ userId: idt })); }
  catch (err) { res.status(500).send({ message: err.message }); }
});


app.post('/:idt/mascotaprincipal', async (req, res) => {
  let mascotaprincipal = req.body;
  const idt = req.params.idt;
  console.log(`POST /:idt/mascotaprincipal`);
  console.log('BODY', mascotaprincipal);
  try {

    if (idt !== mascotaprincipal.userId) {
      return res.status(403).json({ message: 'No tienes permiso para realizar esta acción.' });
    }
    mascotaprincipal.userId = idt;
    res.json(await MascotaPrincipal(mascotaprincipal).save());
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
  });

  app.delete('/:idt/mascotaprincipal', async (req, res) => {
    console.log(`DELETE /:idt/mascotaprincipal`);
    try { res.json(await MascotaPrincipal.deleteMany()); }
    catch (err) { res.status(500).send({ message: err.message }); }
  });
  
  app.get('/:idt/mascotaprincipal/:id', async (req, res) => {
    let idt = req.params.idt;
    let id = req.params.id;
    console.log(`GET /${idt}/mascotaprincipal/${id}`);
    try { res.json(await MascotaPrincipal.findById(id)) }
    catch (err) { res.status(500).send({ message: err.message }); }
  });

  app.put('/:idt/mascotaprincipal/:id', async (req, res) => {
    try {
      const idt = req.params.idt;
      const id = req.params.id;
      console.log('ID recibido:', id);
      console.log(`PUT /${idt}/mascotaprincipal/${id}`);

      const mascotaprincipal = await MascotaPrincipal.findById(id);

      if (!mascotaprincipal) {
        console.log('Mascota principal no encontrada. ID:', id);
        return res.status(404).json({ message: 'Mascota principal no encontrada', id: id });
      }
  

      if (mascotaprincipal.userId !== idt) {
        return res.status(403).json({ message: 'Forbidden' });
      }
  
      Object.assign(mascotaprincipal, req.body);
  
      const updatedmascotaprincipal = await mascotaprincipal.save();
      res.json(updatedmascotaprincipal);
    } catch (err) {
      console.error('Error en la solicitud PUT:', err);
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  });



const DisplayValue = require('./model/displayValue');  


app.get('/:idt/displayValue', async (req, res) => {
  let idt = req.params.idt;
  
  console.log('GET /:idt/displayValue');
  try { 
    res.json(await DisplayValue.find({ userId: idt })); }
  catch (err) { res.status(500).send({ message: err.message }); }
});


app.post('/:idt/displayValue', async (req, res) => {
  let displayValue = req.body;
  const idt = req.params.idt;
  console.log(`POST /:idt/displayValue`);
  console.log('BODY', displayValue);
  try {

    if (idt !== displayValue.userId) {
      return res.status(403).json({ message: 'No tienes permiso para realizar esta acción.' });
    }
    displayValue.userId = idt;
    res.json(await DisplayValue(displayValue).save());
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
  });

  app.delete('/:idt/displayValue', async (req, res) => {
    console.log(`DELETE /:idt/displayValue`);
    try { res.json(await DisplayValue.deleteMany()); }
    catch (err) { res.status(500).send({ message: err.message }); }
  });
  
  app.get('/:idt/displayValue/:id', async (req, res) => {
    let idt = req.params.idt;
    let id = req.params.id;
    console.log(`GET /${idt}/displayValue/${id}`);
    try { res.json(await DisplayValue.findById(id)) }
    catch (err) { res.status(500).send({ message: err.message }); }
  });

  app.put('/:idt/displayValue/:id', async (req, res) => {
    try {
      const idt = req.params.idt;
      const id = req.params.id;
      console.log('ID recibido:', id);
      console.log(`PUT /${idt}/displayValue/${id}`);

      const displayValue = await DisplayValue.findById(id);

      if (!displayValue) {
        console.log('DisplayValue no encontrada. ID:', id);
        return res.status(404).json({ message: 'DisplayValue no encontrada', id: id });
      }
  

      if (displayValue.userId !== idt) {
        return res.status(403).json({ message: 'Forbidden' });
      }
  
      Object.assign(displayValue, req.body);
  
      const updateddisplayValue = await displayValue.save();
      res.json(updateddisplayValue);
    } catch (err) {
      console.error('Error en la solicitud PUT:', err);
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  });


const BarraAvance = require('./model/barraAvance');  


app.get('/:idt/barraAvance', async (req, res) => {
  let idt = req.params.idt;
  
  console.log('GET /:idt/barraAvance');
  try { 
    res.json(await BarraAvance.find({ userId: idt })); }
  catch (err) { res.status(500).send({ message: err.message }); }
});


app.post('/:idt/barraAvance', async (req, res) => {
  let barraAvance = req.body;
  const idt = req.params.idt;
  console.log(`POST /:idt/barraAvance`);
  console.log('BODY', barraAvance);
  try {

    if (idt !== barraAvance.userId) {
      return res.status(403).json({ message: 'No tienes permiso para realizar esta acción.' });
    }
    barraAvance.userId = idt;
    res.json(await BarraAvance(barraAvance).save());
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
  });

  app.delete('/:idt/barraAvance', async (req, res) => {
    console.log(`DELETE /:idt/barraAvance`);
    try { res.json(await BarraAvance.deleteMany()); }
    catch (err) { res.status(500).send({ message: err.message }); }
  });
  
  app.get('/:idt/barraAvance/:id', async (req, res) => {
    let idt = req.params.idt;
    let id = req.params.id;
    console.log(`GET /${idt}/barraAvance/${id}`);
    try { res.json(await BarraAvance.findById(id)) }
    catch (err) { res.status(500).send({ message: err.message }); }
  });

  app.put('/:idt/barraAvance/:id', async (req, res) => {
    try {
      const idt = req.params.idt;
      const id = req.params.id;
      console.log('ID recibido:', id);
      console.log(`PUT /${idt}/barraAvance/${id}`);

      const barraAvance = await BarraAvance.findById(id);

      if (!barraAvance) {
        console.log('BarraAvance no encontrada. ID:', id);
        return res.status(404).json({ message: 'BarraAvance no encontrada', id: id });
      }
  

      if (barraAvance.userId !== idt) {
        return res.status(403).json({ message: 'Forbidden' });
      }
  
      Object.assign(barraAvance, req.body);
  
      const updatedbarraAvance = await barraAvance.save();
      res.json(updatedbarraAvance);
    } catch (err) {
      console.error('Error en la solicitud PUT:', err);
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  });


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
    
    if (idt !== papelera.userId) {
      return res.status(403).json({ message: 'No tienes permiso para realizar esta acción.' });
    }
    papelera.userId = idt; 
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
    
    if (idt !== mascota.userId) {
      return res.status(403).json({ message: 'No tienes permiso para realizar esta acción.' });
    }
    mascota.userId = idt; 
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
   
    if (idt !== muerto.userId) {
      return res.status(403).json({ message: 'No tienes permiso para realizar esta acción.' });
    }
    muerto.userId = idt; 
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


app.use(express.static('public'));

const port = parseInt(process.env.PORT) || 3000;

async function main() {

   await mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });
}
main();

app.listen(port, () => {
console.log(`helloworld: listening on port ${port}`);
});

