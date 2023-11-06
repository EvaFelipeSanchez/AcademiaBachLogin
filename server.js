if(process.env.NODE_ENV !== 'production'){
    require('dotenv').config()
}
const express = require('express');
const app = express();
const bcrypt = require('bcrypt');
const passport = require('passport');
const flash = require('express-flash');
const session = require('express-session');
const methodOverride = require('method-override');
const MongoClient = require('mongodb').MongoClient;
const bodyParser = require('body-parser');


// Middleware para analizar datos del formulario HTML
app.use(bodyParser.urlencoded({ extended: true }));

const initializePassport = require('./passport-config');
initializePassport(
  passport,
  email => users.find(user => user.email === email),
  id => users.find(user => user.id === id)
)




const users = [];

app.set('view-engine', 'ejs');
app.use(express.urlencoded({ extended: false }));
app.use(flash())
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}))

app.use(passport.initialize())
app.use(passport.session())
app.use(methodOverride('_method'))


// Ruta para mostrar el formulario HTML
app.get('/', checkAuthenticated, (req, res) => {
  // Envia el archivo HTML en respuesta a la solicitud GET
  res.sendFile(__dirname + '/public/index.html');
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Servidor escuchando en el puerto ${port}`);
});

/*
app.get('/', checkAuthenticated, (req, res) => {
    res.render('index.ejs', { name: req.user.name});
});
*/

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
    try{
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        users.push({
            id: Date.now().toString(),
            name: req.body.name,
            email: req.body.email, 
            password: hashedPassword

        });
        res.redirect('/login');
        
    } catch {
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



app.listen(3000);