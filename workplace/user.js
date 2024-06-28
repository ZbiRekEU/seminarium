var db = require('./database.js')
var { v4: uuidv4 } = require('uuid');
const moment = require('moment')
const email = require('./email.js')
const Email = new email()


class user {
  async login(login, password) {
    return new Promise(async (resolve, reject) => {
      var result = await db.userLogin(login, password)
      // console.log(result.length);
      if (result.length > 0) {
        // console.log('yes');
        resolve({ data: result[0], error: null })
      } else {
        resolve({ data: null, error: 'Podane dane logowania są błędne' })
        // console.log('no');
      }
    })
  }
  async register(data) {
    return new Promise(async (resolve, reject) => {
      data.user_id = uuidv4();
      data.type = 'user'
      // console.log(data);
      var check_email = await db.getUserIdFromEmail(data.email)
      // console.log("check_email: " + check_email);
      if (check_email != null) {
        console.log("Ten adres email jest przypisany do innego użytkownika", data.email);
        resolve({ id: null, error: "Ten adres email jest przypisany do innego użytkownika" })
        return
      }
      var result = await db.userRegister(data)
      if (result == 'success') {
        Email.sendRegisterMail(data.email, data.username)
        let json = { id: data.user_id, error: null }
        resolve(json)
      } else {
        let json = { id: null, error: result }
        console.log("ERROR: " + result);
        resolve(json)
      }
    })
  }

  async changeOrderStatusToRecived(order_id) {
    return new Promise(async (resolve, reject) => {
      //console.log('zmiiana statusu:', order_id)
      var result = await db.changeOrderStatusToRecived(order_id)
      if (result != null) {
        let json = { data: 'Zmieniono status: ' + order_id, changed: true, error: null }
        resolve(json)
      } else {
        let json = { data: null, changed: false, error: "Nie znaleziono zamówienia: " + order_id }
        resolve(json)
      }
    })
  }

  async checkRecivedPackages(order_id) {
    return new Promise(async (resolve, reject) => {
      var result = await db.checkRecivedPackages(order_id)
      if (result != null) {
        // console.log(result)
        let amount_all = result.length
        let amount_recived = 0
        for (let i = 0; i < amount_all; i++) {
          if (result[i].status == 1) amount_recived++
        }
        // console.log('ilosc: ' + amount_all, amount_recived)
        if (amount_all == amount_recived) {
          let status_result = await this.changeOrderStatusToRecived(order_id)
          // console.log(status_result)
          let json = { data: 'Zmiana statusu zamówienia', changed: true, error: null }
          resolve(json)
        } else {
          let json = { data: 'Otrzymano ' + amount_recived + ' z ' + amount_all + ' paczek', changed: false, error: null }
          resolve(json)
        }
      } else {
        let json = { data: '', error: "Nie znaleziono paczek dla zamówienia: " + order_id }
        resolve(json)
      }
    })
  }
  async updatePackageStatus(data) {
    return new Promise(async (resolve, reject) => {
      //console.log('data:',data.Id_confirmation, data.status)
      var result = await db.updatePackageStatus(data.Id_confirmation, data.status)
      //console.log(result)
      if (result != null) {
        let json = { data: 'success', error: null }
        resolve(json)
      } else {
        let json = { id: null, error: "Nie znaleziono paczki: " + data.Id_confirmation }
        resolve(json)
      }
    })
  }
  async updateOrderPackagesStatus(data) {
    return new Promise(async (resolve, reject) => {
      //console.log('data:',data.Id_confirmation, data.status)
      var result = await db.updateOrderPackagesStatus(data.order_id, data.status)
      //console.log(result)
      if (result != null) {
        let json = { data: 'success', error: null }
        resolve(json)
      } else {
        let json = { id: null, error: "Nie znaleziono zamowienia: " + data.order_id }
        resolve(json)
      }
    })
  }
  async updateOrderStatus(order_id) {
    return new Promise(async (resolve, reject) => {
      //console.log('data:',data.Id_confirmation, data.status)
      var result = await db.updateOrderStatus(order_id)
      //console.log(result)
      if (result != null) {
        let json = { data: 'success', error: null }
        resolve(json)
      } else {
        let json = { id: null, error: "Nie znaleziono zamowienia: " + data.order_id }
        resolve(json)
      }
    })
  }


  async sendNotificationCompany(order_id) {
    return new Promise(async (resolve, reject) => {

      let result = await db.getProductsFromOrder(order_id)
      if (result.order.EMAIL_from_company) {
        if (result !== null) {
          await Email.sendNotificationCompany(result)
          let json = { id: order_id, error: null }
          resolve(json)
        } else {
          let json = { id: null, error: result }
          console.log("ERROR: " + result);
          resolve(json)
        }
      } else {
        resolve({ id: null, error: 'Nie wysyłaj wiadomości' })
      }
    })
  }
  async sendNotificationClient(order_id) {
    return new Promise(async (resolve, reject) => {

      let result = await db.getProductsFromOrder(order_id)
      if (result.order.EMAIL_from_client) {
        if (result !== null) {
          await Email.sendNotificationClient(result)
          let json = { id: order_id, error: null }
          resolve(json)
        } else {
          let json = { id: null, error: result }
          console.log("ERROR: " + result);
          resolve(json)
        }
      } else {
        resolve({ id: null, error: 'Nie wysyłaj wiadomości' })
      }
    })
  }
  async deleteOrder(order_id) {
    return new Promise(async (resolve, reject) => {
      var result = await db.deleteOrder(order_id)
      if (result != null) {
        let json = { data: result, error: null }
        resolve(json)
      } else {
        let json = { id: null, error: "Nie znaleziono zamowienia: " + product_id }
        resolve(json)
      }
    })
  }
  async deleteProduct(product_id, user_id) {
    return new Promise(async (resolve, reject) => {
      var result = await db.deleteProduct(product_id, user_id)
      if (result != null) {
        let json = { data: result, error: null }
        resolve(json)
      } else {
        let json = { id: null, error: "Nie znaleziono produktu: " + product_id }
        resolve(json)
      }
    })
  }

  async getProductsFromOrder(order_id) {
    return new Promise(async (resolve, reject) => {
      var result = await db.getProductListFromOrder(order_id)
      if (result != null) {
        let json = { data: result, error: null }
        resolve(json)
      } else {
        let json = { data: null, error: "Nie znaleziono produktów zamowienia: " + order_id }
        resolve(json)
      }
    })
  }

  async getPackagesListForProducts(data, i) {
    return new Promise(async (resolve, reject) => {
      if (i >= data.length) {
        resolve(data)
      } else {
        //console.log("Zczytywanie: " + data[i].order_products_id)
        var packages = await this.getPackagesList(data[i].order_products_id)
        data[i].packages = JSON.parse(JSON.stringify(packages.data))
        //console.log(packages)
        resolve(await this.getPackagesListForProducts(data, ++i))
      }
    })
  }

  async getPackagesList(order_product_id) {
    return new Promise(async (resolve, reject) => {
      let result = await db.getPackagesList(order_product_id)
      //console.log(order_product_id)
      //console.log(result)
      if (result != null) {
        let json = { data: result, error: null }
        resolve(json)
      } else {
        let json = { data: null, error: "Błąd zczytywania paczek" }
        resolve(json)
      }
    })
  }

  async addPackagesToOrder(order_product_id, amount, amount_package) {
    return new Promise(async (resolve, reject) => {
      let values = []
      //console.log(order_product_id, amount, amount_package)
      if (amount < 1) amount = 1
      if (amount_package < 1) amount_package = 1

      for (let i = 1; i <= amount; i++) {
        for (let j = 1; j <= amount_package; j++) {
          values.push([uuidv4(), order_product_id, i, j])
        }
      }
      //console.log(values)
      var result = await db.addPackagesToOrder(values)

      if (result == 'success') {
        let json = { result: 'success', error: null }
        resolve(json)
      } else {
        let json = { result: 'failed', error: result }
        console.log("ERROR: " + result);
        resolve(json)
      }
    })
  }

  async deleteProductsFromOrder(order_id) {
    return new Promise(async (resolve, reject) => {
      var order_products = await db.getProductListFromOrder(order_id)
      //console.log(order_products)
      var order_products_id = order_products.map(element => { return element.order_products_id })
      //console.log(order_products_id)
      for (var order_product of order_products_id) {
        await db.deletePackagesFromOrder(order_product.order_products_id)
      }
      var result = await db.deleteProductsFromOrder(order_id)
      //console.log(result)
      if (order_products_id !== null) {
        let json = { data: "SuccesfulY deleted products", error: null }
        resolve(json)
      } else {
        let json = { id: null, error: "Nie znaleziono produktu: " + product_id }
        resolve(json)
      }
    })
  }

  async addProductsToOrder(products, order_id) {
    return new Promise(async (resolve, reject) => {

      let values = products.map(product => [uuidv4(), product.product_id, product.amount, order_id])

      var result = await db.addProductsToOrder(values)

      if (result == 'success') {
        let json = { result: values, error: null }
        resolve(json)
      } else {
        let json = { result: 'failed', error: result }
        console.log("ERROR: " + result);
        resolve(json)
      }
    })
  }


  async addProduct(data) {
    return new Promise(async (resolve, reject) => {
      let toInsert = {
        product_id: uuidv4(),
        name: data.name,
        user_id: data.user_id,
        width: data.packages.width,
        height: data.packages.height,
        depth: data.packages.depth,
        volume: data.packages.volume,
        weight: data.packages.weight,
        package_amount: data.package_amount,
        amount: data.amount
      }
      // console.log('to insert product')
      // console.log(toInsert)
      var result = await db.addProduct(toInsert)
      if (result == 'success') {
        let json = { id: toInsert.product_id, error: null }
        resolve(json)
      } else {
        let json = { id: null, error: result }
        console.log("ERROR: " + result);
        resolve(json)
      }
    })
  }

  async addPackages(product_id, packages){
    return new Promise(async (resolve, reject) =>{
      const packages_amount = packages.length;

      for(let i=0; i<packages_amount; i++){
          //utworzenie rekordu dla każdej paczki
          var result = await db.addPackages(uuidv4(), product_id, packages[i])

          if(result !== 'success'){
            console.log("Coś poszło nie tak: ", result);
          }
        
      }
      resolve(result)

    })
  }
  async removeProductPackages(product_id){
    return new Promise(async (resolve, reject) =>{
     
      var result = await db.removeProductPackages(product_id)
      if (result == 'success') {
        let json = { id: product_id, error: null }
        resolve(json)
      } else {
        let json = { id: null, error: result }
        console.log("ERROR: " + result);
        resolve(json)
      }

    })
  }
  async editProduct(product_id, data){
    return new Promise(async (resolve, reject) =>{
     
      var result = await db.editProduct(product_id, data)
      if (result == 'success') {
        let json = { id: product_id, error: null }
        resolve(json)
      } else {
        let json = { id: null, error: result }
        console.log("ERROR: " + result);
        resolve(json)
      }

    })
  }




  async createCompanyRecord(userID){
    return new Promise(async (resolve, reject) => {
      let companyID = uuidv4();
      var result = await db.createCompanyRecord(userID, companyID)
      if (result == 'success') {
        let json = { id: userID, error: null }
        resolve(json)
      } else {
        let json = { id: null, error: result }
        console.log("ERROR: " + result);
        resolve(json)
      }
    })
  }


  async addCompanyData(data) {
    return new Promise(async (resolve, reject) => {
      // console.log(data);
      var result = await db.companyData(data)
      if (result == 'success') {
        let json = { id: data.user_id, error: null }
        resolve(json)
      } else {
        let json = { id: null, error: result }
        console.log("ERROR: " + result);
        resolve(json)
      }
    })
  }

  async getAllProductsFromUsername(username) {
    // console.log(username , ' nick products ');
    return new Promise(async (resolve, reject) => {
      var user = await db.getUserDataFromUsername(username)
      // console.log(user)
      if (user != null) {
        var result = await db.getAllProductsFromUser(user.user_id)
      } else var result = null

      if (result != null) {
        let json = { data: result, error: null }
        resolve(json)
      } else {
        let json = { id: null, error: "Nie znaleziono produktów" }
        console.log("Error: " + json.error);
        resolve(json)
      }
    })
  }
  async getUserDataFromUsername(nick) {
    return new Promise(async (resolve, reject) => {
      var result = await db.getUserDataFromUsername(nick)
      if (result != null) {
        let json = { data: result, error: null }
        resolve(json)
      } else {
        let json = { id: null, error: "Nie znaleziono użytkownika: " + nick }
        resolve(json)
      }
    })
  }
  async getAllProductPackages(product_id) {
    return new Promise(async (resolve, reject) => {
      var result = await db.getAllProductPackages(product_id)
      if (result != null) {
        let json = { data: result, error: null }
        resolve(json)
      } else {
        let json = { id: null, error: "Nie znaleziono paczek dla produktu: " + product_id }
        resolve(json)
      }
    })
  }

  
  async getNotificationStatus(id) {
    return new Promise(async (resolve, reject) => {
      await db.addNotificationStatus(id)
      let result = await db.getNotificationStatus(id)
      if (result != null) {
        let json = { data: result, error: null }
        resolve(json)
      } else {
        let json = { id: null, error: "Błąd wyświetlania powiadomień" }
        resolve(json)
      }
    })
  }
  async updateNotificationStatus(data) {
    return new Promise(async (resolve, reject) => {
      let result = await db.updateNotificationStatus(data)
      // console.log(result)
      if (result != null) {
        let result = await db.getNotificationStatus(data.user_id)
        if (result != null) {
          let json = { data: result, error: null }
          resolve(json)
        } else {
          let json = { id: null, error: "Błąd wyświetlania powiadomień" }
          resolve(json)
        }
      } else {
        let json = { id: null, error: "Błąd zapisu powiadomienia" }
        resolve(json)
      }
    })
  }
  async getCompanyDataFromUserId(id) {
    return new Promise(async (resolve, reject) => {
      // console.log(id);
      var result = await db.getCompanyDataFromUserId(id)
      if (result != null) {
        let json = { data: result, error: null }
        resolve(json)
      } else {
        let json = { id: null, error: "Nie znaleziono firmy użytkownika: " + id }
        resolve(json)
      }
    })
  }
  async recoveryPassword(email) {
    return new Promise(async (resolve, reject) => {
      var uuid = uuidv4();
      var id = await db.recoveryPassword(email, uuid)
      if (id != null) {
        let json = { data: id, error: null }
        //  console.log('json');
        //  console.log(json);
        resolve(json)
      } else {
        let json = { data: null, error: "Przypomij hasło - Nie znaleziono użytkownika z emailem: " + email }
        resolve(json)
      }
    })
  }
  async recoveryPasswordUpdate(password, code) {
    return new Promise(async (resolve, reject) => {
      let result = await db.updateRecoveryPassword(password, code)
      // console.log(result);
      if (result != null) {
        let json = { data: "success", error: null }
        resolve(json)
      } else {
        let json = { data: null, error: "Podano błędny kod przywracania hasła" }
        resolve(json)
      }
    })
  }
  async addOrder(data) {
    return new Promise(async (resolve, reject) => {
      data.order_id = uuidv4();
      data.status = "złożone"
      // console.log(data);
      let toInsert = {
        order_id: data.order_id,
        customer_name: data.customer_name,
        city: data.city,
        postal_code: data.postal_code,
        street: data.street,
        customer_phone: data.customer_phone,
        house_number: data.house_number,
        apartment_number: data.apartment_number,
        products: '',
        additional_info: data.additional_info,
        payment: data.payment,
        price: data.price,
        user_id: data.user_id,
        status: data.status,
        SMS_from_company: data.SMS_from_company,
        EMAIL_from_company: data.EMAIL_from_company,
        SMS_from_client: data.SMS_from_client,
        EMAIL_from_client: data.EMAIL_from_client,
        email_client: data.email_client,
        email_company: data.email_company,
        sms_client: data.sms_client,
        sms_company: data.sms_company,
        bringing: data.bringing,
        direction: data.direction
      }
      // console.log(toInsert)
      var result = await db.addOrder(toInsert)
      if (result == 'success') {
        let json = { id: data.order_id, error: null }
        resolve(json)
      } else {
        let json = { id: null, error: result }
        console.log("ERROR: " + result);
        resolve(json)
      }
    })
  }
  async getUserDataFromUserId(id) {
    console.log("USER id:" + id);
    return new Promise(async (resolve, reject) => {
      var result = await db.getUserDataFromUserId(id)
      if (result != null) {
        let json = { data: result, error: null }
        resolve(json)
      } else {
        let json = { id: null, error: "Nie znaleziono użytkownika o id: " + id }
        console.log("Error: " + json.error);
        resolve(json)
      }
    })
  }
  async getAllUserDataFromUsername(nick) {
    console.log("USER :" + nick);
    return new Promise(async (resolve, reject) => {
      var result = await db.getAllUserDataFromUsername(nick)
      if (result !== null) {
        let json = { data: result, error: null }
        resolve(json)
      } else {

        let json = { id: null, error: "Nie znaleziono użytkownika: " + nick }
        console.log("Error: " + json.error);
        resolve(json)
      }
    })
  }
  async getAllOrdersFromUsername(username) {
    console.log(username, ' nick do ');
    return new Promise(async (resolve, reject) => {
      var user = await db.getAllUserDataFromUsername(username)
      if (user != null) {
        var result = await db.getAllOrdersFromUser(user.user_id)
      } else var result = null

      if (result != null) {
        let json = { data: result, error: null }
        resolve(json)
      } else {
        let json = { id: null, error: "Brak zamówień dla użytkownika: " + username }
        console.log("Error: " + json.error);
        resolve(json)
      }
    })
  }
  async getOrderDataFromId(order_id) {
    return new Promise(async (resolve, reject) => {
      var result = JSON.parse(JSON.stringify(await db.getOrderDataFromId(order_id)))

      if (result != null) {
        let json = { data: result, error: null }
        resolve(json)
      } else {
        let json = { id: null, error: "Nie ma zamówień dla : " + order_id }
        console.log("Error: " + json.error);
        resolve(json)
      }
    })
  }
  async getOrderStatus(order_id) {
    return new Promise(async (resolve, reject) => {
      var result = JSON.parse(JSON.stringify(await db.getOrderStatusId(order_id)))

      if (result != null) {
        let json = { data: result, error: null }
        resolve(json)
      } else {
        let json = { id: null, error: "Nie ma zamówień dla : " + order_id }
        console.log("Error: " + json.error);
        resolve(json)
      }
    })
  }
  async getUserDataFromOrderId(order_id) {
    return new Promise(async (resolve, reject) => {
      var result = await db.getUserDataFromOrderId(order_id)

      if (result != null) {
        let json = { data: result, error: null }
        resolve(json)
      } else {
        let json = { id: null, error: "Błąd użytkownika w zamówieniu numer: " + order_id }
        console.log("Error: " + json.error);
        resolve(json)
      }
    })
  }
  async getShippingLabels(order_id) {
    return new Promise(async (resolve, reject) => {
      var result = JSON.parse(JSON.stringify(await db.getShippingLabels(order_id)))

      if (result != null) {
        let json = { data: result, error: null }
        resolve(json)
      } else {
        let json = { id: null, error: "Nie zamówień użytkownika: " + order_id }
        console.log("Error: " + json.error);
        resolve(json)
      }
    })
  }
  async parseTableRowData(table) {
    return new Promise(async (resolve, reject) => {
      var newtable = []
      if (typeof table == undefined) {
        resolve(null)
      } else {
        for (var i = 0; i < table.length; i++) {
          var parsed = JSON.parse(JSON.stringify(table[i]))
          if (parsed.date != null) parsed.date = parsed.date.replace('T', ' ').slice(0, parsed.date.length - 8) //moment(parsed.date).format('YYYY/MM/DD HH:MM');
          if (parsed.order_id != null) parsed.id = parsed.order_id.split('-')[0]
          if (parsed.product_id != null) parsed.id = parsed.product_id.split('-')[0]
          newtable.push(parsed)
          //  console.log("Parsed:",parsed);
        }
        //  console.log(newtable);
        resolve(newtable)
      }
    })
  }
  async parseTableRowDataUsers(table) {
    return new Promise(async (resolve, reject) => {
      var newtable = []

      // console.log(Object.keys(table));
      if (typeof table == undefined) {
        resolve(null)
      } else {
        for (var i = 0; i < table.length; i++) {
          var parsed = JSON.parse(JSON.stringify(table[i]))
          parsed.date = moment(parsed.create_date).format('YYYY/MM/DD HH:MM');
          parsed.id = parsed.user_id.split('-')[0]
          newtable.push(parsed)
          console.log(parsed);
        }
        console.log(newtable);
        resolve(newtable)
      }
    })
  }
  async updateUserData(data) {
    return new Promise(async (resolve, reject) => {
      var userdata = await db.updateUserData(data.user)
      var companydata = await db.updateCompanyData(data.company)
      if (userdata != null & companydata != null) resolve(true)
      else resolve(false)
      // if(userdata.error != null)
    })
  }
  async updateMyOrderData(data) {
    console.log(data);
    return new Promise(async (resolve, reject) => {
      var orderdata = await db.updateMyOrderData(data)
      if (orderdata != null) resolve(true)
      else resolve(false)
      // if(userdata.error != null)
    })
  }
  async updateOrderData(data) {
    //console.log(data);
    return new Promise(async (resolve, reject) => {
      var orderdata = await db.updateOrderData(data)
      if (orderdata != null) resolve(true)
      else resolve(false)
      // if(userdata.error != null)
    })
  }
  async getAvatar(username) {
    return new Promise(async (resolve, reject) => {
      var avatar = await db.getAvatar(username)
      if (avatar != null) resolve(avatar)
      else resolve('avatar-1.png')
      // if(userdata.error != null)
    })
  }
  async getOrderDate(id) {
    return new Promise(async (resolve, reject) => {
      var data = await db.getOrderDataFromId(id)

      if (data != null) resolve(moment(data.date).format('YYYY/MM/DD HH:MM'))
      else resolve('')
      // if(userdata.error != null)
    })
  }
  async markAsPrinted(ids) {
    return new Promise(async (resolve, reject) => {
      var marked = JSON.parse(JSON.stringify(await db.markAsPrinted(ids, moment().format())))
      resolve(marked)
    })
  }
  async getAllProductsIDForOrder(order_id) {
    return new Promise(async (resolve, reject) => {
      var result = await db.getAllProductsIDForOrder(order_id)
      resolve(result)
    })
  }
  async getProductDetails(product_id) {
    return new Promise(async (resolve, reject) => {
      var result = await db.getProductDetails(product_id)
      resolve(result)
    })
  }
  async getPackagesDetailsFromProduct(product_id) {
    return new Promise(async (resolve, reject) => {
      var result = await db.getPackagesDetailsFromProduct(product_id)
      resolve(result)
    })
  }
  async changeDeliveryConfirmationChangedBy(order_id, who) {
    return new Promise(async (resolve, reject) => {
      var result = await db.changeDeliveryConfirmationChangedBy(order_id, who)
      resolve(result)
    })
  }
	  async setDefaultDeliveryConfirmationStatus(order_id) {
    return new Promise(async (resolve, reject) => {
      var result = await db.setDefaultDeliveryConfirmationStatus(order_id)
      resolve(result)
    })
  }
	
  async addNewCollection(data) {
    return new Promise(async (resolve, reject) => {
      data['collection_id'] = uuidv4();

      await db.addNewCollection(data)

      data.products.forEach(async product =>{
        await db.addNewCollectionProducts(uuidv4(), data.collection_id, product)
      })

      resolve(data.collection_id)
    })
  }
  async getAllUserCollections(user_id) {
    return new Promise(async (resolve, reject) => {
      const results = await db.getAllUserCollections(user_id)
      
      resolve(results)
    })
  }

  async getAllCollections() {
    return new Promise(async (resolve, reject) => {
      const results = await db.getAllCollections()
      
      resolve(results)
    })
  }
  async getCollectionById(collection_id) {
    return new Promise(async (resolve, reject) => {
      const results = await db.getCollectionById(collection_id)
      
      resolve(results)
    })
  }

  async getCollectionProducts(collection_id) {
    return new Promise(async (resolve, reject) => {
      const results = await db.getCollectionProducts(collection_id)

      console.log("Tutaj:", results);

      if(results.length > 1){
        let products = await Promise.all(results.map(async (result)=>{
          const productData = await db.getProductDataByID(result.product_id)
          
          return {
            product_id: productData[0].product_id,
            name: productData[0].name,
            package_amount: productData[0].package_amount,
            amount: result.product_amount
          }
        }))
        resolve(products)
      } else {
        const productData = await db.getProductDataByID(results[0].product_id)
        console.log("ProductData",productData);
        let ret = {
          product_id: productData[0].product_id,
          name: productData[0].name,
          package_amount: productData[0].package_amount,
          amount: results[0].product_amount
        }
        resolve(ret)
      }


      // console.log(products);
    })
  }

  async updateCollection(data) {
    return new Promise(async (resolve, reject) => {
      const result = await db.updateCollection(data)
      resolve(result)
      // console.log(products);
    })
  }

  async removeCollectionProducts(collection_id) {
    return new Promise(async (resolve, reject) => {
      const result = await db.removeCollectionProducts(collection_id)
      resolve(result)
      // console.log(products);
    })
  }
  async updateUserCollection(data) {
    return new Promise(async (resolve, reject) => {
      const result = await db.updateUserCollection(data)
      resolve(result)
      // console.log(products);
    })
  }
  async addProductsToCollection(collection_id, products) {
    return new Promise(async (resolve, reject) => {
      let results= true
      if(typeof(products) != 'string' ){
        products.forEach(async product =>{
          const result = await db.addNewCollectionProducts(uuidv4(), collection_id, product)
        })
      } else {
        const result = await db.addNewCollectionProducts(uuidv4(), collection_id, products)
      }
      resolve(results)
      // console.log(products);
    })
  }




}

module.exports = user
