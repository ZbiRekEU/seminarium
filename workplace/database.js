var mysql = require('mysql');
var pool  = mysql.createPool({
  connectionLimit : 10,
  host            : 'localhost',
  user            : 'hidden',
  password        : 'hidden',
  database        : 'hidden',
  timezone        : 'UTC'
});

class database {
  async userLogin(login, password) {
    //console.log(login, password);
    return new Promise((resolve, reject) => {
      pool.query('SELECT * FROM user WHERE username LIKE ? AND password LIKE ?', [login, password], function (error, results, fields) {
        if (error) throw error;

        resolve(results)
      });
    })
  }
  async checkRecivedPackages(id) {
    return new Promise((resolve, reject) => {
      pool.query('SELECT * FROM product_confirmation AS pc INNER JOIN order_products AS op ON pc.order_product_id = op.order_products_id WHERE op.order_id LIKE ?', [id, id], function (error, results, fields) {
        if (error) throw error;
        //console.log('result')
        //console.log(results)
        resolve(results)
      });
    })
  }
  async updatePackageStatus(id, status) {
    return new Promise((resolve, reject) => {
      pool.query('UPDATE product_confirmation SET status = ?, update_date = CURRENT_TIMESTAMP() WHERE Id_confirmation LIKE ?', [status, id], function (error, results, fields) {
        if (error) throw error;
        //console.log(results);
        if (results.changedRows > 0) resolve(id)
        else resolve(null)
      });
    })
  }

  async updateOrderPackagesStatus(order_id, status) {
    return new Promise((resolve, reject) => {
      pool.query('UPDATE product_confirmation SET status = 1, update_date = CURRENT_TIMESTAMP() WHERE order_product_id = (SELECT order_products_id FROM order_products WHERE order_id = ?);', [order_id], function (error, results, fields) {
        if (error) throw error;
        //console.log(results);
        if (results.changedRows > 0) resolve(order_id)
        else resolve(null)
      });
    })
  }
  async updateOrderStatus(order_id) {
    return new Promise((resolve, reject) => {
      pool.query('UPDATE orders SET status = "przygotowane" WHERE order_id = ?;', [order_id], function (error, results, fields) {
        if (error) throw error;
        //console.log(results);
        if (results.changedRows > 0) resolve(order_id)
        else resolve(null)
      });
    })
  }

  async userRegister(data) {
    var existUsername = await this.getUserIdFromUsername(data.username)
    var existEmail = await this.getUserIdFromEmail(data.username)
    // console.log(existUsername, existEmail);
    return new Promise((resolve, reject) => {
      if (existUsername != null) return resolve('Użytkownik o tej nazwie już istnieje')
      if (existEmail != null) return resolve('Użytkownik o tym adresie e-mail już istnieje')
      pool.query('INSERT INTO user SET ?', data, function (error, results, fields) {
        if (error) throw error;
        //console.log(results);
        if (results.affectedRows == 1) resolve('success')
        else resolve('Wystąpił błąd serwera')
      });
    })
  }



  async deletePackagesFromOrder(id) {
    return new Promise((resolve, reject) => {
      // console.log('delete: Id_confirmation', id)
      pool.query('DELETE FROM product_confirmation WHERE order_product_id LIKE ?', [id], function (error, results, fields) {
        if (error) throw error;
        //console.log(results);
        if (results.affectedRows == 1) resolve('success')
        else resolve('Wystąpił błąd serwera')
      });
    })
  }

  async deleteProductsFromOrder(id) {
    return new Promise((resolve, reject) => {
      // console.log(id)
      pool.query('DELETE FROM order_products WHERE order_id LIKE ?', [id], function (error, results, fields) {
        if (error) throw error;
        //console.log(results);
        if (results.affectedRows > 0) resolve('success')
        else resolve('Wystąpił błąd serwera')
      });
    })
  }

  async deleteOrder(id) {
    return new Promise((resolve, reject) => {
      pool.query('DELETE FROM orders WHERE order_id LIKE ?', [id], function (error, results, fields) {
        if (error) throw error;
        // console.log(results);
        if (results.affectedRows == 1) resolve('success')
        else resolve('Wystąpił błąd serwera')
      });
    })
  }

  async deleteProduct(id, user_id) {
    return new Promise((resolve, reject) => {
      pool.query('DELETE FROM products WHERE product_id LIKE ? AND user_id LIKE ?', [id, user_id], function (error, results, fields) {
        if (error) throw error;
        // console.log(results);
        if (results.affectedRows == 1) resolve('success')
        else resolve('Wystąpił błąd serwera')
      });
    })
  }

  async addProduct(data) {
    return new Promise((resolve, reject) => {
      pool.query('INSERT INTO products SET ?', data, function (error, results, fields) {
        if (error) throw error;
        // console.log(results);
        if (results.affectedRows == 1) resolve('success')
        else resolve('Wystąpił błąd serwera')
      });
    })
  }

  async addPackages(package_id ,product_id, packageData ){
    return new Promise((resolve, reject)=>{
      pool.query('INSERT INTO packages SET package_id = ?, product_id = ?, width = ?, height = ?, depth = ?, volume = ?, weight = ?', [package_id, product_id, packageData.width, packageData.height, packageData.depth, packageData.volume, packageData.weight], function (error, results, fields) {
        if (error) throw error;
        // console.log(results);
        if (results.affectedRows == 1) resolve('success')
        else resolve('Wystąpił błąd serwera')
      })

    })
  }
  async removeProductPackages(product_id){
    return new Promise((resolve, reject)=>{
      pool.query('DELETE FROM packages WHERE product_id = ? ', [product_id], function (error, results, fields) {
        if (error) throw error;
        // console.log(results);
        if (results.affectedRows == 1) resolve('success')
        else resolve('Wystąpił błąd serwera')
      })

    })
  }
  async editProduct(product_id, data){
    return new Promise((resolve, reject)=>{
      pool.query('UPDATE products SET name = ?, package_amount = ?, width = ?, height = ?, depth = ?, volume = ?, weight = ?, amount = ? WHERE product_id = ? ', [data.name, data.package_amount, data.packages.width, data.packages.height, data.packages.depth, data.packages.volume, data.packages.weight, data.amount,  product_id], function (error, results, fields) {
        if (error) throw error;
        // console.log(results);
        if (results.affectedRows == 1) resolve('success')
        else resolve('Wystąpił błąd serwera')
      })

    })
  }

  async createCompanyRecord(userID, companyID){
    return new Promise((resolve, reject) => {
      pool.query('INSERT INTO company SET company_id = ?, full_name = ?, short_name = ?, phone = ?, nip = ?, street = ?, house_number = ?, apartment_number = ?, city = ?, postal_code = ?, user_id = ?', [companyID, '', '', '', '', '','', '', '', '', userID], function (error, results, fields) {
        if (error) throw error;
        console.log(results);
        if (results.affectedRows == 1) resolve('success')
        else resolve('Wystąpił błąd serwera')
      });
    })
  }

  async companyData(data) {
    return new Promise((resolve, reject) => {
      pool.query('UPDATE company SET full_name = ?, short_name = ?, phone = ?, nip = ?, street = ?, house_number = ?, apartment_number = ?, city = ?, postal_code = ?  WHERE user_id LIKE ?', [data.full_name, data.short_name, data.phone, data.nip, data.street, data.house_number, data.apartment_number, data.city, data.postal_code, data.user_id], function (error, results, fields) {
        if (error) throw error;
        // console.log(results);
        if (results.changedRows == 1) resolve('success')
        else resolve('Wystąpił błąd serwera')
      });
    })
  }
  async getAllProductsFromUser(id) {
    return new Promise((resolve, reject) => {
      pool.query('SELECT * FROM products WHERE user_id LIKE ? AND showInAccount LIKE "1"', [id], function (error, results, fields) {
        if (error) throw error;
        // console.log(results);
        if (results.length > 0) resolve(results)
        else resolve(null)
      });
    })
  }
  async getUserIdFromUsername(username) {
    return new Promise((resolve, reject) => {
      pool.query('SELECT * FROM user WHERE username LIKE ?', [username], function (error, results, fields) {
        if (error) throw error;
        // console.log(results);
        if (results.length > 0) resolve(results[0].user_id)
        else resolve(null)
      });
    })
  }
  async getAllProductPackages(product_id) {
    return new Promise((resolve, reject) => {
      pool.query('SELECT * FROM packages WHERE product_id LIKE ?', [product_id], function (error, results, fields) {
        if (error) throw error;
        // console.log(results);
        if (results.length > 0) resolve(results)
        else resolve(null)
      });
    })
  }
  async getUserIdFromEmail(email) {
    return new Promise((resolve, reject) => {
      pool.query('SELECT * FROM user WHERE email LIKE ?', [email], function (error, results, fields) {
        if (error) throw error;
        // console.log(results);
        if (results.length > 0) resolve(results[0].user_id)
        else resolve(null)
      });
    })
  }
  async getUserDataFromUsername(username) {
    return new Promise((resolve, reject) => {
      pool.query('SELECT * FROM user WHERE username LIKE ?', [username], function (error, results, fields) {
        if (error) throw error;
        if (results.length > 0) resolve(results[0])
        else resolve(null)
      });
    })
  }
  async getCompanyDataFromUserId(user_id) {
    return new Promise((resolve, reject) => {
      pool.query('SELECT * FROM company WHERE user_id LIKE ?', [user_id], function (error, results, fields) {
        if (error) throw error;
        // console.log(results);
        if (results.length > 0) resolve(results[0])
        else resolve(null)
      });
    })
  }
  async getPackagesList(order_product_id) {
    return new Promise((resolve, reject) => {
      pool.query('SELECT * FROM product_confirmation WHERE order_product_id LIKE ? ORDER BY package_number ASC, product_number ASC', [order_product_id], function (error, results, fields) {
        if (error) throw error;
        // console.log(results);
        if (results.length > 0) resolve(results)
        else resolve(null)
      });
    })
  }
  //tutaj
  async getProductListFromOrder(order_id) {
    return new Promise((resolve, reject) => {
      pool.query('SELECT *, o.order_products_id, o.product_amount FROM products p INNER JOIN order_products o ON p.product_id = o.product_id WHERE o.order_id LIKE ?', [order_id], function (error, results, fields) {
        if (error) throw error;
        // console.log(results);
        if (results.length > 0) resolve(results)
        else resolve(null)
      });
    })
  }
  async recoveryPassword(email, uuid) {
    return new Promise((resolve, reject) => {
      pool.query('UPDATE user SET recovery_password = ? WHERE email LIKE ?', [uuid, email], function (error, results, fields) {
        if (error) throw error;
        // console.log(results);
        if (results.changedRows > 0) resolve(uuid)
        else resolve(null)
      });
    })
  }
  async updateRecoveryPassword(password, code) {
    // console.log(password, code);
    return new Promise((resolve, reject) => {
      pool.query('UPDATE user SET password = ? WHERE recovery_password LIKE ?', [password, code], function (error, results, fields) {
        if (error) throw error;
        var res = JSON.parse(JSON.stringify(results))
        // console.log(res);
        if (res.changedRows > 0) resolve(res)
        else resolve(null)
      });
    })
  }
  async addPackagesToOrder(data) {
    return new Promise((resolve, reject) => {
      pool.query('INSERT INTO product_confirmation (Id_confirmation, order_product_id, product_number, package_number) VALUES ?', [data], function (error, results, fields) {
        if (error) throw error;
        console.log(results);
        if (results.affectedRows > 0) resolve('success')
        else resolve('Wystąpił błąd serwera')
      });
    })
  }
  async addProductsToOrder(data) {
    return new Promise((resolve, reject) => {
      pool.query('INSERT INTO order_products (order_products_id, product_id, product_amount, order_id) VALUES ?', [data], function (error, results, fields) {
        if (error) throw error;
        // console.log(results);
        if (results.affectedRows > 0) resolve('success')
        else resolve('Wystąpił błąd serwera')
      });
    })
  }
  async addOrder(data) {
    return new Promise((resolve, reject) => {
      pool.query('INSERT INTO orders SET ?', data, function (error, results, fields) {
        if (error) throw error;
        // console.log(results);
        if (results.affectedRows == 1) resolve('success')
        else resolve('Wystąpił błąd serwera')
      });
    })
  }
  async getOrderDataFromId(id) {
    // console.log(id);
    return new Promise((resolve, reject) => {
      pool.query('SELECT * FROM orders WHERE order_id LIKE ?', [id], function (error, results, fields) {
        if (error) throw error;
        // console.log(results);
        if (results.length > 0) resolve(results[0])
        else resolve(null)
      });
    })
  }
  async getOrderStatusId(id) {
    // console.log(id);
    return new Promise((resolve, reject) => {
      pool.query('SELECT * FROM orders WHERE order_id LIKE ?', [id], function (error, results, fields) {
        if (error) throw error;
        // console.log(results);
        if (results.length > 0) resolve(results[0])
        else resolve(null)
      });
    })
  }
  async getUserDataFromOrderId(id) {
    // console.log(id);
    return new Promise((resolve, reject) => {
      pool.query('SELECT * FROM user u INNER JOIN orders o ON u.user_id = o.user_id INNER JOIN company c ON c.user_id = u.user_id WHERE o.order_id LIKE ?', [id], function (error, results, fields) {
        if (error) throw error;
        // console.log(results);
        if (results.length > 0) resolve(results[0])
        else resolve(null)
      });
    })
  }
  async getAllUserDataFromUsername(username) {
    // console.log(username);
    return new Promise((resolve, reject) => {
      pool.query('SELECT *, (SELECT COUNT(o.order_id) FROM orders o WHERE o.user_id = u.user_id) as ilosc_zamowien FROM user u LEFT JOIN company c ON u.user_id = c.user_id WHERE u.username LIKE ?', [username], function (error, results, fields) {
        if (error) throw error;
        // console.log(results[0]);
        if (results.length > 0) resolve(results[0])
        else resolve(null)
      });
    })
  }
  async getAllOrdersFromUser(user_id) {
    return new Promise((resolve, reject) => {
      pool.query('SELECT * FROM orders WHERE user_id = ? ORDER BY date DESC', [user_id], function (error, results, fields) {
        if (error) throw error;
        // console.log(results);
        if (results.length > 0) resolve(results)
        else resolve(null)
      });
    })
  }
  async getAllOrdersFromId(order_id) {
    return new Promise((resolve, reject) => {
      pool.query('SELECT * FROM orders INNER JOIN company ON user.user_id = company.user_id WHERE order_id = ? ORDER BY date DESC', [order_id], function (error, results, fields) {
        if (error) throw error;
        // console.log(results);
        if (results.length > 0) resolve(results)
        else resolve(null)
      });
    })
  }
  async getUserDataFromUserId(user_id) {
    return new Promise((resolve, reject) => {
      pool.query('SELECT * FROM user INNER JOIN company ON user.user_id = company.user_id WHERE user.user_id LIKE ?', [user_id], function (error, results, fields) {
        if (error) throw error;
        // console.log(results);
        if (results.length > 0) resolve(results[0])
        else resolve(null)
      });
    })
  }
  async updateUserData(data) {
    return new Promise((resolve, reject) => {
      pool.query('UPDATE user SET name = ?, surname = ?, avatar = ?, type = ? WHERE user_id LIKE ?', [data.name, data.surname, data.avatar, data.type, data.user_id], function (error, results, fields) {
        if (error) throw error;
        var res = JSON.parse(JSON.stringify(results))
        console.log(res);
        if (res.changedRows > 0) resolve(res)
        else resolve(null)
      });
    })
  }
  async updateCompanyData(data) {
    return new Promise((resolve, reject) => {
      pool.query('UPDATE company SET full_name = ?, short_name = ?, phone = ?, nip = ?, house_number = ?, apartment_number = ?, postal_code = ?, street = ?, house_number = ?, city = ?  WHERE user_id LIKE ?', [data.full_name, data.short_name, data.phone, data.nip, data.house_number, data.apartment_number, data.postal_code, data.street, data.house_number, data.city, data.user_id], function (error, results, fields) {
        if (error) throw error;
        var res = JSON.parse(JSON.stringify(results))
        // console.log(res);
        if (res.changedRows > 0) resolve(res)
        else resolve(null)
      });
    })
  }

  async changeOrderStatusToRecived(order_id) {
    return new Promise((resolve, reject) => {
      pool.query('UPDATE orders SET status = ? WHERE order_id LIKE ?', ['przygotowane', order_id], function (error, results, fields) {
        if (error) throw error;
        var res = JSON.parse(JSON.stringify(results))
        console.log(res);
        if (res.changedRows > 0) resolve(res)
        else resolve(null)
      });
    })
  }
  async updateMyOrderData(data) {
    return new Promise((resolve, reject) => {
      pool.query('UPDATE orders SET customer_name = ?, city = ?, postal_code = ?, street = ?, customer_phone = ?, house_number = ?, apartment_number = ?, price = ?, payment = ?, SMS_from_company = ?, EMAIL_from_company = ?, SMS_from_client = ?, EMAIL_from_client = ?, email_client = ?, email_company = ?, sms_client = ?, sms_company = ?, additional_info = ?, bringing = ?, direction = ? WHERE order_id LIKE ?', [data.customer_name, data.city, data.postal_code, data.street, data.customer_phone, data.house_number, data.apartment_number, data.price, data.payment, data.SMS_from_company, data.EMAIL_from_company, data.SMS_from_client, data.EMAIL_from_client, data.email_client, data.email_company, data.sms_client, data.sms_company, data.additional_info, data.bringing, data.direction, data.order_id], function (error, results, fields) {
        if (error) throw error;
        var res = JSON.parse(JSON.stringify(results))
        // console.log(res);
        if (res.changedRows > 0) resolve(res)
        else resolve(null)
      });
    })
  }
  async updateOrderData(data) {
    return new Promise((resolve, reject) => {
      pool.query('UPDATE orders SET customer_name = ?, city = ?, postal_code = ?, street = ?, customer_phone = ?, house_number = ?, apartment_number = ?, products = ?,  additional_info = ?, price = ?, status = ?, status_details = ?, payment = ?, planned_date = ?, planned_time = ?, planned_delivery_date_status = ?, driver_phone = ?, settled = ?, SMS_from_company = ?, EMAIL_from_company = ?, SMS_from_client = ?, EMAIL_from_client = ?, email_client = ?, email_company = ?, sms_client = ?, sms_company = ?, bringing = ?, direction = ? WHERE order_id LIKE ?', [data.customer_name, data.city, data.postal_code, data.street, data.customer_phone, data.house_number, data.apartment_number, data.products, data.additional_info, data.price, data.status, data.status_details, data.payment, data.planned_date, data.planned_time, data.deliveryConfirmationStatus, data.driver_phone, data.settled, data.SMS_from_company, data.EMAIL_from_company, data.SMS_from_client, data.EMAIL_from_client, data.email_client, data.email_company, data.sms_client, data.sms_company, data.bringing, data.direction, data.order_id], function (error, results, fields) {
        if (error) throw error;
        var res = JSON.parse(JSON.stringify(results))
        // console.log(res);
        if (res.changedRows > 0) resolve(res)
        else resolve(null)
      });
    })
  }
  async getAvatar(username) {
    return new Promise((resolve, reject) => {
      pool.query('SELECT * FROM user WHERE username = ?', [username], function (error, results, fields) {
        if (error) throw error;
        if (results.length > 0 & results[0].avatar != '') resolve(results[0].avatar)
        else resolve(null)
      });
    })
  }
  async getNotificationStatus(id) {
    // console.log(id);
    return new Promise((resolve, reject) => {
      pool.query('SELECT * FROM notifications LEFT JOIN user ON notifications.user_id = user.user_id WHERE notifications.user_id = ?', [id], function (error, results, fields) {
        if (error) throw error;
        // console.log(results[0]);
        if (results.length > 0) resolve(results[0])
        else resolve(null)
      });
    })
  }
  async addNotificationStatus(id) {
    // console.log(id);
    return new Promise((resolve, reject) => {
      pool.query('SELECT user_id FROM notifications WHERE user_id = ?', [id], function (error, results, fields) {
        if (error) throw error;
        if (results.length == 0) {
          return new Promise((resolve, reject) => {
            pool.query('INSERT IGNORE INTO notifications(user_id) VALUES(?)', [id], function (error, results, fields) {
              if (error) throw error;
              resolve(true)
            });
          })
        } else {
          resolve(null)
        }
      });
    })
  }
  async updateNotificationStatus(data) {
    // console.log(data)
    return new Promise((resolve, reject) => {
      pool.query('UPDATE notifications SET SMS_from_company = ?, EMAIL_from_company = ?, SMS_from_client = ?, EMAIL_from_client = ?, EMAIL_undelivered = ? WHERE user_id = ?', [data.SMS_from_company, data.EMAIL_from_company, data.SMS_from_client, data.EMAIL_from_client, data.EMAIL_undelivered, data.user_id], function (error, results, fields) {
        if (error) throw error;
        var res = JSON.parse(JSON.stringify(results))
        console.log(res);
        if (res.changedRows > 0) resolve(res)
        else resolve(null)
      });
    })
  }
  async getProductsFromOrder(order_id) {
    // console.log(order_id);
    return new Promise((resolve, reject) => {
      pool.query('SELECT *, o.product_amount FROM products p INNER JOIN order_products o ON p.product_id = o.product_id WHERE o.order_id LIKE ?', [order_id], (error, results, fields) => {
        if (error) throw error;

        let data = {}
        data.products = results

        pool.query('SELECT * FROM orders WHERE order_id LIKE ?', [order_id], (error, results2, fields) => {
          if (error) throw error;

          data.order = results2[0]

          console.log(data)

          if (results2.length > 0) resolve(data)
          else resolve(null)
        });
      });
    })
  }
  async getShippingLabels(id) {
    // console.log(id);
    return new Promise((resolve, reject) => {
      pool.query('SELECT * FROM product_confirmation pc INNER JOIN order_products op ON pc.order_product_id = op.order_products_id INNER JOIN products p ON op.product_id = p.product_id WHERE op.order_id LIKE ? ORDER BY p.name, pc.product_number, pc.package_number DESC;', [id], function (error, results, fields) {
        if (error) throw error;
        if (results.length > 0) resolve(results)
        else resolve(null)
      });
    })
  }
  async markAsPrinted(ids, date) {
    return new Promise((resolve, reject) => {
      pool.query(`UPDATE orders
                  SET print_date = ?
                  WHERE print_date IS NULL AND order_id IN (?)`, [date, ids], function (error, results, fields) {
        if (error) throw error;
        resolve(results)
      });
    })
  }
  async getAllProductsIDForOrder(order_id) {
    return new Promise((resolve, reject) => {
      pool.query(`SELECT product_id, product_amount FROM order_products WHERE order_id LIKE ?;
                  `, [order_id], function (error, results, fields) {
        if (error) throw error;
        resolve(results)
      });
    })
  }
  async getProductDetails(product_id) {
    return new Promise((resolve, reject) => {
      pool.query(`SELECT name, package_amount FROM products WHERE product_id LIKE ?;
                  `, [product_id], function (error, results, fields) {
        if (error) throw error;
        resolve(results)
      });
    })
  }
  async getPackagesDetailsFromProduct(product_id) {
    return new Promise((resolve, reject) => {
      pool.query(`SELECT width, height, depth, volume, weight FROM packages WHERE product_id LIKE ?;
                  `, [product_id], function (error, results, fields) {
        if (error) throw error;
        resolve(results)
      });
    })
  }
  async changeDeliveryConfirmationChangedBy(order_id, who) {
    return new Promise((resolve, reject) => {
      pool.query(`UPDATE orders SET delivery_confirmation_status_changed_by = ? WHERE order_id LIKE ?;`, [who, order_id], function (error, results, fields) {
        if (error) throw error;
        resolve(results)
      });
    })
  }

	  async setDefaultDeliveryConfirmationStatus(order_id) {
    return new Promise((resolve, reject) => {
      pool.query(`UPDATE orders SET planned_delivery_date_status = 'Nie potwierdzono', confirmation_sms_id='' WHERE order_id LIKE ?;`, [order_id], function (error, results, fields) {
        if (error) throw error;
        resolve(results)
      });
    })
  }
	
  async autoRejectDeliveryDate() {
    return new Promise((resolve, reject) => {
      pool.query(`UPDATE orders SET planned_delivery_date_status = 'Odrzucono', delivery_confirmation_status_changed_by = 'System', confirmation_sms_id = '' WHERE planned_delivery_date_status = 'Nie potwierdzono';`, function (error, results, fields) {
        if (error) throw error;
        resolve(results)
      });
    })
  }
  async addNewCollection(data) {
    return new Promise((resolve, reject) => {
      pool.query(`INSERT INTO collections SET collection_id = ?, user_id = ?, producer_name = ?, producer_address = ?, collection_number = ?, additional_info = ?, status = 'Odbiór zlecony';`,[data.collection_id, data.user_id, data.producer_name, data.producer_address, data.collectionNumber, data.additionalInfo], function (error, results, fields) {
        if (error) throw error;
        resolve(results)
      });
    })
  }
  async addNewCollectionProducts(collection_products_id, collection_id, product) {
    return new Promise((resolve, reject) => {
      pool.query(`INSERT INTO collection_products SET collection_products_id = ?, collection_id = ?, product_id = ?, product_amount = ?;`,[collection_products_id, collection_id, product.product_id, product.amount], function (error, results, fields) {
        if (error) throw error;
        resolve(results)
      });
    })
  }
  async getAllUserCollections(user_id) {
    return new Promise((resolve, reject) => {
      pool.query(`SELECT * FROM collections WHERE user_id LIKE ? ;`,[user_id], function (error, results, fields) {
        if (error) throw error;
        resolve(results)
      });
    })
  }
  async getAllCollections() {
    return new Promise((resolve, reject) => {
      pool.query(`SELECT * FROM collections;`, function (error, results, fields) {
        if (error) throw error;
        resolve(results)
      });
    })
  }
  async getCollectionById(collection_id) {
    return new Promise((resolve, reject) => {
      pool.query(`SELECT * FROM collections WHERE collection_id LIKE ?;`, [collection_id], function (error, results, fields) {
        if (error) throw error;
        resolve(results)
      });
    })
  }
  async getCollectionProducts(collection_id) {
    return new Promise((resolve, reject) => {
      pool.query(`SELECT product_id, product_amount FROM collection_products WHERE collection_id LIKE ? ;`,[collection_id], function (error, results, fields) {
        if (error) throw error;
        resolve(results)
      });
    })
  }
  async getProductDataByID(product_id) {
    return new Promise((resolve, reject) => {
      pool.query(`SELECT product_id, name, package_amount, amount FROM products WHERE product_id LIKE ? ;`,[product_id], function (error, results, fields) {
        if (error) throw error;
        resolve(results)
      });
    })
  }
  async updateCollection(data) {
    return new Promise((resolve, reject) => {
      pool.query(`UPDATE collections SET producer_name = ?, producer_address = ?, collection_number = ?, additional_info = ?, status = ? WHERE collection_id = ?;`,[data.producer_name, data.producer_address, data.collectionNumber, data.additional_info, data.status, data.collection_id], function (error, results, fields) {
        if (error) throw error;
        resolve(results)
      });
    })
  }
  async removeCollectionProducts(collection_id) {
    return new Promise((resolve, reject) => {
      pool.query(`DELETE FROM collection_products WHERE collection_id LIKE ?;`,[collection_id], function (error, results, fields) {
        if (error) throw error;
        resolve(results)
      });
    })
  }
  async updateUserCollection(data) {
    return new Promise((resolve, reject) => {
      pool.query(`UPDATE collections SET producer_name = ?, producer_address = ?, collection_number = ?, additional_info = ? WHERE collection_id = ?;`,[data.producer_name, data.producer_address, data.collectionNumber, data.additional_info, data.collection_id], function (error, results, fields) {
        if (error) throw error;
        resolve(results)
      });
    })
  }
  async addNewCollectionProducts(id, collection_id, product) {
    return new Promise((resolve, reject) => {
      pool.query(`INSERT INTO collection_products SET collection_products_id = ?, collection_id = ?, product_id = ?, product_amount = ?;`,[id, collection_id, product.product_id, product.amount], function (error, results, fields) {
        if (error) throw error;
        resolve(results)
      });
    })
  }


}


// var t = new database()
// t.getUserId('admin2')

module.exports = new database()
