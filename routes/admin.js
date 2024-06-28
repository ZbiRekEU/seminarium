var express = require('express');
var router = express.Router();
var user = require('../workplace/user.js')
var admin = require('../workplace/admin.js')
var sms = require('../workplace/sms.js')
var Admin = new admin();
var User = new user()
var multer = require('multer')
var upload = multer({ dest: './public/images' })


router.get('/wszystkie-zamowienia', async (req, res) => {

  var perPage = req.query.perPage;
  if (perPage == undefined) perPage = 20
  // console.log(perPage);
  var order_to_parse = await Admin.getAllOrders()

  // console.log(order_to_parse);
  if (order_to_parse.error == null) {
    var orders_parsed = await User.parseTableRowData(order_to_parse)

    orders_parsed = await Promise.all(orders_parsed.map(async (order, index) => {
      let ids = await User.getAllProductsIDForOrder(order.order_id);
      let temp = []

       // dzień tygodnia
      var dateParts = order.planned_date.split('.'); // Rozdziela datę na części

      // Pobiera poszczególne części daty
      var day = parseInt(dateParts[0], 10);
      var month = parseInt(dateParts[1], 10) - 1; // Odejmuje 1 od miesiąca, ponieważ indeksy miesięcy w obiekcie Date zaczynają się od 0
      var year = parseInt(dateParts[2], 10);
      var newDate = new Date(year, month, day );
      const computedDayOfWeek = newDate.getDay();

      var dayOfWeek = ['niedziela', 'poniedzialek', 'wtorek', 'sroda', 'czwartek', 'piatek', 'sobota'][computedDayOfWeek];

      orders_parsed[index].planned_date_dayOfWeek = dayOfWeek
      
      
      let products = await Promise.all(ids.map(async (id, index2)=>{
        temp.push( {
          product_id: id.product_id,
          product_amount: id.product_amount,
        })

        let productDetails = await User.getProductDetails(temp[index2].product_id);
        temp[index2].product_name = productDetails[0]?.name
        temp[index2].package_amount = productDetails[0]?.package_amount
        

        let packagesDetails = await User.getPackagesDetailsFromProduct(temp[index2].product_id)
        temp[index2].packages = packagesDetails
       
        return temp;
        
      }))
      orders_parsed[index].products=products[0] ;
      return orders_parsed[index]

    }));

    
    res.render('Admin/zamowienia', { orders: orders_parsed, error: null, perPage: perPage, clearFlag: false });
  } else {

    res.render('Admin/zamowienia', { orders: null, error: order_to_parse.error, perPage: perPage, clearFlag: false });
  }
})

router.post('/wszystkie-zamowienia', async (req, res) => {

  var perPage = req.query.perPage;
  if (perPage == undefined) perPage = 20

  var nazwaNadawcy = req.body.nazwaNadawcy.toUpperCase();
  var nazwaOdbiorcy = req.body.nazwaOdbiorcy.toUpperCase();
  var status = req.body.status.toUpperCase();
  var wniesienie = req.body.wniesienie.toUpperCase();
  var rozliczone = req.body.rozliczone.toUpperCase();
  // console.log("================");
  // console.log(nazwaNadawcy);
  // console.log(nazwaOdbiorcy);
  // console.log(status);
  // console.log(wniesienie);
  // console.log(rozliczone);
  // console.log("================");



  var order_to_parse = await Admin.getAllOrdersToFilter()

  order_to_parse = await order_to_parse.filter((order) => {
    let flag = true;
    if (nazwaNadawcy !== '') order.username.toUpperCase() == nazwaNadawcy ? '' : flag = false;
    if (nazwaOdbiorcy !== '') order.customer_name.toUpperCase() == nazwaOdbiorcy ? '' : flag = false;
    if (status !== 'DOWOLNY') order.status.toUpperCase() == status ? '' : flag = false;
    if (wniesienie !== 'DOWOLNY') order.bringing.toUpperCase() == wniesienie ? '' : flag = false;
    if (rozliczone !== 'DOWOLNY') order.settled.toUpperCase() == rozliczone ? '' : flag = false;

    return flag
  })

  // console.log(order_to_parse[0]);

  // console.log(order_to_parse);
  if (order_to_parse.error == null) {
    var orders_parsed = await User.parseTableRowData(order_to_parse)

    orders_parsed = await Promise.all(orders_parsed.map(async (order, index) => {
      let ids = await User.getAllProductsIDForOrder(order.order_id);
      let temp = []

             // dzień tygodnia
      var dateParts = order.planned_date.split('.'); // Rozdziela datę na części

      // Pobiera poszczególne części daty
      var day = parseInt(dateParts[0], 10);
      var month = parseInt(dateParts[1], 10) - 1; // Odejmuje 1 od miesiąca, ponieważ indeksy miesięcy w obiekcie Date zaczynają się od 0
      var year = parseInt(dateParts[2], 10);
      var newDate = new Date(year, month, day );
      const computedDayOfWeek = newDate.getDay();

      var dayOfWeek = ['niedziela', 'poniedzialek', 'wtorek', 'sroda', 'czwartek', 'piatek', 'sobota'][computedDayOfWeek];

      orders_parsed[index].planned_date_dayOfWeek = dayOfWeek
      let products = await Promise.all(ids.map(async (id, index2)=>{
        temp.push( {
          product_id: id.product_id,
          product_amount: id.product_amount,
        })

        let productDetails = await User.getProductDetails(temp[index2].product_id);
        temp[index2].product_name = productDetails[0]?.name
        temp[index2].package_amount = productDetails[0]?.package_amount
        

        let packagesDetails = await User.getPackagesDetailsFromProduct(temp[index2].product_id)
        temp[index2].packages = packagesDetails
       
        return temp;
        
      }))
      orders_parsed[index].products=products[0] ;
      return orders_parsed[index]

    }));
    console.log(orders_parsed);

    res.render('Admin/zamowienia', { orders: orders_parsed, error: null, perPage: perPage, clearFlag: true });
  } else {
    res.render('Admin/zamowienia', { orders: null, error: order_to_parse.error, perPage: perPage, clearFlag: true });
  }
})

router.post('/rozliczenia', async (req, res) => {

  let ids = []
  ids = req.body.ids.split(',');
  // console.log(ids[0]);

  const promises = ids.map(async (order_id) => {
    let orders = []
    let temp = await Admin.getSettleData(order_id)
    // console.log(temp);
    orders.push(temp[0])
    return {
      ...temp[0]
    }
  })
  Promise.all(promises).then(data => {
    // console.log(data);

    const result = data.reduce((acc, curr) => {
      const companyId = curr.company_id;
      if (!acc[companyId]) {
        acc[companyId] = [];
      }
      acc[companyId].push(curr);
      return acc;
    }, {});

    const finalResult = Object.values(result);

    res.render('Admin/rozliczenie', { settles: finalResult });

  })
})


router.post('/eksport', async (req, res) =>{


  let ids = []
  ids = req.body.ids.split(',');
  // console.log(ids[0]);

// Dla każdego id pobiaramy dane do eksportu
  const promises = ids.map(async (order_id) => {
    let orders = []
    let temp = await Admin.getExportToRoutimoData(order_id)
    // console.log(temp);
    orders.push(temp[0])
    return {
      ...temp[0]
    }
  })


    Promise.all(promises).then(data => {
    res.render('Admin/eksport', { orders_data: data });

    }, {});


  })
router.post('/markasexported', async (req, res) => {
  let ids = req.body.Id

  await Admin.markAsExported(ids)

  res.json({ status: 'ok' });

})




router.post('/markassettled', async (req, res) => {
  let ids = req.body.Id

  await Admin.markAsSettled(ids)

  res.json({ status: 'ok' });

})


router.get('/wszyscy-uzytkownicy', async (req, res) => {

  var users_to_parse = await Admin.getAllUsers(25)
  // console.log(users_to_parse);
  if (users_to_parse.error == null) {
    var users_parsed = await User.parseTableRowDataUsers(users_to_parse)
    // console.log(users_parsed);
    res.render('Admin/wszyscy-uzytkownicy', { users: users_parsed, error: null });
  } else {
    res.render('Admin/wszyscy-uzytkownicy', { users: null, error: users_parsed.error });
  }
})

router.get('/edytuj-uzytkownika', async (req, res) => {
  let username = req.query.nazwa;
  let userdata = await User.getUserDataFromUsername(username)
  let parseuserdata = JSON.parse(JSON.stringify(userdata))
  let companydata = await User.getCompanyDataFromUserId(parseuserdata.data.user_id)
  let parsecompanydata = JSON.parse(JSON.stringify(companydata))

  var data = {
    user: parseuserdata.data,
    company: parsecompanydata.data
  }

  let company = {
    "company_id": '',
    "full_name": '',
    "short_name": '',
    "phone": '',
    "nip": '',
    "street": '',
    "house_number": '',
    "apartment_number": '',
    "city": '',
    "postal_code": '',
    "user_id": ''
  }

  if (data.company == undefined) {
    data.company = company
  }
  // console.log(data);
  res.render('Admin/edytuj-uzytkownika', data);
  // res.render('Uzytkownik/ustawienia', data);
});

router.post('/edytuj-uzytkownika', upload.single('logo'), async (req, res) => {
  var id = req.body.user_id

  var data = {
    user: {
      user_id: id,
      name: req.body.name,
      surname: req.body.surname,
      avatar: req.body.avatar,
      type: req.body.type
    },
    company: {
      user_id: id,
      phone: req.body.phone,
      nip: req.body.nip,
      full_name: req.body.full_name,
      short_name: req.body.short_name,
      city: req.body.city,
      street: req.body.street,
      house_number: req.body.house_number,
      postal_code: req.body.postal_code,
      apartment_number: req.body.apartment_number
    }
  }
  if (req.file) data.user.avatar = req.file.filename
  // console.log(data);

  var results = await User.updateUserData(data)

  res.redirect(req.get('referer'));
})

router.get('/skanuj-etykiete', async (req, res) => {
  let package_id = req.query.package_id
  let order_id = req.query.id
  let user_role = req.session.user_type

  if (user_role !== 'admin') {
    console.log('Zaloguj się na konto admina')
    return
  }

  let result = await User.updatePackageStatus({ Id_confirmation: package_id, status: 1 })
  // console.log(package_id)
  let recived = await User.checkRecivedPackages(order_id)
  if (recived.changed) {
    let emailCompany = await User.sendNotificationCompany(order_id)
    if (emailCompany.error) console.log(emailCompany.error)

    let emailClient = await User.sendNotificationClient(order_id)
    if (emailClient.error) console.log(emailClient.error)
    // result.changed = true
  }

  res.redirect('/edytuj-zamowienie?id=' + order_id)
  // res.json(result);
})

router.get("/skanuj-list-przewozowy", async (req, res) =>{
  let order_id = req.query.id;
  let user_role = req.session.user_type
  // check if user has admin role
  if (user_role !== 'admin') {
    console.log('Zaloguj się na konto admina')
    return
  }

  let result = await User.updateOrderPackagesStatus({order_id: order_id})

  result = await User.updateOrderStatus(order_id);
  // res.json({status: "ok"});
  res.redirect('/edytuj-zamowienie?id=' + order_id)
})


router.post('/aktualizuj-paczke', async (req, res) => {
  let data = req.body

  let result = await User.updatePackageStatus(data)
  // console.log(data)
  let recived = await User.checkRecivedPackages(data.order_id)
  // console.log(recived)
  if (recived.changed) {
    let emailCompany = await User.sendNotificationCompany(data.order_id)
    if (emailCompany.error) console.log(emailCompany.error)

    let emailClient = await User.sendNotificationClient(data.order_id)
    if (emailClient.error) console.log(emailClient.error)
    result.changed = true
  }

  res.json(result);
})

router.post('/edytuj-zamowienie', async (req, res) => {
  // console.log(req.body);
  var data = {
    order_id: req.body.order_id,
    customer_name: req.body.customer_name,
    city: req.body.city,
    postal_code: req.body.postal_code,
    street: req.body.street,
    customer_phone: req.body.customer_phone,
    house_number: req.body.house_number,
    apartment_number: req.body.apartment_number,
    products: '',
    price: req.body.price,
    status: req.body.status,
    status_details: req.body.status_additional_info,
    additional_info: req.body.additional_info,
    payment: req.body.payment,
    SMS_from_company: (req.body.SMS_from_company) ? (1) : (0) || 0,
    EMAIL_from_company: (req.body.EMAIL_from_company) ? (1) : (0) || 0,
    SMS_from_client: (req.body.SMS_from_client) ? (1) : (0) || 0,
    EMAIL_from_client: (req.body.EMAIL_from_client) ? (1) : (0) || 0,
    email_client: req.body.email_client,
    email_company: req.body.email_company,
    sms_client: req.body.sms_client,
    sms_company: req.body.sms_company,
    planned_date: req.body.planned_date,
    planned_time: req.body.planned_time,
    deliveryConfirmationStatus: req.body.deliveryConfirmationStatus,
    driver_phone: req.body.driver_phone,
    settled: req.body.settled,
    bringing: (req.body.bringing) ? (1) : (0) || 0,
    direction: req.body.direction
  }

  // console.log(req.body);
  // console.log("Obiekt:", data);
  await User.updateOrderData(data)


  if (req.body.prev_status !== req.body.status) {
    if (data.EMAIL_from_company == 1) {
      let emailCompany = await User.sendNotificationCompany(data.order_id)
      if (emailCompany.error) console.log(emailCompany.error)
    }

    if (data.EMAIL_from_client == 1) {
      let emailClient = await User.sendNotificationClient(data.order_id)
      if (emailClient.error) console.log(emailClient.error)
    }
  }

  //jeśli zmiana statusu uległa zmianie to zmiana w bazie, że administrator ją zmienił
  console.log(req.body.prev_delivery_confirmation_status);
  console.log(req.body.deliveryConfirmationStatus);
  if(req.body.prev_delivery_confirmation_status !== req.body.deliveryConfirmationStatus){
    let changedBy = await User.changeDeliveryConfirmationChangedBy(data.order_id, 'Administratora');
  }
	
	 //jeśli planowana data się zmieniła to status ma się ustawić na nie potwierdzono
  if(req.body.prev_delivery_date !== data.planned_date || req.body.prev_delivery_time !== data.planned_time){

    await User.setDefaultDeliveryConfirmationStatus(data.order_id)

  }

  res.redirect(req.get('Referrer'));
})

router.get('/edytuj-zamowienie', async (req, res) => {
  if (req.session.user_type !== 'admin') {
    console.log('*SECURITY ERROR* someone tried to access /edytuj-zamowienie without permissions')
    res.redirect('/')
    return
  }
  var order_id = req.query.id
  var orderData = await User.getOrderDataFromId(order_id)
  var orderParsed = JSON.parse(JSON.stringify(orderData))
  orderParsed.data.id = orderParsed.data.order_id.split('-')[0]

  let order_products_parse = await User.getProductsFromOrder(orderParsed.data.order_id)
  let order_products = JSON.parse(JSON.stringify(order_products_parse))
  let allPackages = 0
  order_products.data.forEach(element => {
    allPackages += parseInt(element.package_amount) * parseInt(element.product_amount)
  })
  orderParsed.data.allPackages = allPackages
  // console.log(order_products.data)
  // for(var i = 0; i < order_products.data.length; i++){
  //   order_products.data[i].packages = await User.getPackagesList(order_products.data[i].order_products_id)
  //   console.log(order_products.data[i].packages)
  // }

  var products_packages = await User.getPackagesListForProducts(order_products.data, 0)
  // console.log(products_packages)
  // console.log(orderParsed.data)

  res.render('Zamowienia/edytuj-zamowienie', { order: orderParsed.data, products: products_packages });
})


router.post('/wyslij-potwierdzenie', async(req, res) =>{
  console.log(req.body);

  const products = []

  for(let i=1; i<=req.body.products_amount; i++){
    products.push(req.body['product_name' + i])
  }

  const data = {
    order_id: req.body.order_id,
    customer_name: req.body.customer_name,
    planned_date: req.body.planned_date,
    planned_time: req.body.planned_time,
    customer_phone: req.body.customer_phone,
    products: products
  }

  console.log(data);

  // wysłanie SMS i zapisanie id tego SMS bo na niego będą przychodzić odpowiedzi
  let result = await sms.sendDeliveryConfirmation(data)

  if(result !== null){

    let id = result.list[0].id
    let response = await Admin.saveDeliverySMS(data.order_id, id)

  }
  // zapisanie do orders tego id

  res.redirect(req.get('Referrer'));
})


router.post('/odbierz-sms', async(req, res) =>{
  console.log(req.body);
  const sms_text = req.body.sms_text.toUpperCase();
  const sms_id = req.body.MsgId;

  console.log("response:", sms_text);
  console.log("smsID:", sms_id);

  if(sms_text === 'TAK'){
    const response = await Admin.confirmDeliveryDate(sms_id, 'Odbiorcę');
    
  } else if(sms_text === 'NIE'){
    const response = await Admin.rejectDeliveryDate(sms_id, 'Odbiorcę');
    
  } else {
    // const response = await Admin.confirmDeliveryDate();

  }


  res.status(200).send("OK");
})

router.post('/markasconfirmed', async(req, res) =>{
  console.log(req.body);
  const {order_id, who} = req.body

  const response = await Admin.confirmDeliveryDateByOrderID(order_id, who);

  res.redirect(req.get('Referrer'));
})

router.get('/odbiory', async (req, res) =>{
  let collections = await User.getAllCollections()

  if(collections){
    collections = await Promise.all(collections.map(async collection =>{
      let fetchedProduct = await User.getCollectionProducts(collection.collection_id)
      return {
        ...collection,
        products: fetchedProduct
      }
    }))    
  }

  res.render('Zamowienia/odbiory', {collections});
});

router.get('/edytuj-odbior', async (req, res) =>{
  if (req.session.user_type !== 'admin') {
    console.log('*SECURITY ERROR* someone tried to access /edytuj-zamowienie without permissions')
    res.redirect('/')
    return
  }
  var collection_id = req.query.id
  let fetchedCollection = await User.getCollectionById(collection_id)


  let collection
  if(fetchedCollection){
      let fetchedProduct = await User.getCollectionProducts(fetchedCollection[0].collection_id)
      collection = {
        ...fetchedCollection[0],
        products: fetchedProduct
      }
  }

  console.log(collection);
  res.render('Zamowienia/edytuj-odbior', {collection});
});

router.post('/edytuj-odbior', async (req, res) =>{
  if (req.session.user_type !== 'admin') {
    console.log('*SECURITY ERROR* someone tried to access /edytuj-zamowienie without permissions')
    res.redirect('/')
    return
  }

  let data = {
    collection_id: req.body.collection_id,
    producer_name: req.body.producer_name,
    producer_address: req.body.producer_address,
    collectionNumber: req.body.collectionNumber,
    additional_info: req.body.additional_info,
    status: req.body.status,
  }
  
  await User.updateCollection(data)
  
  res.redirect(req.get('Referrer'));
});




module.exports = router;
