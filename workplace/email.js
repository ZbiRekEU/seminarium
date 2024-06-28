var fs = require("fs");
var nodemailer = require("nodemailer");
var express = require('express')
var app = express()
var fs = require('fs')
var path = require('path');
let ejs = require('ejs')


var transporter = nodemailer.createTransport({
  host: 'mail.mayam.pl',
  port: 587,
  secureConnection: true,
  auth: {
      user: 'powiadomienia@verniro-trans.pl',
      pass: 'c0dM39@i'
  },
  tls: {
    rejectUnauthorized: false
  },
  dkim: {
    domainName: "verniro-trans.pl",
    keySelector: "1622390744.trans",
    privateKey: fs.readFileSync(path.join(__dirname, '/dkim/privatekey.txt'), 'utf8')
  }
  //1622390744.trans - selektor

});

class email {
  async sendRecoveryMail(email, pass_id){
    var link = "https://system.verniro-trans.pl/ustaw-haslo?code=" + pass_id
    return new Promise((resolve, reject) => {
      let str = fs.readFileSync('./views/Email/zmiana-hasla.ejs', 'utf8')
   
      let template = ejs.compile(str);
       let html = template({data: link});
       console.log(html)
      const mainOptions = {
        from: '"Verniro Trans" kontakt@verniro-trans.pl',
        to: email,
        subject: 'Zmiana hasła do konta!',
        html: html,
        text: 'Aby zmienić hasło do swojego konta wejdź w ten link: ' + link,
        attachments: [{
          filename: 'logo.png',
          path: './public/assets/images/logo-white.png',
          cid: 'unique@logowhite.ee' //same cid value as in the html img src
      }]
      };

        // console.log("html data ======================>", mainOptions.html);
        transporter.sendMail(mainOptions, function (err, info) {
          if (err) {
            console.log(err);
            resolve({data: null, error: err})
          } else {

            resolve({data: info.response, error: null})
            console.log('Message sent: ' + info.response);
          }
        })

      })
    }
    async sendRegisterMail(email, username){
      return new Promise((resolve, reject) => {
        let str = fs.readFileSync('./views/Email/rejestracja.ejs', 'utf8')
   
        let template = ejs.compile(str);
        let html = template({data: username});
        console.log(html)


        const mainOptions = {
          from: '"Verniro Trans" kontakt@verniro-trans.pl',
          to: email,
          subject: 'Twoje konto zostało utworzone',
          html: html,
          text: 'Pomyślnie utworzono konto: ' + username + ', zaloguj się na https://system.verniro-trans.pl',
          attachments: [{
            filename: 'logo.png',
            path: './public/assets/images/logo-white.png',
            cid: 'unique@logowhite.ee' //same cid value as in the html img src
        }]
        };

          // console.log("html data ======================>", mainOptions.html);
          transporter.sendMail(mainOptions, function (err, info) {
            if (err) {
              console.log(err);
              resolve({data: null, error: err})
            } else {

              resolve({data: info.response, error: null})
              console.log('Message sent: ' + info.response);
            }
          })

        })
  
      }
			async sendNotificationCompany(data){
				return new Promise((resolve, reject) => {
					let str = fs.readFileSync('./views/Email/potwierdzenie-firma.ejs', 'utf8')
		 
					let template = ejs.compile(str);
					let html = template({data});

					const mainOptions = {
						from: '"Verniro Trans" powiadomienia@verniro-trans.pl',
						to: data.order.email_company,
						subject: `Zmiana statusu zamówienia do ${data.order.customer_name} o numerze ${data.order.order_id.split('-')[0]}`,
						html: html,
						text: `Zmiana statusu zamówienia
						
						Zamówienie ${data.order.order_id} zostało ${data.order.status}
						
						Poniżej znajdują się szczegóły realizowanego zamówienia.
						Dane klienta
						Numer zamówienia	${data.order.order_id}
						Imię i Nazwisko	${data.order.customer_name}
						Miasto	${data.order.city}
						Ulica	${data.order.street}
						Kod pocztowy	${data.order.postal_code}
						Numer domu	${data.order.house_number}
						Mieszkanie	${data.order.apartament_number}`,//TODO?: For products
						attachments: [{
							filename: 'logo.png',
							path: './public/assets/images/logo-white.png',
							cid: 'unique@logowhite.ee' //same cid value as in the html img src
						}]
					};

					transporter.sendMail(mainOptions, (err, info) => {
							if (err) {
								console.log(err);
								resolve({data: null, error: err})
							} else {
								console.log('Message sent: ' + info.response);
								resolve({data: info.response, error: null})
							}
					})

				})
			}
			async sendNotificationClient(data){
				return new Promise((resolve, reject) => {
					let str = fs.readFileSync('./views/Email/potwierdzenie-klient.ejs', 'utf8')
		 
					let template = ejs.compile(str);
					let html = template({data});
	
					const mainOptions = {
						from: '"Verniro Trans" powiadomienia@verniro-trans.pl',
						to: data.order.email_client,
						subject: `Zmiana statusu Twojego zamówienia o numerze ${data.order.order_id.split('-')[0]}`,
						html: html,
						text: `Zmiana statusu Twojego zamówienia
						
						Zamówienie ${data.order.order_id} zostało ${data.order.status}
						
						Poniżej znajdują się szczegóły realizowanego zamówienia.
						Dane klienta
						Numer zamówienia	${data.order.order_id}
						Imię i Nazwisko	${data.order.customer_name}
						Miasto	${data.order.city}
						Ulica	${data.order.street}
						Kod pocztowy	${data.order.postal_code}
						Numer domu	${data.order.house_number}
						Mieszkanie	${data.order.apartament_number}`,//TODO?: For products
						attachments: [{
							filename: 'logo.png',
							path: './public/assets/images/logo-white.png',
							cid: 'unique@logowhite.ee' //same cid value as in the html img src
						}]
					};

					transporter.sendMail(mainOptions, (err, info) => {
							if (err) {
								console.log(err);
								resolve({data: null, error: err})
							} else {
								console.log('Message sent: ' + info.response);
								resolve({data: info.response, error: null})
							}
					})

				})
			}
}



module.exports = email
