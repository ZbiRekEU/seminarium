var express = require('express');
var router = express.Router();
var User = require('../workplace/user.js')
var user = new User()
const email = require('../workplace/email.js')
const Email = new email()
var multer = require('multer')
var upload = multer({ dest: './public/images' })

router.use(async (req, res, next) => {
  //console.log(req.session.name, req.session.user_type);


  var nologin = ["/login", "/rejestracja", "/dane-firmy", "/przypomnij-haslo", "/ustaw-haslo", "/nowe-haslo", "/faktura", "/etykieta", "/regulamin", '/status', '/odbierz-sms', '/rebuildDatabase']

  if (typeof req.session.name == 'undefined' && req.path.indexOf('/public') == -1) {
    for (var i = 0; i < nologin.length; i++) {
      if (req.path == nologin[i]) {
        next()
        return
      }
    }
    // console.log('redirect to login page');
    res.redirect('/login')
    //next()
  } else {
    res.locals.type = req.session.user_type
    // console.log(req.session.name);
    if (typeof req.session.name != 'undefined') res.locals.avatar = await user.getAvatar(req.session.name)
    else res.locals.avatar = 'avatar.png'
    // console.log('logged as: ' +  req.session.name);
    next()
  }

})


router.get('/etykieta', async (req, res) => {
  let order_id = req.query.id
  let labels = await user.getShippingLabels(order_id)
  let orderData, userParsed, packages

  if (labels.error) {
    res.redirect(req.headers.referrer || req.headers.referer)
    return
  }

  orderData = JSON.parse(JSON.stringify(await user.getOrderDataFromId(order_id))) || null
  userParsed = JSON.parse(JSON.stringify(await user.getUserDataFromOrderId(order_id))) || null

  packages = labels.data || []

  orderData.data.date = await user.getOrderDate(order_id)
  orderData.data.id = orderData.data.order_id.split('-')[0]

  let amount = {}

  let unique = [], limit = 0; product = 0;

  for (let i = 0; i < packages.length; i++) {

    if (limit == 0) {
      unique = []
      ++product
    }


    if (unique.indexOf(packages[i].name) === -1) {

      unique.push(packages[i].name);
      limit = packages[i].package_amount

    }

    --limit

    packages[i].label = product

  }

  amount.labels = product

  res.render('Zamowienia/etykieta', { packages, order: orderData.data, user: userParsed.data, amount });
});

router.post('/etykiety', async (req, res) => {

  let ids = []
  ids = req.body.ids.split(',');


  const promises = ids.map(async (order_id) => {

    let labels = await user.getShippingLabels(order_id)
    let orderData, userParsed, packages

    if (labels.error) {
      res.redirect(req.headers.referrer || req.headers.referer)
      return
    }

    orderData = JSON.parse(JSON.stringify(await user.getOrderDataFromId(order_id))) || null
    userParsed = JSON.parse(JSON.stringify(await user.getUserDataFromOrderId(order_id))) || null

    packages = labels.data || []

    orderData.data.date = await user.getOrderDate(order_id)
    orderData.data.id = orderData.data.order_id.split('-')[0]

    let amount = {}
    let unique = [], limit = 0; product = 0;

    for (let i = 0; i < packages.length; i++) {

      if (limit == 0) {
        unique = []
        ++product
      }

      if (unique.indexOf(packages[i].name) === -1) {
        unique.push(packages[i].name);
        limit = packages[i].package_amount
      }
      --limit
      packages[i].label = product
    }

    amount.labels = product

    return {
      packages: packages,
      order: orderData.data,
      user: userParsed.data,
      amount: amount
    }

  })

  Promise.all(promises).then(dataArray => {
    console.log(dataArray)
    res.render('Zamowienia/etykiety', { dataArray: dataArray });
  })


});

router.post('/markasprinted', async (req, res) => {
  let ids = req.body.Id

  await user.markAsPrinted(ids)

  res.json({ status: 'ok' });

});


router.get('/login', function (req, res) {
  let data = {
    error: false,
    info: false
  }

  if (req.query.error != null) data.error = true
  if (req.query.info != null) data.info = true
  res.render('Uzytkownik/zaloguj', data);
});

router.post('/login', async (req, res) => {
  let name = req.body.username
  let password = req.body.password
  let result = await user.login(name, password)

  if (result.error == null) {
    req.session.name = name
    req.session.user_type = result.data.type
    req.session.user_id = result.data.user_id
    res.redirect('/')
  } else {
    res.redirect('/login?error=zle-dane-logowania')
  }
});

router.get('/wyloguj', async (req, res) => {
  req.session.destroy();
  res.redirect('/login')
});


router.get('/rejestracja', function (req, res) {
  res.render('Uzytkownik/rejestracja', { error: false });
});

router.post('/rejestracja', upload.single('logo'), async (req, res) => {
  let userData = req.body;
  if (req.file) userData.avatar = req.file.filename

  console.log(userData);
  if (userData.username.indexOf(' ') != -1) return res.render('Uzytkownik/rejestracja', { error: 'Nazwa użytkownika nie może mieć w sobie spacji.' });
  if (userData.password.length < 6) return res.render('Uzytkownik/rejestracja', { error: 'Hasło musi zawierać conajmniej 6 znaków' });

  let result = await user.register(userData)

  if (result.error) {
    res.render('Uzytkownik/rejestracja', { error: result.error });
  } else {
    console.log("Rejestracja użytkownika: " + userData.username, result.id)
    req.session.name = userData.username
    req.session.user_type = 'user'
    req.session.user_id = result.id
    await user.createCompanyRecord(result.id)
    res.render('Uzytkownik/dane_firmy', { user_id: result.id, error: false });
  }
});

router.post('/dane-firmy', async (req, res) => {
  let companyData = req.body;
  console.log(companyData);
  let result = await user.addCompanyData(companyData)

  res.redirect('/')
});




router.get('/przypomnij-haslo', function (req, res) {
  res.render('Uzytkownik/przypomnij-haslo');
});

router.get('/regulamin', function (req, res) {
  res.render('Uzytkownik/regulamin');
});


router.post('/przypomnij-haslo', async (req, res) => {
  let email = req.body.email;
  var recovery = await user.recoveryPassword(email)
  console.log("ee: " + email, recovery);
  console.log(recovery);
  if (recovery.error == null) {
    console.log('sending email to ' + email);
    var result = await Email.sendRecoveryMail(email, recovery.data)
  }
  res.render('Uzytkownik/nowe-haslo-mail');
});

router.get('/nowe-haslo', function (req, res) {
  res.render('Uzytkownik/nowe-haslo-mail');
});

router.get('/ustaw-haslo', function (req, res) {
  let code = req.query.code
  console.log(code);
  res.render('Uzytkownik/ustaw-haslo', { code: code });
});

router.post('/ustaw-haslo', function (req, res) {
  let code = req.body.code
  let password = req.body.password

  console.log(code, password);
  let result = user.recoveryPasswordUpdate(password, code)
  if (result.error == null) {
    res.redirect('/login?info=pomyslnie-zmieniono-haslo');
  } else {
    res.render('Uzytkownik/przypomnij-haslo');
  }
});







module.exports = router;
