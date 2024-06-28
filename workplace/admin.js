var admin_db = require('./admin_database.js')
var { v4: uuidv4 } = require('uuid');
const moment = require('moment')
var user = require('../workplace/user.js')
var User = new user();

class admin{
  async getAllOrders(){
    return new Promise(async (resolve, reject) => {
      var lastOrders = JSON.parse(JSON.stringify(await admin_db.lastOrders(999)))
      resolve(lastOrders)
    })
  }
  async getAllOrdersToFilter(){
    return new Promise(async (resolve, reject) => {
      var lastOrders = JSON.parse(JSON.stringify(await admin_db.lastOrders(9999)))
      resolve(lastOrders)
    })
  }
  async getAllUsers(){
    return new Promise(async (resolve, reject) => {
      var lastUsers = JSON.parse(JSON.stringify(await admin_db.lastUsers(999)))
      resolve(lastUsers)
    })
  }
  async getDashboardData(){
    return new Promise(async (resolve, reject) => {

      var allUsers = JSON.parse(JSON.stringify(await admin_db.countUsers()))
      var todayUsers = JSON.parse(JSON.stringify(await admin_db.countNewUsers()))
      var allOrders =  JSON.parse(JSON.stringify(await admin_db.countOrders()))
      var todayOrders = JSON.parse(JSON.stringify(await admin_db.countNewOrders()))
      var lastOrders = await User.parseTableRowData(await admin_db.lastOrders(5))
      var lastUsers = await User.parseTableRowDataUsers(await admin_db.lastUsers(5))
      console.log(lastOrders);
      var data = {
        allUsers: allUsers.ilosc,
        todayUsers: todayUsers.ilosc,
        allOrders: allOrders.ilosc,
        todayOrders: todayOrders.ilosc,
        lastOrders: lastOrders,
        lastUsers: lastUsers
      }
      console.log(data);
      resolve(data)
    })
  }
  async getSettleData(order_id){
    return new Promise(async (resolve, reject) => {
      var lastOrders = JSON.parse(JSON.stringify(await admin_db.settleData(order_id)))
      resolve(lastOrders)
    })
  }

  async markAsSettled(order_id){
    return new Promise(async (resolve, reject) => {
      var marked = JSON.parse(JSON.stringify(await admin_db.markAsSettled(order_id)))
      resolve(marked)
    })
  }
  async markAsExported(order_id){
    return new Promise(async (resolve, reject) => {
      var marked = JSON.parse(JSON.stringify(await admin_db.markAsExported(order_id)))
      resolve(marked)
    })
  }

  async getExportToRoutimoData(order_id){
    return new Promise(async (resolve, reject) => {
      var data = JSON.parse(JSON.stringify(await admin_db.getExportToRoutimoData(order_id)))
      resolve(data)
    })
  }

  async saveDeliverySMS(order_id, sms_id){
    return new Promise(async (resolve, reject) => {
      var data = await admin_db.saveDeliverySMS(order_id, sms_id)

      resolve(data)
    })
  }

  async confirmDeliveryDate(sms_id, who){
    return new Promise(async (resolve, reject) => {
      var data = await admin_db.confirmDeliveryDate(sms_id, who)
      resolve(data)
    })
  }
  async rejectDeliveryDate(sms_id, who){
    return new Promise(async (resolve, reject) => {
      var data = await admin_db.rejectDeliveryDate(sms_id, who)
      resolve(data)
    })
  }
  async confirmDeliveryDateByOrderID(order_id, who){
    return new Promise(async (resolve, reject) => {
      var data = await admin_db.confirmDeliveryDateByOrderID(order_id, who)
      resolve(data)
    })
  }

  async rebuildDatabase(){
    return new Promise(async (resolve, reject) => {
      var data = JSON.parse(JSON.stringify(await admin_db.getAllProducts()))
      console.log("PRZEBUDOWA:", data);

      data.forEach(async(product) => {

        for(let i=1; i<=product.package_amount; i++){
          await admin_db.addRowToPackages(uuidv4(), product)
        }

      });

      resolve(data)
    })
  }

  


}

module.exports = admin
