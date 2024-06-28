var {SMSAPI} = require('smsapi')
var smsapi = new SMSAPI('');

class sms{

    async sendTest(number, message){
        return new Promise((resolve, reject)=>{
            const details = {
                test : 1
            }
            const result = smsapi.sms.sendSms(number, message, details);
                
            if(result.error){
                console.log("Błąd w SMS: ", result.error);
                throw error;
            }

            resolve(result)

        })
    }

    async sendDeliveryConfirmation(data){
        return new Promise(async (resolve, reject)=>{
            const details = {
                test : 0,
                from: '2way'
            }

            //dzien tygodnia slownie
            const dayOfWeek = this.getDayOfWeekString(data.planned_date)

            //stworzenie jednego stringa
            const productString = this.getProductString(data.products)


            const message = `Witaj ${data.customer_name}, twoje zamowienie ID: #${data.order_id.slice(0,8)} ${productString} dostarczymy ${data.planned_date} (${dayOfWeek}) ${data.planned_time}. Usluga transportowa nie obejmuje wniesienia. Jesli potwierdzasz termin odpisz TAK w przeciwnym razie NIE. Brak odpowiedzi do godz. 8:00 kolejnego dnia, skutkowac bedzie zmiana terminu. VerniroTrans`
            // const message = `Witaj ${data.customer_name}, twoje zamówienie ID: #${data.order_id.slice(0,8)}`


            await smsapi.sms.sendSms(data.customer_phone, message, details)
            .then(result =>{
                
                resolve(result)
            })
            .catch(error => {
                console.log("Błąd w SMS: ", error)
                resolve(null)
            })         

        })
    }

    getProductString(products){
        let productString = ''

        products.forEach(product=>{
            //usuniecie polskich znakow
            let replacedProduct = this.replacePolishSigns(product)
            productString= productString + replacedProduct + ', ';
        })
        productString = productString.slice(0, -2);
        return productString
    }


    getDayOfWeekString(date){
        // dzień tygodnia
            var dateParts = date.split('.'); // Rozdziela datę na części

            // Pobiera poszczególne części daty
            var day = parseInt(dateParts[0], 10);
            var month = parseInt(dateParts[1], 10) - 1; // Odejmuje 1 od miesiąca, ponieważ indeksy miesięcy w obiekcie Date zaczynają się od 0
            var year = parseInt(dateParts[2], 10);
            var newDate = new Date(year, month, day );
            const computedDayOfWeek = newDate.getDay();

            var dayOfWeek = ['niedziela', 'poniedzialek', 'wtorek', 'sroda', 'czwartek', 'piatek', 'sobota'][computedDayOfWeek];
            return dayOfWeek;
    }

    replacePolishSigns(string){

        string=string.replace("ę","e");
        string=string.replace("ó","o");
        string=string.replace("ą","a");
        string=string.replace("ś","s");
        string=string.replace("ł","l");
        string=string.replace("ż","z");
        string=string.replace("ź","z");
        string=string.replace("ć","c");
        string=string.replace("ń","n");
        string=string.replace("Ę","E");
        string=string.replace("Ó","O");
        string=string.replace("Ą","A");
        string=string.replace("Ś","S");
        string=string.replace("Ł","L");
        string=string.replace("Ż","Z");
        string=string.replace("Ź","Z");
        string=string.replace("Ć","C");
        string=string.replace("Ń","N");
        return string
    }
}

module.exports = new sms()