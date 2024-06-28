var mysql = require('mysql');
var pool  = mysql.createPool({
  connectionLimit : 10,
  host            : 'localhost',
  user            : 'hidden',
  password        : 'hidden',
  database        : 'hidden',
  timezone        : 'UTC'
});

class database{
  async countUsers(login, password){
    return new Promise((resolve, reject) => {
      pool.query('SELECT COUNT(user_id) as ilosc FROM user', function (error, results, fields) {
        if (error) throw error;
        resolve(results[0])
      });
    })
  }
  async countNewUsers(login, password){
    return new Promise((resolve, reject) => {
      pool.query('SELECT COUNT(user_id) as ilosc FROM user WHERE CAST(create_date AS DATE) = CAST(CURRENT_TIMESTAMP() AS DATE) ', function (error, results, fields) {
        if (error) throw error;
        resolve(results[0])
      });
    })
  }
  async countOrders(){
    return new Promise((resolve, reject) => {
      pool.query('SELECT COUNT(order_id) as ilosc FROM orders', function (error, results, fields) {
        if (error) throw error;
        resolve(results[0])
      });
    })
  }
  async countNewOrders(){
    return new Promise((resolve, reject) => {
      pool.query('SELECT COUNT(order_id) as ilosc FROM orders WHERE CAST(date AS DATE) = CAST(CURRENT_TIMESTAMP() AS DATE) ', function (error, results, fields) {
        if (error) throw error;
        resolve(results[0])
      });
    })
  }
  async lastOrders(limit){
    return new Promise((resolve, reject) => {
      pool.query('SELECT * FROM orders o INNER JOIN user u ON o.user_id = u.user_id ORDER BY date DESC LIMIT ? ', [limit], function (error, results, fields) {
        if (error) throw error;
        resolve(results)
      });
    })
  }
  async lastUsers(limit){
    return new Promise((resolve, reject) => {
      pool.query('SELECT *, (SELECT COUNT(o.order_id) FROM orders o WHERE o.user_id = u.user_id) as ilosc_zamowien FROM user u ORDER BY u.create_date DESC LIMIT ? ',[limit], function (error, results, fields) {
        if (error) throw error;
        resolve(results)
      });
    })
  }

  async settleData(order_id){
    return new Promise((resolve, reject) => {
      pool.query(`SELECT orders.order_id, orders.customer_name, orders.city, orders.postal_code, orders.street, orders.house_number, orders.apartment_number, orders.date, 
                  orders.bringing,
                  IF(orders.payment = 'Pobranie', orders.price, 0) AS price,
                  company.short_name,
                  company.company_id,
                  COUNT(product_confirmation.package_number) AS package_number,
                  GROUP_CONCAT(DISTINCT products.name SEPARATOR ', ') AS product_name
                  FROM orders
                  INNER JOIN company 
                  ON company.user_id = orders.user_id
                  INNER JOIN order_products 
                  ON order_products.order_id = orders.order_id
                  INNER JOIN product_confirmation 
                  ON product_confirmation.order_product_id = order_products.order_products_id
                  INNER JOIN products
                  ON products.product_id = order_products.product_id
                  WHERE orders.order_id = ?
                  GROUP BY orders.order_id; `,[order_id], function (error, results, fields) {
        if (error) throw error;
        resolve(results)
      });
    })
  }
  async markAsSettled(order_id){
    return new Promise((resolve, reject) => {
      pool.query(`UPDATE orders
                  SET settled = 'Tak'
                  WHERE order_id IN (?)`,[order_id], function (error, results, fields) {
        if (error) throw error;
        resolve(results)
      });
    })
  }
  async markAsExported(order_id){
    return new Promise((resolve, reject) => {
      pool.query(`UPDATE orders
                  SET exported = 'Tak'
                  WHERE order_id IN (?)`,[order_id], function (error, results, fields) {
        if (error) throw error;
        resolve(results)
      });
    })
  }

  async getExportToRoutimoData(order_id){
    return new Promise((resolve, reject) => {
      pool.query(`SELECT order_id, customer_name, city, postal_code, street, customer_phone, house_number, apartment_number, additional_info, planned_date, planned_time 
      FROM orders 
      WHERE order_id = (?);`,order_id, function (error, results, fields) {
        if (error) throw error;
        resolve(results)
      });
    })
  }

  async getAllProducts(){
    return new Promise((resolve, reject) => {
      pool.query(`SELECT * FROM products LIMIT 5`, function (error, results, fields) {
        if (error) throw error;
        resolve(results)
      });
    })
  }

  async getAllProducts(){
    return new Promise((resolve, reject) => {
      pool.query(`SELECT * FROM products`, function (error, results, fields) {
        if (error) throw error;
        resolve(results)
      });
    })
  }
  async addRowToPackages(package_id, product){
    return new Promise((resolve, reject) => {
      pool.query(`INSERT INTO packages SET package_id = ?, product_id = ?, width = ?, height = ?, depth = ?, volume = ?, weight = ?`,[package_id, product.product_id, product.width, product.height, product.depth, product.volume, product.weight] , function (error, results, fields) {
        if (error) throw error;
        resolve(results)
      });
    })
  }
  async saveDeliverySMS(order_id, sms_id){
    return new Promise((resolve, reject) => {
      pool.query(`UPDATE orders SET planned_delivery_date_status = 'Nie potwierdzono', confirmation_sms_id = ? WHERE order_id = ?`,[sms_id, order_id] , function (error, results, fields) {
        if (error) throw error;
        resolve(results)
      });
    })
  }
  async confirmDeliveryDate(sms_id, who){
    return new Promise((resolve, reject) => {
      pool.query(`UPDATE orders SET planned_delivery_date_status = 'Potwierdzono', delivery_confirmation_status_changed_by = ? WHERE confirmation_sms_id = ?`,[who, sms_id] , function (error, results, fields) {
        if (error) throw error;
        resolve(results)
      });
    })
  }
  async rejectDeliveryDate(sms_id, who){
    return new Promise((resolve, reject) => {
      pool.query(`UPDATE orders SET planned_delivery_date_status = 'Odrzucono', delivery_confirmation_status_changed_by = ? WHERE confirmation_sms_id = ?`,[who, sms_id] , function (error, results, fields) {
        if (error) throw error;
        resolve(results)
      });
    })
  }
  async confirmDeliveryDateByOrderID(order_id, who){
    return new Promise((resolve, reject) => {
      pool.query(`UPDATE orders SET planned_delivery_date_status = 'Potwierdzono', delivery_confirmation_status_changed_by = ? WHERE order_id = ?`,[who, order_id] , function (error, results, fields) {
        if (error) throw error;
        resolve(results)
      });
    })
  }
  
}

// var t = new database()
// t.getUserId('admin2')

module.exports = new database()
