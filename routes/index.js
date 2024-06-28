var express = require('express');
var router = express.Router();
const axios = require('axios').default;
const utf8 = require('utf8');
var user = require('../workplace/user.js')
var admin = require('../workplace/admin.js');
const email = require('../workplace/email.js');
// var pdf = require('../workplace/pdf.js')
var Admin = new admin();
var User = new user();


router.post('/edytuj-moje-zamowienie', async (req, res) => {
  var data = {
    order_id: req.body.order_id,
    customer_name: req.body.customer_name,
    city: req.body.city,
    postal_code: req.body.postal_code,
    street: req.body.street,
    customer_phone: req.body.customer_phone,
    house_number: req.body.house_number,
    apartment_number: req.body.apartment_number,
    price: req.body.price,
    payment: req.body.payment,
    SMS_from_company: (req.body.SMS_from_company) ? (1) : (0) || 0,
    EMAIL_from_company: (req.body.EMAIL_from_company) ? (1) : (0) || 0,
    SMS_from_client: (req.body.SMS_from_client) ? (1) : (0) || 0,
    EMAIL_from_client: (req.body.EMAIL_from_client) ? (1) : (0) || 0,
    email_client: req.body.email_client,
    email_company: req.body.email_company,
    sms_client: req.body.sms_client,
    sms_company: req.body.sms_company,
    additional_info: req.body.additional_info,
    bringing: (req.body.bringing) ? (1) : (0) || 0,
    direction: req.body.direction
  }

  // console.log(req.body);
  // console.log(req.body);
  await User.updateMyOrderData(data)


  let products = null
  if (req.body.productJSON !== '') products = JSON.parse(req.body.productJSON)
  if (products !== null) {
    // console.log("Edit: " + products)
    await User.deleteProductsFromOrder(req.body.order_id)
    await User.addProductsToOrder(products, req.body.order_id)

    let prod_list = await User.getProductsFromOrder(req.body.order_id)

    prod_list.data.forEach(async element => {
      await User.addPackagesToOrder(element.order_products_id, element.product_amount, element.package_amount)
    })
  }

  res.redirect(req.get('Referrer'));
})

router.get('/edytuj-moje-zamowienie', async (req, res) => {


  var order_id = req.query.id
  var orderData = await User.getOrderDataFromId(order_id)
  var orderParsed = JSON.parse(JSON.stringify(orderData))
  orderParsed.data.id = orderParsed.data.order_id.split('-')[0]

  let order_products_parse = await User.getProductsFromOrder(orderParsed.data.order_id)
  let order_products = JSON.parse(JSON.stringify(order_products_parse))
  //console.log(order_products)

  let nick = req.session.name;
  let products_to_parse = await User.getAllProductsFromUsername(nick)
  let products_parsed = null
  if (products_to_parse.error == null) {
    products_parsed = await User.parseTableRowData(products_to_parse.data)
  }

  res.render('Zamowienia/edytuj-moje-zamowienie', { order: orderParsed.data, products: products_parsed, order_products: order_products.data });
})


router.get('/usun-zamowienie', async (req, res) => {
  let id = req.query.id
  let user_id = req.session.user_id
  await User.deleteOrder(id, user_id)
  res.redirect('/moje-zamowienia');

})

router.get('/usun-produkt', async (req, res) => {
  let id = req.query.id
  let user_type = req.session.user_type

  if (user_type == 'admin') await User.deleteProduct(id)
  res.redirect('/moje-produkty');

})

router.post('/dodaj-produkt', async (req, res) => {
  let data = req.body
  console.log(req.body);
  data.user_id = req.session.user_id

  if (data.package_amount < 1) data.package_amount = 1

  if (data.SaveInMyProducts == '1') data.showInAccount = 1
  else data.showInAccount = 0

  if (data.fromCollection) {
    var packageAmount = parseInt(data.package_amount);
    var productAmount = parseInt(data.amount);
    var packages = [];

    for (var j = 1; j <= productAmount; j++) {
      for (var i = 1; i <= packageAmount; i++) {
        var package = {
          width: 0,
          height: 0,
          depth: 0,
          volume: 0,
          weight: 0
        };

        packages.push(package);
      }
    }

  } else {

    var packageAmount = parseInt(data.package_amount);
    var productAmount = parseInt(data.amount);
    var packages = [];

    for (var j = 1; j <= productAmount; j++) {
      for (var i = 0; i < packageAmount; i++) {
        var package = {
          width: parseFloat(data.packages[i].width !== '' ? data.packages[i].width : 0),
          height: parseFloat(data.packages[i].height !== '' ? data.packages[i].height : 0),
          depth: parseFloat(data.packages[i].depth !== '' ? data.packages[i].depth : 0),
          volume: parseFloat(data.packages[i].volume !== '' ? data.packages[i].volume : 0),
          weight: parseFloat(data.packages[i].weight !== '' ? data.packages[i].weight : 0)
        };

        packages.push(package);
      }
    }

  }

  let parsedData = {
    name: data.name,
    package_amount: (data.package_amount !== '') ? data.package_amount * data.amount : data.amount,
    amount: (data.amount !== '') ? data.amount : 1,
    packages: packages[0],
    user_id: data.user_id,
    showInAccount: 0,
  }


  //Utworzenie produktu i zapisanie jego id
  var result = await User.addProduct(parsedData)


  //dla każdej paczki utworzenie rekordu w packages
  if (result.id !== null) {
    var status = await User.addPackages(result.id, packages)
    // console.log(status);

  }



  if (data.returnJson == '1') {
    res.json({ product_id: result.id, error: result.error })
  } else {
    res.redirect('/moje-produkty')
  }
})

router.post('/edytuj-produkt', async (req, res) => {
  let data = req.body
  data.user_id = req.session.user_id

  //masz product_id, trzeba usunąć wszystkie paczki o takim product_id
  await User.removeProductPackages(data.product_id)

  //zmiana rekordu products

  var packageAmount = parseInt(data.package_amount);
  var productAmount = parseInt(data.amount);
  var packages = [];
  for (var j = 1; j <= productAmount; j++) {
    for (var i = 1; i <= packageAmount; i++) {
      var package = {
        width: parseFloat(data['width' + i] !== '' ? data['width' + i] : 0),
        height: parseFloat(data['height' + i] !== '' ? data['height' + i] : 0),
        depth: parseFloat(data['depth' + i] !== '' ? data['depth' + i] : 0),
        volume: parseFloat(data['volume' + i] !== '' ? data['volume' + i] : 0),
        weight: parseFloat(data['weight' + i] !== '' ? data['weight' + i] : 0)
      };

      packages.push(package);
    }
  }


  let parsedData = {
    name: data.name,
    package_amount: (data.package_amount !== '') ? data.package_amount & data.amount : data.amount,
    amount: (data.amount !== '') ? data.amount : 1,
    packages: packages[0],
  }


  let result = await User.editProduct(data.product_id, parsedData)

  //dodanie nowych paczek 

  // console.log("packages:", packages);

  if (result.id !== null) {
    var status = await User.addPackages(data.product_id, packages)
    // console.log(status);

  }

  if (data.returnJson == '1') {
    res.json({ product_id: result.id, error: result.error })
  } else {
    res.redirect('/moje-produkty')
  }

})



router.get('/moje-produkty', async (req, res) => {
  let username = req.session.name;
  var products_to_parse = await User.getAllProductsFromUsername(username)
  //console.log(products_to_parse);
  if (products_to_parse.error == null) {
    var products_parsed = await User.parseTableRowData(products_to_parse.data)

    // console.log("products_parsed:", products_parsed);

    // load each package details 

    products_parsed = await Promise.all(products_parsed.map(async (product, index) => {
      let result = await User.getAllProductPackages(product.product_id);
      let temp = [];
      result.data.forEach((package, index) => {
        temp.push({
          package_id: package.package_id,
          product_id: package.product_id,
          width: package.width,
          height: package.height,
          depth: package.depth,
          volume: package.volume,
          weight: package.weight,
        });
      });
      products_parsed[index].packages = temp;
      return products_parsed;
    }));

    // console.log("Parsed2:", products_parsed[0]);

    var send = { products: products_parsed[0], error: null }
    res.render('Uzytkownik/produkty', send);

  } else {
    console.log("eerr:" + products_to_parse.error);
    res.render('Uzytkownik/produkty', { products: [], error: products_to_parse.error });
  }
})

router.get('/', async (req, res) => {
  // console.log(req.session.user_type, 'trututut');
  if (req.session.user_type == 'admin') {
    //console.log(data)
    var data = await Admin.getDashboardData()
    res.render('Admin/panel', data);
  } else {
    res.redirect('/moje-zamowienia');
  }
})

router.get('/moje-zamowienia', async (req, res) => {
  let username = req.session.name;
  let user_to_parse = await User.getAllOrdersFromUsername(username)
  //console.log(user_to_parse)
  if (user_to_parse.error == null) {
    let orders_parsed = await User.parseTableRowData(user_to_parse.data)

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
      
      
      let products = await Promise.all(ids.map(async (id, index2) => {
        temp.push({
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
      orders_parsed[index].products = products[0];
      return orders_parsed[index]

    }));


    let send = { orders: orders_parsed, error: null }
    res.render('Zamowienia/moje-zamowienia', send);
  } else {
    console.log("eerr:" + user_to_parse.erro);
    res.render('Zamowienia/moje-zamowienia', { orders: [], error: user_to_parse.error });
  }
})

router.get('/nowe-zamowienie', async (req, res) => {

  let nick = req.session.name;
  let userdata = await User.getAllUserDataFromUsername(nick);
  let parseuserdata = JSON.parse(JSON.stringify(userdata))
  let products_to_parse = await User.getAllProductsFromUsername(nick)
  let products_parsed = null
  if (products_to_parse.error == null) {
    products_parsed = await User.parseTableRowData(products_to_parse.data)
  }

  //console.log(products_parsed)
  //console.log(parseuserdata)

  res.render('Zamowienia/nowe-zamowienie', { user: parseuserdata.data, products: products_parsed });
})

router.post('/nowe-zamowienie', async (req, res) => {
  let data = req.body
  if (data.productJSON !== null) data.products = JSON.parse(data.productJSON)
  else data.products = null
  //console.log('Nowe zamowienie')
  //console.log(data);
  let address = data.postal_code + '+' + data.city + '+' + data.street + '+' + data.house_number + '+PL'
  data.address = address
  let maplink = 'https://www.google.com/maps/embed/v1/place?key=AIzaSyDLrSjT08HLyBz7Y7ehpX-rhxK9-x9PHR8&q=' + address
  data.map_link = maplink
  data.show_map = true
  res.render('Zamowienia/potwierdz-zamowienie', { data: data });
})

router.get('/karta-przewozowa', async (req, res) => {
  var order_id = req.query.id
  // console.log(typeof order_id);
  var orderData = await User.getOrderDataFromId(order_id)
  var orderParsed = JSON.parse(JSON.stringify(orderData))
  // console.log(orderParsed);
  orderParsed.data.id = orderParsed.data.order_id.split('-')[0]
  var userParsed = JSON.parse(JSON.stringify(await User.getUserDataFromUserId(orderParsed.data.user_id)))
  var date = await User.getOrderDate(orderParsed.data.order_id)
  orderParsed.data.date = date

  let order_products_parse = await User.getProductsFromOrder(orderParsed.data.order_id)
  let order_products = JSON.parse(JSON.stringify(order_products_parse))
  //console.log('Potwierdz zamowienie')
  let allPackages = 0
  // if(order_products.data.length > 1){
  order_products.data.forEach(element => {
    allPackages += parseInt(element.package_amount) * parseInt(element.product_amount)
    // console.log('all += '+ element.package_amount, element.product_amount);
  });
  orderParsed.data.allPackages = allPackages
  // } else {
  //   orderParsed.data.allPackages = parseInt(order_products.data[0].package_amount) * parseInt(order_products.data[0].product_amount)
  // }

  //console.log('Amount = '+ orderParsed.data.allPackages);
  // console.log("TUTAJ: ", order_products.data)
  res.render('Zamowienia/karta_przewozowa', { data: orderParsed.data, products: order_products.data, user: userParsed.data });

});

router.post('/karty-przewozowe', async (req, res) => {
  let ids = []
  ids = req.body.ids.split(',');
  // console.log(ids);

  const promises = ids.map(async (order_id) => {
    const orderData = await User.getOrderDataFromId(order_id);
    const orderParsed = JSON.parse(JSON.stringify(orderData));
    orderParsed.data.id = orderParsed.data.order_id.split('-')[0]

    const userParsed = JSON.parse(JSON.stringify(await User.getUserDataFromUserId(orderParsed.data.user_id)));
    const date = await User.getOrderDate(orderParsed.data.order_id);
    orderParsed.data.date = date;

    const order_products_parse = await User.getProductsFromOrder(orderParsed.data.order_id);
    const order_products = JSON.parse(JSON.stringify(order_products_parse));
    let allPackages = 0;

    order_products.data.forEach(element => {
      allPackages += parseInt(element.package_amount) * parseInt(element.product_amount);
    });
    orderParsed.data.allPackages = allPackages;

    return {
      data: orderParsed.data,
      products: order_products.data,
      user: userParsed.data
    };
  });


  Promise.all(promises).then(dataArray => {
    // console.log(dataArray);
    res.render('Zamowienia/karty_przewozowe', { dataArray: dataArray });
  });

});

router.post('/potwierdz-zamowienie', async (req, res) => {
  let data = req.body
  data.user_id = req.session.user_id
  data.SMS_from_company = (data.SMS_from_company) ? (1) : (0) || 0
  data.EMAIL_from_company = (data.EMAIL_from_company) ? (1) : (0) || 0
  data.SMS_from_client = (data.SMS_from_client) ? (1) : (0) || 0
  data.EMAIL_from_client = (data.EMAIL_from_client) ? (1) : (0) || 0
  data.bringing = (data.bringing) ? (1) : (0) || 0

  let nick = req.session.name;
  // console.log(data)

  let result = await User.addOrder(data);
  let date = await User.getOrderDate(result.id)
  data.date = date
  let userdata = await User.getAllUserDataFromUsername(nick);
  let parseuserdata = JSON.parse(JSON.stringify(userdata))


  if (data.productJSON !== null) data.products = JSON.parse(data.productJSON)
  else data.products = null
  if (result.id !== null) {
    await User.addProductsToOrder(data.products, result.id)
  }

  let prod_list = await User.getProductsFromOrder(result.id)
  // console.log('prod-list')
  // console.log(prod_list)

  data.products = prod_list.data

  // console.log(data.products)
  data.products.forEach(async element => {

    await User.addPackagesToOrder(element.order_products_id, element.product_amount, element.package_amount)
  })
  // let order_products_parse = await User.getProductsFromOrder(result.id)
  // let order_products = JSON.parse(JSON.stringify(order_products_parse))
  // console.log('Potwierdz zamowienie')
  // console.log(order_products);

  data.id = result.id.split('-')[0]

  //Notification email
  let emailCompany = await User.sendNotificationCompany(result.id)
  if (emailCompany.error) console.log(emailCompany.error)
  let emailClient = await User.sendNotificationClient(result.id)
  if (emailClient.error) console.log(emailClient.error)

  // var pdfLink = await pdf.generate(data)
  // data.pdf = pdfLink
  // console.log(pdfLink);
  // res.render('Zamowienia/karta_przewozowa', {data: data, products: order_products.data, user: parseuserdata.data});
  res.redirect('/moje-zamowienia')
})

router.get('/moj-profil', async (req, res) => {
  let username = req.session.name;
  let id = req.session.user_id
  // console.log(id);
  let userdata = await User.getUserDataFromUsername(username)
  let parseuserdata = JSON.parse(JSON.stringify(userdata))
  let companydata = await User.getCompanyDataFromUserId(id)
  let parsecompanydata = JSON.parse(JSON.stringify(companydata))

  let data = {
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
  res.render('Uzytkownik/moj-profil', data);
});

router.get('/powiadomienia', async (req, res) => {
  let id = req.session.user_id
  // console.log(id);
  let notification = await User.getNotificationStatus(id)

  let notifications = {
    "SMS_from_company": notification.data.SMS_from_company,
    "EMAIL_from_company": notification.data.EMAIL_from_company,
    "SMS_from_client": notification.data.SMS_from_client,
    "EMAIL_from_client": notification.data.EMAIL_from_client,
    "EMAIL_undelivered": notification.data.EMAIL_undelivered,
  }

  // console.log(notifications);
  res.render('Uzytkownik/powiadomienia', notifications);
});

router.post('/powiadomienia', async (req, res) => {
  let body = req.body
  let id = req.session.user_id


  //IF TYPE PRZEJAZD TRAMWAJOWY
  let data = {
    "SMS_from_company": ((body.SMS_from_company) ? (1) : (0)) || 0,
    "EMAIL_from_company": ((body.EMAIL_from_company) ? (1) : (0)) || 0,
    "SMS_from_client": ((body.SMS_from_client) ? (1) : (0)) || 0,
    "EMAIL_from_client": ((body.EMAIL_from_client) ? (1) : (0)) || 0,
    "EMAIL_undelivered": ((body.EMAIL_undelivered) ? (1) : (0)) || 0,
    "user_id": id
  }

  let notification = await User.updateNotificationStatus(data)

  let notifications = {
    "SMS_from_company": notification.data.SMS_from_company,
    "EMAIL_from_company": notification.data.EMAIL_from_company,
    "SMS_from_client": notification.data.SMS_from_client,
    "EMAIL_from_client": notification.data.EMAIL_from_client,
    "EMAIL_undelivered": notification.data.EMAIL_undelivered,
  }

  // console.log(notifications);
  res.render('Uzytkownik/powiadomienia', notifications);
});


router.post('/status', async (req, res) => {
  let id_body = `${req.body.id}%`;
  var orderData = await User.getOrderStatus(id_body)
  if (!orderData.error) {
    var rawStatus = orderData.data.status;
    var status = ''
    switch (rawStatus) {
      case 'złożone': status = "Zamowienie złożone"; break;
      case 'przygotowane': status = "Dostarczone na magazyn"; break;
      case 'wysłane': status = "W drodze"; break;
      case 'zrealizowane': status = "Dostarczone"; break;
      case 'zwrot': status = "Wydano klientowi (zwrot)"; break;
      default: status = "Status nieznany"; break;
    }
    res.json({ id: id_body.slice(0, -1), status })
  } else {
    res.json({ id: id_body.slice(0, -1), error: "Nie znaleziono zamowienia o podanym id" })
  }
})

router.get('/odbior-od-producenta', async (req, res) => {

  let user_id = req.session.user_id;
  let collections = await User.getAllUserCollections(user_id)
  console.log(collections)

  // if (typeof(collections)== 'Array') {
    // let products = []
    collections = await Promise.all(collections.map(async collection => {
      let fetchedProduct = await User.getCollectionProducts(collection.collection_id)
      console.log(fetchedProduct);
      return {
        ...collection,
        products: fetchedProduct
      }
    }))
  // } else{
  //   collections = {
  //     collection: collections,
  //     products: await User.getCollectionProducts(collections.collection_id)
  //   }
  // }

console.log("Collections:", collections);
  res.render('Zamowienia/odbior-od-producenta', { collections });
});



router.get('/dodaj-odbior', async (req, res) => {

  let nick = req.session.name;
  let userdata = await User.getAllUserDataFromUsername(nick);
  let parseuserdata = JSON.parse(JSON.stringify(userdata))
  let products_to_parse = await User.getAllProductsFromUsername(nick)
  let products_parsed = null
  if (products_to_parse.error == null) {
    products_parsed = await User.parseTableRowData(products_to_parse.data)
  }
  res.render('Zamowienia/dodaj-odbior', { user: parseuserdata.data, products: products_parsed });
});


router.post('/dodaj-odbior', async (req, res) => {

  let data = req.body
  if (data.productJSON !== null) data.products = JSON.parse(data.productJSON)
  else data.products = null

  const collectionData = {
    producer_name: req.body.producer_name,
    user_id: req.session.user_id,
    producer_address: req.body.producer_address,
    collectionNumber: req.body.collectionNumber,
    additionalInfo: req.body.additional_info,
    products: req.body.products
  }

  console.log(req.body);

  //stworzenie nowego collection
  const collection_id = await User.addNewCollection(collectionData)


  res.redirect('/odbior-od-producenta')
})


router.get('/edytuj-moj-odbior', async (req, res) => {
  var collection_id = req.query.id
  let fetchedCollection = await User.getCollectionById(collection_id)


  let collection
  if (fetchedCollection) {
    let fetchedProduct = await User.getCollectionProducts(fetchedCollection[0].collection_id)
    collection = {
      ...fetchedCollection[0],
      products: fetchedProduct
    }
  }

  let nick = req.session.name;
  let userdata = await User.getAllUserDataFromUsername(nick);
  let parseuserdata = JSON.parse(JSON.stringify(userdata))
  let products_to_parse = await User.getAllProductsFromUsername(nick)
  let products_parsed = null
  if (products_to_parse.error == null) {
    products_parsed = await User.parseTableRowData(products_to_parse.data)
  }

  res.render('Zamowienia/edytuj-moj-odbior', { collection: collection, products: products_parsed, order_products: collection.products });
});


router.post('/edytuj-moj-odbior', async (req, res) =>{
  console.log(req.body);

  let products = [];

  if(typeof(req.body.product_id) != 'string'){

    req.body.product_id.forEach((id, index)=>{
      products.push({
        product_id: id,
        amount : req.body.product_amount[index]
      })
    })
  } else {
    products = {
      product_id: req.body.product_id,
      amount: req.body.product_amount
    }
  }

  console.log(products);

  let data = {
    collection_id: req.body.collection_id,
    producer_name: req.body.producer_name,
    producer_address: req.body.producer_address,
    collectionNumber: req.body.collectionNumber,
    additional_info: req.body.additional_info,
  }
  
  //remove old products
  await User.removeCollectionProducts(data.collection_id);

  //update collection
  await User.updateUserCollection(data)

  //add new products

  await User.addProductsToCollection(data.collection_id, products)

  // console.log(data);
  
  res.redirect(req.get('Referrer'));
});


// router.get('/moj-profil', async (req, res) =>
// {
//   let username = req.session.name;
//   let id = req.session.user_id
//   console.log(id);
//   let userdata = await User.getUserDataFromUsername(username)
//   let parseuserdata =  JSON.parse(JSON.stringify(userdata))
//   console.log(parseuserdata.data);

//   res.render('Uzytkownik/moj-profil', {user: parseuserdata.data});
//   // res.render('Uzytkownik/ustawienia', data);
// });




//partials
router.get('/Breadcrumb', function (req, res) {
  res.render('Partials/Breadcrumb');
})
router.get('/Footer', function (req, res) {
  res.render('Partials/Footer');
})
router.get('/FooterRoot', function (req, res) {
  res.render('Partials/FooterRoot');
})
router.get('/FooterScript', function (req, res) {
  res.render('Partials/FooterScript');
})
router.get('/Header', function (req, res) {
  res.render('Partials/Header');
})
router.get('/HeaderRoot', function (req, res) {
  res.render('Partials/HeaderRoot');
})
router.get('/HeaderStyle', function (req, res) {
  res.render('Partials/HeaderStyle');
})
router.get('/Sidebar', function (req, res) {
  res.render('Partials/Sidebar');
})
router.get('/TinyCharts', function (req, res) {
  res.render('Partials/TinyCharts');
})



module.exports = router;
